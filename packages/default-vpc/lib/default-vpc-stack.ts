import { Stack, StackProps } from 'aws-cdk-lib'
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import * as path from 'path'

export class DefaultVpcStack extends Stack {
  private readonly PROJECT_NAME: string = path.basename(
    path.join(__dirname, '..')
  )

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
  }

  createDefaultVpc = (): Vpc => {
    return new Vpc(this, `${this.PROJECT_NAME}-vpc`, {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Ingress',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Application',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    })
  }
}
