import * as cdk from 'aws-cdk-lib';
import { VPC } from "./build-config";
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class SpokeVPCsStack extends Stack {
  constructor(scope: Construct, id: string, buildConfig: VPC, props?: StackProps) {
    super(scope, id, props);

    // Import the previous stack resources
    const importedTGW = cdk.Fn.importValue('tgwid');
    
    const vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: buildConfig.CIDR,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 26,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        {
          cidrMask: 26,
          name: 'TGW',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });
    
    const tgw_subnets = vpc.selectSubnets({
      subnetGroupName: 'TGW'
    });
    const private_subnets = vpc.selectSubnets({
      subnetGroupName: 'private'
    });

    const transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TransitGatewayAttachment', {
      subnetIds: [tgw_subnets.subnets[0].subnetId],
      transitGatewayId: importedTGW,
      vpcId: vpc.vpcId,
    });

    private_subnets.subnets.forEach(({ routeTable: { routeTableId } }, index) => {
      var route = new ec2.CfnRoute(this, 'RouteTabletoTGW' + index, {
        destinationCidrBlock: buildConfig.CIDRtoTGW,
        routeTableId: routeTableId,
        transitGatewayId: importedTGW,
      })
      route.addDependsOn(transitGatewayAttachment);
    });
  }
}



