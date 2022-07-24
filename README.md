# AWS Site-to-Site VPN Private IP VPN

This sample contains [Terraform](./terraform) and [AWS CDK](./cdk) code to deploy an AWS Site-to-Site VPN Private IP VPN over AWS Direct Connect. In both examples, the following resources are created by default:

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

![Architecture diagram](./images/aws_s2s_private_ip_vpn.png)

**The resources deployed and the architectural pattern they follow is purely for demonstration/testing purposes**. Take it as an example on how to create all the necessary resources to build a Private IP VPN on top of a Direct Connect connection. The AWS Direct Connect connection and Transit VIF required to finish the end-to-end connectivity are not built in this example. The configuration of the VPN tunnels in the on-premises routers is done as an usual AWS Site-to-Site VPN connection (check the documentation in the *References* section).

## References

- AWS Blog: [Introducing AWS Site-to-Site VPN Private IP VPNs](https://aws.amazon.com/blogs/networking-and-content-delivery/introducing-aws-site-to-site-vpn-private-ip-vpns/)
- AWS Documentation: [AWS Site-to-Site VPN - Getting Started](https://docs.aws.amazon.com/vpn/latest/s2svpn/SetUpVPNConnections.html)

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
