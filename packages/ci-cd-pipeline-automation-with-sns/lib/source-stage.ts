import { Stack } from 'aws-cdk-lib'
import { Repository } from 'aws-cdk-lib/aws-codecommit'
import { Artifact } from 'aws-cdk-lib/aws-codepipeline'
import { CodeCommitSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions'
import path from 'path'

export class SourceStage {
  private readonly repository: Repository
  private stack: Stack
  private readonly sourceOutput: Artifact

  constructor(stack: Stack) {
    this.stack = stack
    this.sourceOutput = new Artifact()
    this.repository = this.createRepository()
  }

  private createRepository = (): Repository => {
    const repositoryName: string =
      this.stack.node.tryGetContext('projectName') ||
      path.basename(path.resolve(__dirname, '..'))

    return new Repository(this.stack, `${repositoryName}-repository`, {
      repositoryName: repositoryName,
      description: repositoryName,
    })
  }

  public getCodeCommitSourceAction = (): CodeCommitSourceAction => {
    return new CodeCommitSourceAction({
      actionName: 'Source-Action',
      output: this.sourceOutput,
      repository: this.repository,
    })
  }

  public getSourceOutput = (): Artifact => {
    return this.sourceOutput
  }
}
