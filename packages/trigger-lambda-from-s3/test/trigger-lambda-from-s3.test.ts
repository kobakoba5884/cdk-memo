import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TriggerLambdaFromS3Stack } from '../lib/trigger-lambda-from-s3-stack';

test('Stack creates an S3 bucket', () => {
  const app = new App();
  const stack = new TriggerLambdaFromS3Stack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    AccessControl: 'Private',
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms',
          },
        },
      ],
    },
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });
});

test('Stack creates a Lambda function', () => {
  const app = new App();
  const stack = new TriggerLambdaFromS3Stack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Handler: 'index.handler',
    Runtime: 'nodejs18.x',
    Timeout: 10,
  });
});

test('Stack creates an IAM role', () => {
  const app = new App();
  const stack = new TriggerLambdaFromS3Stack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ],
      Version: '2012-10-17',
    },
  });

  template.resourceCountIs('AWS::IAM::Policy', 2);
});
