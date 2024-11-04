import {Stack} from 'aws-cdk-lib';
import {Runtime} from 'aws-cdk-lib/aws-lambda';
import {LambdaIntegration, RestApi} from 'aws-cdk-lib/aws-apigateway';
import {Construct} from 'constructs';
import {AttributeType, BillingMode, Table} from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import {MaintenanceKeys} from '../models/maintenance';
interface ApiStackProps extends cdk.StageProps {
    stageName: string;
    description?: string;
    throttlingRateLimit?: number;
    throttlingBurstLimit?: number;
}

export class ApiEndpointStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const maintenanceTable = 'maintenances';
    const table = new Table(this, 'Maintenances', {
      partitionKey: {name: MaintenanceKeys.PrimaryKey, type: AttributeType.STRING},
      sortKey: { name: MaintenanceKeys.SecondaryKey, type: AttributeType.STRING },
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
      runtime: Runtime.NODEJS_18_X,
      functionName: 'getMaintenances',
      entry: 'lib/lambdas/getMaintenances/index.ts',
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
      runtime: Runtime.NODEJS_18_X,
      functionName: 'getMaintenance',
      entry: 'lib/lambdas/getMaintenance/index.ts',
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
      runtime: Runtime.NODEJS_18_X,
      functionName: 'postMaintenance',
      entry: 'lib/lambdas/postMaintenance/index.ts', // Adjust this path to your actual entry file
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
      runtime: Runtime.NODEJS_18_X,
      functionName: 'putMaintenance',
      entry: 'lib/lambdas/putMaintenance/index.ts',
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
      runtime: Runtime.NODEJS_18_X,
      functionName: 'deleteMaintenance',
      entry: 'lib/lambdas/deleteMaintenance/index.ts',
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
      restApiName: 'ApiGateway1',
      description: 'this is a basic rest api',
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
    const getMaintenancesIntegration = new LambdaIntegration(getMaintenancesLambda);
    const postMaintenanceIntegration = new LambdaIntegration(postMaintenanceLambda);
    const getMaintenanceIntegration = new LambdaIntegration(getMaintenanceLambda);
    const putMaintenanceIntegration = new LambdaIntegration(putMaintenanceLambda);
    const deleteMaintenanceIntegration = new LambdaIntegration(deleteMaintenanceLambda);

    const maintenancesResource = api.root.addResource('maintenances');
    maintenancesResource.addMethod('GET', getMaintenancesIntegration);

    const maintenanceResource = api.root.addResource('maintenance');
    maintenanceResource.addMethod('GET', getMaintenanceIntegration);
    maintenanceResource.addMethod('POST', postMaintenanceIntegration);


    const singleMaintenanceResource = maintenanceResource.addResource('{name}');
    singleMaintenanceResource.addMethod('GET', getMaintenanceIntegration);
    singleMaintenanceResource.addMethod('PUT', putMaintenanceIntegration);
    singleMaintenanceResource.addMethod('DELETE', deleteMaintenanceIntegration);
  }
}
