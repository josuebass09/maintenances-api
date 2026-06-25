import { Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CarOwnerKeys } from '../models/carOwner';

interface CarOwnersStackProps extends cdk.StageProps {
    stageName: string;
    description?: string;
    userPool: cognito.UserPool;
}

export class CarOwnersStack extends Stack {
  constructor(scope: Construct, id: string, props: CarOwnersStackProps) {
    super(scope, id, props);

    const carOwnersTable = 'carOwners';

    const table = new Table(this, 'CarOwners', {
      partitionKey: { name: CarOwnerKeys.PrimaryKey, type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      tableName: carOwnersTable,
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

    const env = { NODE_OPTIONS: '--enable-source-maps', carOwnersTable };
    const bundling = { minify: true, sourceMap: true };
    const runtime = Runtime.NODEJS_22_X;

    const getCarOwnersLambda = new NodejsFunction(this, 'GetCarOwnersHandler', {
      runtime,
      functionName: 'getCarOwners',
      entry: 'lib/lambdas/carOwners/getCarOwners/index.ts',
      handler: 'handler',
      bundling,
      environment: env,
    });

    const getCarOwnerLambda = new NodejsFunction(this, 'GetCarOwnerHandler', {
      runtime,
      functionName: 'getCarOwner',
      entry: 'lib/lambdas/carOwners/getCarOwner/index.ts',
      handler: 'handler',
      bundling,
      environment: env,
    });

    const postCarOwnerLambda = new NodejsFunction(this, 'PostCarOwnerHandler', {
      runtime,
      functionName: 'postCarOwner',
      entry: 'lib/lambdas/carOwners/postCarOwner/index.ts',
      handler: 'handler',
      bundling,
      environment: env,
    });

    const putCarOwnerLambda = new NodejsFunction(this, 'PutCarOwnerHandler', {
      runtime,
      functionName: 'putCarOwner',
      entry: 'lib/lambdas/carOwners/putCarOwner/index.ts',
      handler: 'handler',
      bundling,
      environment: env,
    });

    const deleteCarOwnerLambda = new NodejsFunction(this, 'DeleteCarOwnerHandler', {
      runtime,
      functionName: 'deleteCarOwner',
      entry: 'lib/lambdas/carOwners/deleteCarOwner/index.ts',
      handler: 'handler',
      bundling,
      environment: env,
    });

    table.grantReadData(getCarOwnersLambda);
    table.grantReadData(getCarOwnerLambda);
    table.grantWriteData(postCarOwnerLambda);
    table.grantReadWriteData(putCarOwnerLambda);
    table.grantWriteData(deleteCarOwnerLambda);

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const authOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer,
    };

    const api = new RestApi(this, 'CarOwnersApiGateway', {
      restApiName: 'CarOwnersAPI',
      description: 'API for managing car owners',
      deployOptions: {
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 500,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        stageName: props.stageName,
        description: props.description,
      },
    });

    const stage = api.deploymentStage;
    stage.node.addDependency(apiGatewayAccount);

    const ownersResource = api.root.addResource('owners');
    ownersResource.addMethod('GET', new LambdaIntegration(getCarOwnersLambda), authOptions);
    ownersResource.addMethod('POST', new LambdaIntegration(postCarOwnerLambda), authOptions);

    const singleOwnerResource = ownersResource.addResource('{id}');
    singleOwnerResource.addMethod('GET', new LambdaIntegration(getCarOwnerLambda), authOptions);
    singleOwnerResource.addMethod('PUT', new LambdaIntegration(putCarOwnerLambda), authOptions);
    singleOwnerResource.addMethod('DELETE', new LambdaIntegration(deleteCarOwnerLambda), authOptions);
  }
}
