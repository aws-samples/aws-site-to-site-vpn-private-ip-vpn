# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# --- root/outputs.tf ---

output "dx_gateway_id" {
    description = "AWS Direct Connect gateway ID (if created)."
  value = var.dxgw_id == "" ? aws_dx_gateway.dxgw[0].id : null
}

output "transit_gateway_id" {
    description = "Transit Gateway ID."
    value = aws_ec2_transit_gateway.tgw.id
}

output "customer_gateway_id" {
    description = "Customer Gateway ID."
    value = aws_customer_gateway.cgw.id
}

output "private_ip_vpn_id" {
    description = "AWS Site-to-Site Private IP VPN ID."
    value = aws_vpn_connection.private_ip_vpn.id
}

output "vpcs" {
    description = "VPC IDs created."
    value = { for k, v in module.vpcs: k => v.vpc_attributes.id }
}

output "ec2_instances" {
    description = "EC2 instances created."
    value = module.compute
}

output "ssm_endpoints" {
    description = "SSM endpoints created."
    value = module.vpc_endpoints
}