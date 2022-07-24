#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Tags} from 'aws-cdk-lib';
import { PreparationStack } from '../lib/preparation-stack';
import { VpnStack } from '../lib/private-vpn-stack';
import { SpokeVPCsStack } from '../lib/spoke-vpcs-stack'
import { Config, VPC } from "../lib/build-config";
import * as fs from 'fs'
import * as path from "path";
const yaml = require('js-yaml');

const app = new cdk.App();

function ensureString(object: { [name: string]: any }, propName: string ): string
{
    if(!object[propName] || object[propName].trim().length === 0)
        throw new Error(propName +" does not exist or is empty");
    return object[propName];
}

function ensureNumber(object: { [name: string]: any }, propName: string ): number
{
    return object[propName];
}

function validateConfig(){
  let env = app.node.tryGetContext('config');
  if (!env) {
    console.warn(
      "\nNo configuration provided.  Use a configuration file from the 'config' directory using the '-c config=[filename]' argument\n"
    );
  }
}

function getVariables()
{
  let config = app.node.tryGetContext('config');
  if (!config) {
    config = 'parameters'
  }
  let unparsedEnv = yaml.load(fs.readFileSync(path.resolve("./config/"+ config +".yaml"), "utf8"));
  let buildConfig: Config = {
    AppName: ensureString(unparsedEnv, 'AppName'),
    Parameters: {
      TGWCIDR : ensureString(unparsedEnv['Parameters'], 'TGWCIDR'),
      DXPrefixes : ensureString(unparsedEnv['Parameters'], 'DXPrefixes'),
      CGWIP : ensureString(unparsedEnv['Parameters'], 'CGWIP'),
    },
    ASNNumbers: {
      AmazonSideDXGW : ensureNumber(unparsedEnv['ASNNumbers'], 'AmazonSideDXGW'),
      AmazonSideTGW : ensureNumber(unparsedEnv['ASNNumbers'], 'AmazonSideTGW'),
      CustomerSide : ensureNumber(unparsedEnv['ASNNumbers'], 'CustomerSide'),
    }
  };
  let VPCA: VPC = {
    CIDR: ensureString(unparsedEnv['VPCA'], 'CIDR'),
    CIDRtoTGW: ensureString(unparsedEnv['VPCA'], 'CIDRtoTGW'),
  }
  let VPCB: VPC = {
    CIDR: ensureString(unparsedEnv['VPCB'], 'CIDR'),
    CIDRtoTGW: ensureString(unparsedEnv['VPCB'], 'CIDRtoTGW'),
  }
  let variables = {
    config: buildConfig,
    vpca: VPCA,
    vpcb: VPCB
  }
return variables;
}

async function Main()
{
  validateConfig()
  //let env = app.node.tryGetContext('config');
  let buildConfig: Config = getVariables().config;
  let VPCA: VPC = getVariables().vpca;
  let VPCB: VPC = getVariables().vpcb;

  Tags.of(app).add('App', buildConfig.AppName);

  const preparationStack = new PreparationStack(app, 'PreparationStack', buildConfig, {});
  const vpnStack = new VpnStack(app, 'VpnStack', {});
  const spokeVPCStackA = new SpokeVPCsStack(app, 'SpokeVPC-A', VPCA, {});
  const spokeVPCStackB = new SpokeVPCsStack(app, 'SpokeVPC-B', VPCB, {});
}
Main();
