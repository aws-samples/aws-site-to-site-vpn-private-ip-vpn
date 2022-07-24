<!-- BEGIN_TF_DOCS -->
# AWS Site-to-Site VPN Private IP VPN - Terraform

This repository contains terraform code to deploy an AWS Site-to-Site VPN Private IP VPN over AWS Direct Connect. The following resources are created by default:

- Direct Connect gateway. By default, both examples create a new Direct Connect gateway resource. If you want to test this code over an existing Direct Connect gateway, check each specific example to understand how you can configure this.
- Customer gateway, and **AWS Site-to-Site VPN Private IP VPN**.
- AWS Transit Gateway, and one Transit Gateway Route Table where all the VPCs and the VPN will be associated and they will propagate their routes.
- Two Spoke VPCs, each of them with EC2 instances and VPC endpoints (AWS Systems Manager) to test the end-to-end connectivity.

In both examples, the following variables are defined with default values:

- ASN numbers: AWS-side (for the Transit Gateway and the Direct Connect gateway), and customer-side (for the Customer gateway).
- Transit Gateway CIDR block - used for the private Outer IPs when creating the VPN.
- Allowed prefixes - AWS-side CIDR blocks to add in the Direct Connect gateway (if created)
- Customer gateway IP - use the private IP of your device on premises.

Feel free to change these variables (check each example to see how you can do that) to build the Private IP VPN connection with values from your hybrid network.

![Architecture diagram](../images/aws\_s2s\_private\_ip\_vpn.png)

**The resources deployed and the architectural pattern they follow is purely for demonstration/testing purposes**. Take it as an example on how to create all the necessary resources to build a Private IP VPN on top of a Direct Connect connection. The AWS Direct Connect connection and Transit VIF required to finish the end-to-end connectivity are not built in this example. The configuration of the VPN tunnels in the on-premises routers is done as an usual AWS Site-to-Site VPN connection (check the documentation in the *References* section).

## Usage

- Clone the repository
- Edit the *variables.tf* file (in the root directory) to configure the AWS Region to use, the project identifier, and the number of Availability Zones to use. Edit the *locals.tf* (in the root directory) to configure the VPCs to create.
- To change the configuration about the Security Groups and VPC endpoints to create, edit the *locals.tf* file in the project root directory.
- Initialize Terraform using `terraform init`.
- Now you can deploy the rest of the infrastructure using `terraform apply`.
- To delete everything, use `terraform destroy`.

**Note** The default number of Availability Zones to use in the VPCs is 1. To follow best practices, each resource - EC2 instance, and VPC endpoints - will be created in each Availability Zone. **Keep this in mind** to avoid extra costs unless you are happy to deploy more resources and accept additional costs.

## References

