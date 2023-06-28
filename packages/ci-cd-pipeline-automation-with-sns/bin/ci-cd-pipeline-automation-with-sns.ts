#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { CiCdPipelineAutomationWithSnsStack } from '../lib/ci-cd-pipeline-automation-with-sns-stack'
import dotenv from 'dotenv'

dotenv.config()
// https://towardsaws.com/creating-aws-codepipeline-using-aws-cdk-6d6895d56cee

const app = new cdk.App()
new CiCdPipelineAutomationWithSnsStack(
  app,
  'CiCdPipelineAutomationWithSnsStack',
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
)
