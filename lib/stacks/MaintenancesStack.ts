import {Stack} from 'aws-cdk-lib';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi, AuthorizationType} from 'aws-cdk-lib/aws-apigateway';
import {Construct} from 'constructs';
import {AttributeType, BillingMode, Table} from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import {MaintenanceKeys} from '../models/maintenance';

interface ApiStackProps extends cdk.StageProps {
    stageName: string;
    description?: string;
    throttlingRateLimit?: number;
    throttlingBurstLimit?: number;
    userPool: cognito.UserPool;
}

export class MaintenancesStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const maintenanceTable = 'maintenances';
    const table = new Table(this, 'Maintenances', {
      partitionKey: {name: MaintenanceKeys.PrimaryKey, type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: maintenanceTable,
    });

    const cloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    const apiGatewayAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: cloudWatchRole.roleArn,
    });

    const getMaintenancesLambda = new NodejsFunction(this, 'GetMaintenancesHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'getMaintenances',
      entry: 'lib/lambdas/maintenances/getMaintenances/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
      },
    });

    const getMaintenanceLambda = new NodejsFunction(this, 'GetMaintenanceHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'getMaintenance',
      entry: 'lib/lambdas/maintenances/getMaintenance/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
      },
    });

    const postMaintenanceLambda = new NodejsFunction(this, 'PostMaintenanceHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'postMaintenance',
      entry: 'lib/lambdas/maintenances/postMaintenance/index.ts', // Adjust this path to your actual entry file
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
      },
    });

    const putMaintenanceLambda = new NodejsFunction(this, 'PutMaintenanceHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'putMaintenance',
      entry: 'lib/lambdas/maintenances/putMaintenance/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
      },
    });

    const deleteMaintenanceLambda = new NodejsFunction(this, 'DeleteMaintenanceHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'deleteMaintenance',
      entry: 'lib/lambdas/maintenances/deleteMaintenance/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        maintenanceTable: 'maintenances',
      },
    });

    table.grantReadData(getMaintenancesLambda);
    table.grantWriteData(postMaintenanceLambda);
    table.grantWriteData(putMaintenanceLambda);
    table.grantWriteData(deleteMaintenanceLambda);
    table.grantReadData(getMaintenanceLambda);

    const api = new RestApi(this, 'ApiGatewayPrimary', {
      restApiName: 'Maintenances API',
      description: 'API for managing maintenances',
      deployOptions: {
        // Configure stage settings
        throttlingRateLimit: props.throttlingRateLimit || 1000,
        throttlingBurstLimit: props.throttlingBurstLimit || 500,

        // Enable CloudWatch logging
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,

        // Enable caching if needed
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',

        // Method settings for all methods
        methodOptions: {
          '/*/*': {  // This applies to all resources and methods
            throttlingRateLimit: props.throttlingRateLimit || 1000,
            throttlingBurstLimit: props.throttlingBurstLimit || 500,
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheTtl: cdk.Duration.minutes(5),
          }
        },
        stageName: props.stageName,
        description: props.description,
        variables: {
          environment: props.stageName,
          version: '1.0.0'
        }
      }
    });

    const stage = api.deploymentStage;
    stage.node.addDependency(apiGatewayAccount);

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const authOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer,
    };

    const getMaintenancesIntegration = new LambdaIntegration(getMaintenancesLambda);
    const postMaintenanceIntegration = new LambdaIntegration(postMaintenanceLambda);
    const getMaintenanceIntegration = new LambdaIntegration(getMaintenanceLambda);
    const putMaintenanceIntegration = new LambdaIntegration(putMaintenanceLambda);
    const deleteMaintenanceIntegration = new LambdaIntegration(deleteMaintenanceLambda);

    const maintenancesResource = api.root.addResource('maintenances');
    maintenancesResource.addMethod('GET', getMaintenancesIntegration, authOptions);

    const maintenanceResource = api.root.addResource('maintenance');
    maintenanceResource.addMethod('POST', postMaintenanceIntegration, authOptions);

    const singleMaintenanceResource = maintenanceResource.addResource('{name}');
    singleMaintenanceResource.addMethod('GET', getMaintenanceIntegration, authOptions);
    singleMaintenanceResource.addMethod('PUT', putMaintenanceIntegration, authOptions);
    singleMaintenanceResource.addMethod('DELETE', deleteMaintenanceIntegration, authOptions);
  }
}