- AWS Blog: [Introducing AWS Site-to-Site VPN Private IP VPNs](https://aws.amazon.com/blogs/networking-and-content-delivery/introducing-aws-site-to-site-vpn-private-ip-vpns/)
- AWS Documentation: [AWS Site-to-Site VPN - Getting Started](https://docs.aws.amazon.com/vpn/latest/s2svpn/SetUpVPNConnections.html)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | 4.20.0 |
| <a name="requirement_awscc"></a> [awscc](#requirement\_awscc) | 0.25.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | 4.20.0 |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_compute"></a> [compute](#module\_compute) | ./modules/compute | n/a |
| <a name="module_iam_kms"></a> [iam\_kms](#module\_iam\_kms) | ./modules/iam_kms | n/a |
| <a name="module_vpc_endpoints"></a> [vpc\_endpoints](#module\_vpc\_endpoints) | ./modules/vpc_endpoints | n/a |
| <a name="module_vpcs"></a> [vpcs](#module\_vpcs) | aws-ia/vpc/aws | 1.4.1 |

## Resources

| Name | Type |
|------|------|
| [aws_customer_gateway.cgw](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/customer_gateway) | resource |
| [aws_dx_gateway.dxgw](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/dx_gateway) | resource |
| [aws_dx_gateway_association.dxgw_tgw_association](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/dx_gateway_association) | resource |
| [aws_ec2_transit_gateway.tgw](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway) | resource |
| [aws_ec2_transit_gateway_route_table.tgw_rt](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway_route_table) | resource |
| [aws_ec2_transit_gateway_route_table_association.spoke_tgw_association](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway_route_table_association) | resource |
| [aws_ec2_transit_gateway_route_table_association.vpn_tgw_association](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway_route_table_association) | resource |
| [aws_ec2_transit_gateway_route_table_propagation.spoke_tgw_propagation](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway_route_table_propagation) | resource |
| [aws_ec2_transit_gateway_route_table_propagation.vpn_tgw_propagation](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/ec2_transit_gateway_route_table_propagation) | resource |
| [aws_vpn_connection.private_ip_vpn](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/resources/vpn_connection) | resource |
| [aws_ec2_transit_gateway_dx_gateway_attachment.tgw_dxgw_attachment](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/data-sources/ec2_transit_gateway_dx_gateway_attachment) | data source |
| [aws_ec2_transit_gateway_vpn_attachment.vpn_tgw_attachment](https://registry.terraform.io/providers/hashicorp/aws/4.20.0/docs/data-sources/ec2_transit_gateway_vpn_attachment) | data source |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_asn_numbers"></a> [asn\_numbers](#input\_asn\_numbers) | ASNs to configure in the different resources: Direct Connect gateway, Transit Gateway, and Customer gateway (on premises). Remember that all the ASNs cannot overlap between them. | <pre>object({<br>    amazon_side_dxgw = string<br>    amazon_side_tgw  = string<br>    customer_side    = number<br>  })</pre> | <pre>{<br>  "amazon_side_dxgw": "64531",<br>  "amazon_side_tgw": "64532",<br>  "customer_side": 64533<br>}</pre> | no |
| <a name="input_aws_region"></a> [aws\_region](#input\_aws\_region) | AWS Region to spin up the resources. | `string` | `"us-west-1"` | no |
| <a name="input_customer_gateway_ip"></a> [customer\_gateway\_ip](#input\_customer\_gateway\_ip) | IPv4 private address of your Customer gateway (CGW). | `string` | `"10.0.0.1"` | no |
| <a name="input_dxgw_allowed_prefixes"></a> [dxgw\_allowed\_prefixes](#input\_dxgw\_allowed\_prefixes) | Allowed prefixes. This value is indicated when the Direct Connect gateway is associated to the Transit Gateway. The list of prefixes specified here are the CIDR announcements to on premises. | `list(string)` | <pre>[<br>  "10.0.0.0/8"<br>]</pre> | no |
| <a name="input_dxgw_id"></a> [dxgw\_id](#input\_dxgw\_id) | ID of the Direct Connect gateway to use for the Private IP VPN connection creation. If no ID is defined, this repository will create one. | `string` | `""` | no |
| <a name="input_identifier"></a> [identifier](#input\_identifier) | Project identifier. This value will be added to all the resources names. | `string` | `"private-ip-vpn-example"` | no |
| <a name="input_tgw_cidr_blocks"></a> [tgw\_cidr\_blocks](#input\_tgw\_cidr\_blocks) | Transit Gateway CIDR blocks. | `list(string)` | <pre>[<br>  "10.0.0.0/24"<br>]</pre> | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_customer_gateway_id"></a> [customer\_gateway\_id](#output\_customer\_gateway\_id) | Customer Gateway ID. |
| <a name="output_dx_gateway_id"></a> [dx\_gateway\_id](#output\_dx\_gateway\_id) | AWS Direct Connect gateway ID (if created). |
| <a name="output_ec2_instances"></a> [ec2\_instances](#output\_ec2\_instances) | EC2 instances created. |
| <a name="output_private_ip_vpn_id"></a> [private\_ip\_vpn\_id](#output\_private\_ip\_vpn\_id) | AWS Site-to-Site Private IP VPN ID. |
| <a name="output_ssm_endpoints"></a> [ssm\_endpoints](#output\_ssm\_endpoints) | SSM endpoints created. |
| <a name="output_transit_gateway_id"></a> [transit\_gateway\_id](#output\_transit\_gateway\_id) | Transit Gateway ID. |
| <a name="output_vpcs"></a> [vpcs](#output\_vpcs) | VPC IDs created. |
<!-- END_TF_DOCS -->