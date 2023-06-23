import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam'
import {
  Code,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda'

const SHARED_NAME = 'trigger-lambda-from-dynamodb-stream'

// https://dynobase.dev/dynamodb-aws-cdk/
export class TriggerLambdaFromDynamodbStreamStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamoDB = this.createDynamoDB()

    const role = this.createRole(dynamoDB)

  }

  createDynamoDB = (): Table => {
    const tableName = `${SHARED_NAME}-dynamodb`

    return new Table(this, tableName, {
      tableName: tableName,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: {name: 'createdAt', type:AttributeType.NUMBER},
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: StreamViewType.NEW_AND_OLD_IMAGES
    })
  }

  createRole = (dynamoDB: Table): Role => {
    const role = new Role(this, `${SHARED_NAME}-role`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    })

    role.addToPolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query'
        ],
        resources: [dynamoDB.tableArn],
        effect: Effect.ALLOW,
      })
    )

    role.addToPolicy(
      new PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['arn:aws:logs:*:*:*'],
        effect: Effect.ALLOW,
      })
    )

    return role
  }

  createLambdaFunction = (role: Role): LambdaFunction => {
    const functionName = `${SHARED_NAME}-function`

    return new LambdaFunction(this, functionName, {
      functionName: functionName,
      code: Code.fromAsset('./dist/lambda'),
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: Duration.seconds(10),
      role: role,
    })
  }

  createOutputs = (dynamoDB: Table, lambdaFunction: LambdaFunction): void => {
    new CfnOutput(this, 'tableName', {
      description: 'The name of the dynamodb table',
      value: dynamoDB.tableName,
    })

    new CfnOutput(this, 'functionName', {
      description: 'The name of the lambda function',
      value: lambdaFunction.functionName,
    })
  }
}
