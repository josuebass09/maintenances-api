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

interface ApiStackProps extends cdk.StageProps {
    stageName: string;
    description?: string;
    throttlingRateLimit?: number;
    throttlingBurstLimit?: number;
    userPool: cognito.UserPool;
}

export class CarsStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);
    const carsTable = 'cars';

    // Create DynamoDB table for cars
    const table = new Table(this, 'Cars', {
      partitionKey: {name: 'licensePlate', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: carsTable,
    });

    // Create CloudWatch role for API Gateway
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

    // Lambda functions for CRUD operations
    const getCarsLambda = new NodejsFunction(this, 'GetCarsHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'getCars',
      entry: 'lib/lambdas/cars/getCars/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        carsTable: 'cars',
      },
    });

    const getCarLambda = new NodejsFunction(this, 'GetCarHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'getCar',
      entry: 'lib/lambdas/cars/getCar/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        carsTable: 'cars',
      },
    });

    const postCarLambda = new NodejsFunction(this, 'PostCarHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'postCar',
      entry: 'lib/lambdas/cars/postCar/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        carsTable: 'cars',
      },
    });

    const putCarLambda = new NodejsFunction(this, 'PutCarHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'putCar',
      entry: 'lib/lambdas/cars/putCar/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        carsTable: 'cars',
      },
    });

    const deleteCarLambda = new NodejsFunction(this, 'DeleteCarHandler', {
      runtime: Runtime.NODEJS_22_X,
      functionName: 'deleteCar',
      entry: 'lib/lambdas/cars/deleteCar/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        carsTable: 'cars',
      },
    });

    // Grant permissions to Lambda functions
    table.grantReadData(getCarsLambda);
    table.grantReadData(getCarLambda);
    table.grantWriteData(postCarLambda);
    table.grantWriteData(putCarLambda);
    table.grantWriteData(deleteCarLambda);

    // Create API Gateway
    const api = new RestApi(this, 'CarsApiGateway', {
      restApiName: 'CarsAPI',
      description: 'API for managing cars',
      deployOptions: {
        throttlingRateLimit: props.throttlingRateLimit || 1000,
        throttlingBurstLimit: props.throttlingBurstLimit || 500,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        cacheClusterEnabled: true,
        cacheClusterSize: '0.5',
        methodOptions: {
          '/*/*': {
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

    // Create Lambda integrations
    const getCarsIntegration = new LambdaIntegration(getCarsLambda);
    const getCarIntegration = new LambdaIntegration(getCarLambda);
    const postCarIntegration = new LambdaIntegration(postCarLambda);
    const putCarIntegration = new LambdaIntegration(putCarLambda);
    const deleteCarIntegration = new LambdaIntegration(deleteCarLambda);

    // Set up API routes
    const carsResource = api.root.addResource('cars');
    carsResource.addMethod('GET', getCarsIntegration, authOptions);
    carsResource.addMethod('POST', postCarIntegration, authOptions);

    const singleCarResource = carsResource.addResource('{licensePlate}');
    singleCarResource.addMethod('GET', getCarIntegration, authOptions);
    singleCarResource.addMethod('PUT', putCarIntegration, authOptions);
    singleCarResource.addMethod('DELETE', deleteCarIntegration, authOptions);
  }
}
