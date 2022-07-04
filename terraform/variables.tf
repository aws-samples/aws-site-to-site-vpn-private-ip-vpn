# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# --- root/variables.tf ---

# Project Identifier
variable "identifier" {
  type        = string
  description = "Project identifier. This value will be added to all the resources names."

  default = "private-ip-vpn-example"
}

# AWS REGION
variable "aws_region" {
  type        = string
  description = "AWS Region to spin up the resources."

  default = "us-west-1"
}

# Direct Connect gateway ID
variable "dxgw_id" {
  type = string
  description = "ID of the Direct Connect gateway to use for the Private IP VPN connection creation. If no ID is defined, this repository will create one."

  default = ""
}

# ASNs
variable "asn_numbers" {
  description = "ASNs to configure in the different resources: Direct Connect gateway, Transit Gateway, and Customer gateway (on premises). Remember that all the ASNs cannot overlap between them."
  type = object({
    amazon_side_dxgw = string
    amazon_side_tgw  = string
    customer_side    = number
  })

  default = {
    amazon_side_dxgw = "64531"
    amazon_side_tgw  = "64532"
    customer_side    = 64533
  }
}

# Transit Gateway CIDR blocks
variable "tgw_cidr_blocks" {
  type        = list(string)
  description = "Transit Gateway CIDR blocks."

  default = [
    "10.0.0.0/24"
  ]
}

# Allowed prefixes
variable "dxgw_allowed_prefixes" {
  type        = list(string)
  description = "Allowed prefixes. This value is indicated when the Direct Connect gateway is associated to the Transit Gateway. The list of prefixes specified here are the CIDR announcements to on premises."

  default = [
    "10.0.0.0/8"
  ]

}

# Customer Gateway IP
variable "customer_gateway_ip" {
  type        = string
  description = "IPv4 private address of your Customer gateway (CGW)."

  default = "10.0.0.1"
}

