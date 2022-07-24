export interface Config
{
  readonly AppName: string
  readonly Parameters: Parameters
  readonly ASNNumbers: ASNNumbers
}

export interface Parameters
{
  readonly TGWCIDR : string;
  readonly DXPrefixes : string;
  readonly CGWIP : string;
}

export interface ASNNumbers
{
  readonly AmazonSideDXGW : number;
  readonly AmazonSideTGW : number;
  readonly CustomerSide : number;
}

export interface VPC
{
  readonly CIDR : string;
  readonly CIDRtoTGW: string;
}

