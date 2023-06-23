#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TriggerLambdaFromDynamodbStreamStack } from '../lib/trigger-lambda-from-dynamodb-stream-stack';

const app = new cdk.App();
new TriggerLambdaFromDynamodbStreamStack(app, 'TriggerLambdaFromDynamodbStreamStack', {
});