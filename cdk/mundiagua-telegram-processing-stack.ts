import { App, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Topic } from "aws-cdk-lib/aws-sns";
import { SnsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

interface MundiaguaTelegramStackProps extends StackProps {
  stage: string;
  telegramApiKeyArn: string;
}

export class MundiaguaTelegramProcessingStack extends Stack {
  private readonly props: MundiaguaTelegramStackProps;

  constructor(scope: App, id: string, props: MundiaguaTelegramStackProps) {
    super(scope, id, props);
    this.props = props;

    const restApi = new RestApi(this, `telegrambot-api-${this.props.stage}`);
    const token = Secret.fromSecretCompleteArn(
      this,
      `telegrambot-secret-${this.props.stage}`,
      this.props.telegramApiKeyArn
    );

    const telegramTable = new Table(
      this,
      `telegram-user-table-${this.props.stage}`,
      {
        partitionKey: { name: "userId", type: AttributeType.STRING },
        billingMode: BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    telegramTable.addGlobalSecondaryIndex({
      indexName: "telegramId",
      partitionKey: { name: "telegramId", type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    const telegramBotLambda = new NodejsFunction(
      this,
      `telegramMessageLambda-${this.props.stage}`,
      {
        memorySize: 512,
        runtime: Runtime.NODEJS_14_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          `/../src/telegram/telegram-message-handler.ts`
        ),
        timeout: Duration.seconds(10),
        environment: {
          telegramApiKeyArn: token.secretArn,
          dynamoTable: telegramTable.tableName,
          sentryEnv: this.props.stage,
        },
        bundling: {
          minify: true,
          sourceMap: true,
        },
      }
    );

    const telegramCommandLambda = new NodejsFunction(
      this,
      `telegramCommandLambda-${this.props.stage}`,
      {
        memorySize: 512,
        runtime: Runtime.NODEJS_14_X,
        handler: "handler",
        entry: path.join(
          __dirname,
          `/../src/telegram/telegram-command-handler.ts`
        ),
        timeout: Duration.seconds(10),
        environment: {
          telegramApiKeyArn: token.secretArn,
          dynamoTable: telegramTable.tableName,
          sentryEnv: this.props.stage,
        },
        bundling: {
          minify: true,
          sourceMap: true,
        },
      }
    );

    const topic = new Topic(this, `telegram-command-topic-${this.props.stage}`);
    const method = restApi.root
      .addResource("bot")
      .addMethod(
        "POST",
        new LambdaIntegration(telegramBotLambda, { proxy: true })
      );

    telegramCommandLambda.addEventSource(new SnsEventSource(topic));
    token.grantRead(telegramBotLambda);
    token.grantRead(telegramCommandLambda);
    telegramTable.grantReadWriteData(telegramBotLambda);
    telegramTable.grantReadWriteData(telegramCommandLambda);
  }
}
