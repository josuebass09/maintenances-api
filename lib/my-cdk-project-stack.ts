import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiEndpointStack } from './stacks/ApiEndpointStack';
import {Stage} from 'aws-cdk-lib';
import * as dotenv from 'dotenv';

export class MyCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    dotenv.config();
    const stage = process.env.STAGE_NAME as string;
    new Stage(scope, `${process.env.STAGE_NAME}-stage`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    });

    new ApiEndpointStack(this, 'ApiEndpointStack', {
      stageName: stage,
    });
  }
}
