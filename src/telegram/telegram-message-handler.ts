import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSecretFromSecretsManager } from "./aws/aws-helper";
import { TelegramService } from "./service/telegram-service";
const Sentry = require("@sentry/node");
const log = require("lambda-log");

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const update = JSON.parse(event.body!!);
    const chatId = update?.message?.chat?.id ?? undefined;
    const message = update?.message?.text ?? undefined;
    const service = new TelegramService(
      await getSecretFromSecretsManager(
        process.env.telegramApiKeyArn as string
      ),
      process.env.dynamoTable as string
    );
    await service.handleMessage(message, chatId);
  } catch (e) {
    log.error(e);
    Sentry.captureException(e);
  }

  return { statusCode: 200, body: "OK" };
};
