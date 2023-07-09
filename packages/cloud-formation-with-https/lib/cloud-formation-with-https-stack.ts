import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import {
  Distribution,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import path from 'path'

export class CloudFormationWithHttpsStack extends Stack {
  private readonly PROJECT_NAME = path.basename(path.join(__dirname, '..'))
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = this.createBucket()

    this.deployToBucket(bucket)
    this.createDistribution(bucket)

    this.createOutputs(bucket)
  }

  createBucket = (): Bucket => {
    const bucketName = `${this.PROJECT_NAME}-bucket`
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

  deployToBucket = (bucket: Bucket): BucketDeployment => {
    return new BucketDeployment(this, `${this.PROJECT_NAME}-deployment`, {
      sources: [Source.asset(path.join(__dirname, '..', 'assets'))],
      destinationBucket: bucket,
    })
  }

  createDistribution = (bucket: Bucket): Distribution => {
    return new Distribution(this, `${this.PROJECT_NAME}-distribution`, {
      defaultBehavior: {
        origin: new S3Origin(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: PriceClass.PRICE_CLASS_200,
    })
  }

  createOutputs(bucket: Bucket): void {
    new CfnOutput(this, 'BucketName', {
      description: 'The name of the S3 bucket',
      value: bucket.bucketName,
    })
  }
}
