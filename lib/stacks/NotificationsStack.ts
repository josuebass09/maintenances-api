import { Duration, Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

interface NotificationsStackProps extends cdk.StackProps {
    stageName: string;
    fromEmail: string;
}

export class NotificationsStack extends Stack {
  constructor(scope: Construct, id: string, props: NotificationsStackProps) {
    super(scope, id, props);

    const sendRemindersLambda = new NodejsFunction(this, 'SendRemindersHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: `sendReminders-${props.stageName}`,
      entry: 'lib/lambdas/notifications/sendReminders/index.ts',
      handler: 'handler',
      timeout: Duration.minutes(5),
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
        carOwnersTable: 'carOwners',
        carsTable: 'cars',
        SES_FROM_EMAIL: props.fromEmail,
      },
    });

    // Grant read access to existing DynamoDB tables (created in other stacks)
    const maintenancesTable = Table.fromTableName(this, 'MaintenancesTable', 'maintenances');
    const carOwnersTable = Table.fromTableName(this, 'CarOwnersTable', 'carOwners');
    const carsTable = Table.fromTableName(this, 'CarsTable', 'cars');

    maintenancesTable.grantReadData(sendRemindersLambda);
    carOwnersTable.grantReadData(sendRemindersLambda);
    carsTable.grantReadData(sendRemindersLambda);

    // Grant SES send permission
    sendRemindersLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'ses:SendRawEmail'],
      resources: ['*'],
    }));

    // EventBridge rule: daily at 9:00 AM UTC
    const dailyRule = new Rule(this, 'DailyReminderRule', {
      ruleName: `maintenance-reminders-daily-${props.stageName}`,
      schedule: Schedule.cron({ minute: '0', hour: '9' }),
      description: 'Trigger daily maintenance reminder emails',
    });

    dailyRule.addTarget(new LambdaFunction(sendRemindersLambda, {
      retryAttempts: 2,
    }));
  }
}
