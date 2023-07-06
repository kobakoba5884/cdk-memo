import { Stack } from 'aws-cdk-lib'
import { BuildSpec, LinuxBuildImage, Project } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions'
import { Artifact } from 'aws-cdk-lib/aws-codepipeline'
import path from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

export class BuildStage {
  private readonly stack: Stack
  private readonly buildOutput: Artifact
  private readonly buildProject: Project
  private readonly buildAction: CodeBuildAction

  constructor(stack: Stack, sourceOutput: Artifact) {
    this.stack = stack
    this.buildOutput = new Artifact()
    this.buildProject = this.createBuildProject()
    this.buildAction = this.createBuildAction(sourceOutput)
  }

  private createBuildProject = (): Project => {
    const projectName: string =
      this.stack.node.tryGetContext('projectName') ||
      path.basename(path.resolve(__dirname, '..'))

    const pathToBuildspec = path.join(__dirname, '..', 'template-buildspec.yml')
    const buildSpecYaml = fs.readFileSync(pathToBuildspec, 'utf-8')
    const buildSpecJson = yaml.load(buildSpecYaml) as Record<string, unknown>

    return new Project(this.stack, `${projectName}-build-project`, {
      projectName: projectName,
      buildSpec: BuildSpec.fromObject(buildSpecJson),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
      },
    })
  }

  private createBuildAction = (sourceOutput: Artifact): CodeBuildAction => {
    return new CodeBuildAction({
      actionName: 'CodeBuild',
      project: this.buildProject,
      input: sourceOutput,
      outputs: [this.buildOutput],
    })
  }

  public getBuildAction = (): CodeBuildAction => {
    return this.buildAction
  }

  public getBuildOutput = (): Artifact => {
    return this.buildOutput
  }
}
