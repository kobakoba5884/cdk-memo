import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
  BlockPublicAccess,
} from 'aws-cdk-lib/aws-s3'
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda'
import { LambdaIntegration, Resource, RestApi } from 'aws-cdk-lib/aws-apigateway'

const SHARED_NAME = 'trigger-lambda-from-api-gateway'

export class TriggerLambdaFromApiGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = this.createBucket()

    const lambdaFucntion = this.createLambdaFunction(bucket)

    bucket.grantReadWrite(lambdaFucntion)

    const restApi = this.createApiGateway()

    this.setupApiGateway(lambdaFucntion, restApi)

    this.createOutputs(bucket, lambdaFucntion, restApi)
  }

  createBucket = (): Bucket => {
    const bucketName = `${SHARED_NAME}-bucket`

    return new Bucket(this, bucketName, {
      bucketName: bucketName,
      versioned: false,
      accessControl: BucketAccessControl.PRIVATE,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.KMS_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })
  }

  createLambdaFunction = (bucket: Bucket): LambdaFunction => {
    const functionName = `${SHARED_NAME}-function`

    return new LambdaFunction(this, functionName, {
      functionName: functionName,
      code: Code.fromAsset('./dist/lambda'),
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: Duration.seconds(10),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    })
  }

  createApiGateway = (): RestApi => {
    const restApiName = `${SHARED_NAME}-rest-api`

    return new RestApi(this, restApiName, {
      restApiName: restApiName,
      description: restApiName,
    })
  }

  setupApiGateway = (lambdaFucntion: LambdaFunction, restApi: RestApi) => {
    const lambdaIntegration = new LambdaIntegration(lambdaFucntion, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    })

    const myResource: Resource = restApi.root.addResource('myResource')

    restApi.root.addMethod('GET', lambdaIntegration)
    restApi.root.addMethod('POST', lambdaIntegration)

    myResource.addMethod('GET', lambdaIntegration)
  }

  createOutputs = (
    bucket: Bucket,
    lambdaFunction: LambdaFunction,
    restApi: RestApi
  ): void => {
    new CfnOutput(this, 'tableName', {
      description: 'The name of the s3 bucket',
      value: bucket.bucketName,
    })

    new CfnOutput(this, 'functionName', {
      description: 'The name of the lambda function',
      value: lambdaFunction.functionName,
    })

    new CfnOutput(this, 'restApiName', {
      description: 'The name of the rest api gateway',
      value: restApi.restApiName,
    })
  }
}
