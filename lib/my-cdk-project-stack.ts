import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MaintenancesStack } from './stacks/MaintenancesStack';
import { Stage } from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { CarsStack } from './stacks/CarsStack';
import { CarOwnersStack } from './stacks/CarOwnersStack';
import { AuthStack } from './stacks/AuthStack';
import { NotificationsStack } from './stacks/NotificationsStack';

export class MyCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    dotenv.config();
    const stage = process.env.STAGE_NAME as string;
    new Stage(scope, `${process.env.STAGE_NAME}-stage`, {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    });

    const authStack = new AuthStack(this, 'AuthStack', {
      stageName: stage,
    });

    new CarsStack(this, 'CarsStack', {
      stageName: stage,
      userPool: authStack.userPool,
    });

    new MaintenancesStack(this, 'MaintenancesStack', {
      stageName: stage,
      userPool: authStack.userPool,
    });

    new CarOwnersStack(this, 'CarOwnersStack', {
      stageName: stage,
      userPool: authStack.userPool,
    });

    new NotificationsStack(this, 'NotificationsStack', {
      stageName: stage,
      fromEmail: process.env.SES_FROM_EMAIL as string,
    });
  }
}
