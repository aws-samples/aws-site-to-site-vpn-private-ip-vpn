import { Config } from "./build-config";
import { CfnOutput, Names, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';

export class PreparationStack extends Stack {
  constructor(scope: Construct, id: string, buildConfig: Config, props?: StackProps) {
    super(scope, id, props);

    // AWS SITE-TO-SITE VPN PRIVATE IP VPN WALKTHROUGH

    // Step 1: Creation of the Direct Connect gateway
    const dxgw = new cr.AwsCustomResource(this, 'dxgw-' + buildConfig.AppName, {
      onCreate: {
        service: 'DirectConnect',
        action: 'createDirectConnectGateway',
        parameters: {
          'directConnectGatewayName': 'DxGatewayPrivateIP',
          'amazonSideAsn': buildConfig.ASNNumbers.AmazonSideDXGW
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('directConnectGateway.directConnectGatewayId')
      },
      onDelete: {
        service: 'DirectConnect',
        action: 'deleteDirectConnectGateway',
        parameters: {
          'directConnectGatewayId': new cr.PhysicalResourceIdReference()
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      })
    });
    const dxgw_id: string = dxgw.getResponseField('directConnectGateway.directConnectGatewayId');

    // Step 2: Creation of the AWS Transit Gateway
    const tgw = new ec2.CfnTransitGateway(this, 'tgw-' + buildConfig.AppName, {
      amazonSideAsn: buildConfig.ASNNumbers.AmazonSideTGW,
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      description: 'transit_gateway-private-ip-vpn-example',
    transitGatewayCidrBlocks: [buildConfig.Parameters.TGWCIDR],
      tags: [{
        key: 'Name',
        value: 'transit_gateway-' + buildConfig.AppName,
      }],
    });
    const tgw_id: string = tgw.attrId

    // Step 3: Transit Gateway association to the Direct Connect gateway
    const dxgw_tgw_association = new cr.AwsCustomResource(this, 'dxgw-tgw-association', {
      onCreate: {
        service: 'DirectConnect',
        action: 'createDirectConnectGatewayAssociation',
        parameters: {
          'directConnectGatewayId': dxgw_id,
          'gatewayId': tgw.ref,
          'addAllowedPrefixesToDirectConnectGateway': [{
            'cidr': buildConfig.Parameters.DXPrefixes
          }]
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('directConnectGatewayAssociation.associationId')
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      })
    });
    dxgw_tgw_association.node.addDependency(dxgw);
    dxgw_tgw_association.node.addDependency(tgw);
    const dxgw_tgw_association_id: string = dxgw_tgw_association.getResponseField('directConnectGatewayAssociation.associationId');

    // Step 3.5. Obtain Transit gateway attachment
    const tgw_attachment = new cr.AwsCustomResource(this, 'tgw-dxgw-attachment', {
      onCreate: {
        service: 'EC2',
        action: 'describeTransitGatewayAttachments',
        parameters: {
          'Filters': [
            {Name: 'transit-gateway-id', Values: [tgw.attrId]},
            {Name: 'resource-type', Values: ['direct-connect-gateway']}
          ]
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('TransitGatewayAttachments.0.TransitGatewayAttachmentId')
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      })
    });
    tgw_attachment.node.addDependency(dxgw_tgw_association);
    const tgw_att_id: string = tgw_attachment.getResponseField('TransitGatewayAttachments.0.TransitGatewayAttachmentId');
    
    // Step 4: Creation of the Customer gateway (CGW)
    const cgw = new ec2.CfnCustomerGateway(this, 'cgw', {
      bgpAsn: buildConfig.ASNNumbers.CustomerSide,
      ipAddress: buildConfig.Parameters.CGWIP,
      type: 'ipsec.1'
    })
    const cgw_id: string = cgw.ref

    // Exports of the different resources created
    new CfnOutput(this, 'dxgwid', {
      value: dxgw_id,
      description: 'DX gateway id',
      exportName: 'dxgwid',
    });
    new CfnOutput(this, 'tgwid', {
      value: tgw_id,
      description: 'transit gateway id',
      exportName: 'tgwid',
    });
    new CfnOutput(this, 'dxgw-tgw-association-output', {
      value: dxgw_tgw_association_id,
      description: 'dxgw and tgw association',
      exportName: 'dxgw-tgw-association',
    });
    new CfnOutput(this, 'tgw-dxgw-attachment-output', {
      value: tgw_att_id,
      description: 'dxgw and tgw attachment',
      exportName: 'tgw-dxgw-attachment',
    });
    new CfnOutput(this, 'cgw-id', {
      value: cgw_id,
      description: 'customer gateway 1',
      exportName: 'cgw',
    });
  }
}
