#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DefaultVpcStack } from '../lib/default-vpc-stack';

const app = new cdk.App();
new DefaultVpcStack(app, 'DefaultVpcStack', {
});