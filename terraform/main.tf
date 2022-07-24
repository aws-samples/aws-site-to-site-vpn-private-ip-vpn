# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# --- root/main.tf ---

# AWS SITE-TO-SITE VPN PRIVATE IP VPN WALKTHROUGH
# Step 1: Creation of the Direct Connect gateway
resource "aws_dx_gateway" "dxgw" {
  count = var.dxgw_id == "" ? 1 : 0

  name            = "dxgw-${var.identifier}"
  amazon_side_asn = var.asn_numbers.amazon_side_dxgw
}

# Step 2: Creation of the AWS Transit Gateway
resource "aws_ec2_transit_gateway" "tgw" {
  amazon_side_asn                 = var.asn_numbers.amazon_side_tgw
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  description                     = "transit_gateway-${var.identifier}"

  transit_gateway_cidr_blocks = var.tgw_cidr_blocks

  tags = {
    Name = "transit_gateway-${var.identifier}"
  }
}

# Step 3: Transit Gateway association to the Direct Connect gateway
resource "aws_dx_gateway_association" "dxgw_tgw_association" {
  dx_gateway_id         = local.dxgw_id
  associated_gateway_id = aws_ec2_transit_gateway.tgw.id

  allowed_prefixes = var.dxgw_allowed_prefixes
}

data "aws_ec2_transit_gateway_dx_gateway_attachment" "tgw_dxgw_attachment" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  dx_gateway_id      = local.dxgw_id

  depends_on = [
    aws_dx_gateway_association.dxgw_tgw_association
  ]
}

# Step 4: Creation of the Customer gateway (CGW)
resource "aws_customer_gateway" "cgw" {
  bgp_asn    = var.asn_numbers.customer_side
  ip_address = var.customer_gateway_ip
  type       = "ipsec.1"

  tags = {
    Name = "customer_gateway-${var.identifier}"
  }
}

# Step 5: Creation of the AWS Site-to-Site Private IP VPN
resource "aws_vpn_connection" "private_ip_vpn" {
  customer_gateway_id                     = aws_customer_gateway.cgw.id
  outside_ip_address_type                 = "PrivateIpv4"
  transit_gateway_id                      = aws_ec2_transit_gateway.tgw.id
  transport_transit_gateway_attachment_id = data.aws_ec2_transit_gateway_dx_gateway_attachment.tgw_dxgw_attachment.id
  type                                    = "ipsec.1"

  tags = {
    Name = "vpn-${var.identifier}"
  }
}

data "aws_ec2_transit_gateway_vpn_attachment" "vpn_tgw_attachment" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  vpn_connection_id  = aws_vpn_connection.private_ip_vpn.id
}

# OTHER RESOURCES
# Spoke VPCs (from locals.tf)
module "vpcs" {
  for_each = local.spoke_vpcs
  source   = "aws-ia/vpc/aws"
  version  = "1.4.1"

  name       = each.key
  cidr_block = each.value.cidr_block
  az_count   = each.value.number_azs

  subnets = {
    private = {
      name_prefix  = "private"
      cidrs        = slice(each.value.private_subnets, 0, each.value.number_azs)
      route_to_nat = false
      route_to_transit_gateway = ["0.0.0.0/0"]
    }
    transit_gateway = {
      name_prefix                                     = "tgw"
      cidrs                                           = slice(each.value.tgw_subnets, 0, each.value.number_azs)
      transit_gateway_id                              = aws_ec2_transit_gateway.tgw.id
      transit_gateway_default_route_table_association = false
      transit_gateway_default_route_table_propagation = false
    }
  }

  vpc_flow_logs = {
    log_destination_type = each.value.flow_log_config.log_destination_type
    retention_in_days    = each.value.flow_log_config.retention_in_days
    iam_role_arn         = module.iam_kms.vpc_flowlog_role
    kms_key_id           = module.iam_kms.kms_arn
  }
}

# Transit Gateway Route Table, Associations, and Propagations
resource "aws_ec2_transit_gateway_route_table" "tgw_rt" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  tags = {
    Name = "tgw-rt-${var.identifier}"
  }
}

# Transit Gateway Associations
resource "aws_ec2_transit_gateway_route_table_association" "spoke_tgw_association" {
  for_each = module.vpcs

  transit_gateway_attachment_id  = each.value.transit_gateway_attachment_id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.tgw_rt.id
}

resource "aws_ec2_transit_gateway_route_table_association" "vpn_tgw_association" {
  transit_gateway_attachment_id  = data.aws_ec2_transit_gateway_vpn_attachment.vpn_tgw_attachment.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.tgw_rt.id
}

# Transit Gateway Propagations
resource "aws_ec2_transit_gateway_route_table_propagation" "spoke_tgw_propagation" {
  for_each = module.vpcs

  transit_gateway_attachment_id  = each.value.transit_gateway_attachment_id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.tgw_rt.id
}

resource "aws_ec2_transit_gateway_route_table_propagation" "vpn_tgw_propagation" {
  transit_gateway_attachment_id  = data.aws_ec2_transit_gateway_vpn_attachment.vpn_tgw_attachment.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.tgw_rt.id
}

# EC2 Instances
module "compute" {
  for_each = module.vpcs
  source   = "./modules/compute"

  identifier               = var.identifier
  vpc_name                 = each.key
  vpc_id                   = each.value.vpc_attributes.id
  vpc_subnets              = values({ for k, v in each.value.private_subnet_attributes_by_az : k => v.id })
  number_azs               = local.spoke_vpcs[each.key].number_azs
  instance_type            = local.spoke_vpcs[each.key].instance_type
  ec2_iam_instance_profile = module.iam_kms.ec2_iam_instance_profile
  ec2_security_group       = local.security_groups.instance
}

# VPC endpoints
module "vpc_endpoints" {
  for_each = module.vpcs
  source   = "./modules/vpc_endpoints"

  identifier               = var.identifier
  vpc_name                 = each.key
  vpc_id                   = each.value.vpc_attributes.id
  vpc_subnets              = values({ for k, v in each.value.private_subnet_attributes_by_az : k => v.id })
  endpoints_security_group = local.security_groups.endpoints
  endpoints_service_names  = local.endpoint_service_names
}

# IAM Roles and KMS Key used in several resources (EC2 instances, and VPC Flow Logs)
module "iam_kms" {
  source     = "./modules/iam_kms"
  identifier = var.identifier
  aws_region = var.aws_region
}

