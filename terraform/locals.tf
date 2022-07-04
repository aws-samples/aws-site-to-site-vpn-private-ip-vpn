# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# --- root/locals.tf ---

locals {
  dxgw_id = var.dxgw_id == "" ? aws_dx_gateway.dxgw[0].id : var.dxgw_id

  spoke_vpcs = {
    spoke-vpc-a = {
      cidr_block      = "10.0.0.0/24"
      private_subnets = ["10.0.0.0/26", "10.0.0.64/26", "10.0.0.128/26"]
      tgw_subnets     = ["10.0.0.192/28", "10.0.0.208/28", "10.0.0.224/28"]
      number_azs      = 1
      instance_type   = "t2.micro"
      # VPC Flow log type / Default: ALL - Other options: ACCEPT, REJECT
      flow_log_config = {
        log_destination_type = "cloud-watch-logs" # Options: "cloud-watch-logs", "s3", "none"
        retention_in_days    = 7
      }
    }
    spoke-vpc-b = {
      cidr_block      = "10.0.1.0/24"
      private_subnets = ["10.0.1.0/26", "10.0.1.64/26", "10.0.1.128/26"]
      tgw_subnets     = ["10.0.1.192/28", "10.0.1.208/28", "10.0.1.224/28"]
      number_azs      = 1
      instance_type   = "t2.micro"
      flow_log_config = {
        log_destination_type = "cloud-watch-logs" # Options: "cloud-watch-logs", "s3", "none"
        retention_in_days    = 7
      }
    }
  }

  security_groups = {
    instance = {
      name        = "instance_sg"
      description = "Security Group used in the EC2 instances"
      ingress = {
        icmp = {
          description = "Allowing ICMP traffic"
          from        = -1
          to          = -1
          protocol    = "icmp"
          cidr_blocks = ["0.0.0.0/0"]
        }
        http = {
          description = "Allowing HTTP traffic"
          from        = 80
          to          = 80
          protocol    = "tcp"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }
      egress = {
        any = {
          description = "Any traffic"
          from        = 0
          to          = 0
          protocol    = "-1"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }
    }
    endpoints = {
      name        = "endpoints_sg"
      description = "Security Group for SSM connection"
      ingress = {
        https = {
          description = "Allowing HTTPS"
          from        = 443
          to          = 443
          protocol    = "tcp"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }
      egress = {
        any = {
          description = "Any traffic"
          from        = 0
          to          = 0
          protocol    = "-1"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }
    }
  }

  endpoint_service_names = {
    ssm = {
      name        = "com.amazonaws.${var.aws_region}.ssm"
      type        = "Interface"
      private_dns = true
    }
    ssmmessages = {
      name        = "com.amazonaws.${var.aws_region}.ssmmessages"
      type        = "Interface"
      private_dns = true
    }
    ec2messages = {
      name        = "com.amazonaws.${var.aws_region}.ec2messages"
      type        = "Interface"
      private_dns = true
    }
  }
}


