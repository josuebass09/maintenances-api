import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MaintenancesStack } from './stacks/MaintenancesStack';
import {Stage} from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import {CarsStack} from './stacks/CarsStack';

export class MyCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    dotenv.config();
    const stage = process.env.STAGE_NAME as string;
    new Stage(scope, `${process.env.STAGE_NAME}-stage`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    });

    new CarsStack(this, 'CarsStack', {
      stageName: stage,
    });

    new MaintenancesStack(this, 'MaintenancesStack', {
      stageName: stage,
    });
  }
}
