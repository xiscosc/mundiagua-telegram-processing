import { TelegramService } from "./service/telegram-service";
import { getSecretFromSecretsManager } from "./aws/aws-helper";
import { TelegramCommand } from "./type/telegram-comand";
const log = require("lambda-log");

export const handler = async (event: any = {}): Promise<any> => {
  try {
    const service = new TelegramService(
      await getSecretFromSecretsManager(
        process.env.telegramApiKeyArn as string
      ),
      process.env.dynamoTable as string
    );
    await Promise.all(
      event.Records.map(async (entry: any) => {
        const command: TelegramCommand = JSON.parse(entry.Sns.Message);
        log.info(command);
        await service.handleCommand(command);
      })
    );
  } catch (e) {
    log.error(e);
  }
};
