import { Construct } from 'constructs'
import {
  Stack,
  Duration,
  CfnOutput,
  RemovalPolicy,
  StackProps,
} from 'aws-cdk-lib'
import {
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
  BlockPublicAccess,
  EventType,
} from 'aws-cdk-lib/aws-s3'
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda'
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam'
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

const SHARED_NAME = 'trigger-lambda-from-s3'

export class TriggerLambdaFromS3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = this.createBucket()
    const role = this.createRole(bucket)
    const lambdaFunction = this.createLambdaFunction(role)
    this.addEventSource(lambdaFunction, bucket)

    this.createOutputs(bucket, lambdaFunction)
  }

  createBucket(): Bucket {
    return new Bucket(this, `${SHARED_NAME}-bucket`, {
      bucketName: `${SHARED_NAME}-bucket`,
      versioned: false,
      accessControl: BucketAccessControl.PRIVATE,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.KMS_MANAGED,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })
  }

  createRole(bucket: Bucket): Role {
    const role = new Role(this, `${SHARED_NAME}-role`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    })

    role.addToPolicy(
      new PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [bucket.bucketArn + '/*'],
        effect: Effect.ALLOW,
      })
    )
    return role
  }

  createLambdaFunction(role: Role): LambdaFunction {
    return new LambdaFunction(this, `${SHARED_NAME}-function`, {
      functionName: `${SHARED_NAME}-function`,
      code: Code.fromAsset('./lambda'),
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: Duration.seconds(10),
      role: role,
    })
  }

  addEventSource(lambdaFunction: LambdaFunction, bucket: Bucket): void {
    lambdaFunction.addEventSource(
      new S3EventSource(bucket, {
        events: [EventType.OBJECT_CREATED],
      })
    )
  }

  createOutputs(bucket: Bucket, lambdaFunction: LambdaFunction): void {
    new CfnOutput(this, 'BucketName', {
      description: 'The name of the S3 bucket',
      value: bucket.bucketName,
    })

    new CfnOutput(this, 'functionName', {
      description: 'The name of the lambda function',
      value: lambdaFunction.functionName,
    })
  }
}
