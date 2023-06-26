import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Repository } from 'aws-cdk-lib/aws-codecommit'
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeCommitSourceAction,
  CodeDeployServerDeployAction,
  ManualApprovalAction,
} from 'aws-cdk-lib/aws-codepipeline-actions'
import { Project, BuildSpec, LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild'
import { CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions'
import path from 'path'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import {
  ServerApplication,
  ServerDeploymentGroup,
} from 'aws-cdk-lib/aws-codedeploy'
import dotenv from 'dotenv'
import fs from 'fs'
import yaml from 'js-yaml'

dotenv.config()

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const PROJECT_NAME = path.basename(path.resolve(__dirname, '..'))
const EMAIL = process.env.EMAIL || ''

export class CiCdPipelineAutomationWithSnsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // -------------------- codecommit --------------------
    const repository = this.createRepository()

    const sourceOutput = new Artifact()

    const sourceAction = this.createSourceAction(repository, sourceOutput)

    // -------------------- codebuild --------------------
    const buildProject = this.createBuildProject()

    const buildOutput = new Artifact()

    const buildAction = this.createBuildAction(
      buildProject,
      sourceOutput,
      buildOutput
    )

    const topic = this.createTopic()

    const approvalAction = this.createApprovalAction(topic)

    // -------------------- codedeploy --------------------
    const application = this.createCodeDeployApplication()

    const deploymentGroup = this.createDeploymentGroup(application)

    const deployAction = this.createDeployAction(deploymentGroup, buildOutput)

    // -------------------- codepipeline --------------------
    const pipeline = this.createPipeline()

    pipeline.addStage({
      stageName: 'CodeCommit',
      actions: [sourceAction],
    })

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction],
    })

    pipeline.addStage({
      stageName: 'Approval',
      actions: [approvalAction],
    })

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction],
    })
  }

  createRepository = (): Repository => {
    const repositoryName = `${PROJECT_NAME}-repository`

    return new Repository(this, repositoryName, {
      repositoryName: repositoryName,
      description: repositoryName,
    })
  }

  createSourceAction = (
    repository: Repository,
    sourceOutput: Artifact
  ): CodeCommitSourceAction => {
    const actionName = `${PROJECT_NAME}-sourceAction`

    return new CodeCommitSourceAction({
      actionName: actionName,
      repository: repository,
      output: sourceOutput,
    })
  }

  createBuildProject = (): Project => {
    const buildProjectName = `${PROJECT_NAME}-build-project`

    const pathToBuildspec = path.join(__dirname, '..', 'template-buldspec.yml')
    const buildSpecYaml = fs.readFileSync(pathToBuildspec, 'utf8')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const buildSpecJson = yaml.load(buildSpecYaml) as Record<string, unknown>

    return new Project(this, buildProjectName, {
      projectName: buildProjectName,
      buildSpec: BuildSpec.fromObject(buildSpecJson),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
      },
    })
  }

  createBuildAction = (
    project: Project,
    input: Artifact,
    output: Artifact
  ): CodeBuildAction => {
    const actionName = `${PROJECT_NAME}-buildAction`

    return new CodeBuildAction({
      actionName: actionName,
      project,
      input,
      outputs: [output],
    })
  }

  createTopic = (): Topic => {
    const topicName = `${PROJECT_NAME}-sns-topic`

    const topic = new Topic(this, topicName, {
      topicName: topicName,
    })

    topic.addSubscription(new EmailSubscription(EMAIL))

    return topic
  }

  createApprovalAction = (topic: Topic): ManualApprovalAction => {
    return new ManualApprovalAction({
      actionName: `${PROJECT_NAME}-approval-action`,
      notificationTopic: topic,
    })
  }

  createCodeDeployApplication = (): ServerApplication => {
    const applicationName = `${PROJECT_NAME}-App`
    return new ServerApplication(this, applicationName, {
      applicationName: applicationName,
    })
  }

  createDeploymentGroup = (
    application: ServerApplication
  ): ServerDeploymentGroup => {
    const deploymentGroupName = `${PROJECT_NAME}-deployment-group`
    return new ServerDeploymentGroup(this, deploymentGroupName, {
      deploymentGroupName: deploymentGroupName,
      application: application,
    })
  }

  createDeployAction = (
    deploymentGroup: ServerDeploymentGroup,
    input: Artifact
  ): CodeDeployServerDeployAction => {
    return new CodeDeployServerDeployAction({
      actionName: `${PROJECT_NAME}-deploy-action`,
      deploymentGroup,
      input,
    })
  }

  createPipeline = (): Pipeline => {
    const pipelineName = `${PROJECT_NAME}-pipeline`

    return new Pipeline(this, pipelineName, {
      pipelineName: pipelineName,
      restartExecutionOnUpdate: true,
    })
  }
}
