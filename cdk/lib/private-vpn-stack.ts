import * as cdk from 'aws-cdk-lib';
import { Config } from "./build-config";
import { CfnOutput, Names, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cr from 'aws-cdk-lib/custom-resources';

export class VpnStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // AWS SITE-TO-SITE VPN PRIVATE IP VPN WALKTHROUGH

    // Import the previous stack resources

    const importedTGW = cdk.Fn.importValue('tgwid');
    const importedCGW = cdk.Fn.importValue('cgw');
    const importedTGWAtt = cdk.Fn.importValue('tgw-dxgw-attachment');

    // Step 5: Creation of the AWS Site-to-Site Private IP VPN
    const private_ip_vpn = new cr.AwsCustomResource(this, 'vpn-private-ip-vpn-example', {
      onCreate: {
        service: 'EC2',
        action: 'createVpnConnection',
        parameters: {
          'CustomerGatewayId': importedCGW.toString(),
          'Type': 'ipsec.1',
          'Options': {
            OutsideIpAddressType: 'PrivateIpv4',
            TransportTransitGatewayAttachmentId: importedTGWAtt.toString()
          },
          'TransitGatewayId': importedTGW.toString()
        },
        outputPaths: ['VpnConnection.VpnConnectionId'],
        physicalResourceId: cr.PhysicalResourceId.fromResponse('VpnConnection.VpnConnectionId')
      },
      onDelete: {
        service: 'EC2',
        action: 'deleteVpnConnection',
        parameters: {
          'VpnConnectionId': new cr.PhysicalResourceIdReference()
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      })
    });

    const vpn_id: string = private_ip_vpn.getResponseField('VpnConnection.VpnConnectionId');

    // Exports of the different resources created
    new CfnOutput(this, 'vpnid', {
      value: vpn_id,
      description: 'private vpn id',
      exportName: 'vpnid',
    });
  }
}
