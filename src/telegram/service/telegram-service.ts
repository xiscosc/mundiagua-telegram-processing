import { TelegramDynamoRepo } from "../repository/telegram-dynamo-repo";
import { TelegramInfo } from "../type/telegram-info";
import { TelegramCommand } from "../type/telegram-comand";

const TelegramBot = require("node-telegram-bot-api");
const log = require("lambda-log");

export class TelegramService {
  private bot: any;
  private repo: TelegramDynamoRepo;

  constructor(telegramToken: string, dynamoDbTable: string) {
    this.repo = new TelegramDynamoRepo(dynamoDbTable);
    this.bot = new TelegramBot(telegramToken);
  }

  private async send(message: string, chatId: number) {
    if (chatId) {
      await this.bot.sendMessage(chatId, message);
    } else {
    }
  }

  public async handleCommand(command: TelegramCommand) {
    const userInfo = await this.repo.getRecordByUserId(command.userId);
    if (userInfo !== undefined) {
      log.info(userInfo);
      switch (command.action) {
        case "send":
          await this.send(command.input as string, userInfo.telegramId);
          break;
        case "delete":
          await this.send("Dispositivo desvinculado", userInfo.telegramId);
          await this.repo.deleteUser(command.userId);
          break;
        case "create":
          await this.send("Dispositivo desvinculado", userInfo.telegramId);
          await this.repo.deleteUser(command.userId);
          await this.repo.addUser(command.input as TelegramInfo);
          break;
        default:
          break;
      }
    } else {
      log.info(`Command ${command.action} with undefined user`);
      if (command.action === "create") {
        await this.repo.addUser(command.input as TelegramInfo);
      }
    }
  }

  public async handleMessage(
    message: string | undefined,
    chatId: number | undefined
  ) {
    if (message === undefined || chatId === undefined) {
      log.info("No message or chatId");
      return;
    }
    const userInfo = await this.repo.getRecordByTelegramId(chatId);
    if (userInfo !== undefined) {
      await this.manageRegisteredUser(message, userInfo, chatId);
    } else {
      await this.manageUnregisteredUser(message, chatId);
    }
  }

  private async manageRegisteredUser(
    message: string,
    userInfo: TelegramInfo,
    chatId: number
  ) {
    if (message.startsWith("/start ")) {
      const userId = message.replace("/start ", "");
      if (userId !== userInfo.userId) {
        await this.send(
          `Este dispositivo ya encuentra registrado con otro usuario de averías. El usuario anterior debe vincular un nuevo dispositivo o desvincular todos los dispositivos en https://in.mundiaguabalear.com/core/user/ `,
          chatId
        );
        return;
      }
    }

    await this.send(
      `Bienvenido ${userInfo.name}, en este canal recibirará sus notificaciones`,
      chatId
    );
  }

  private async manageUnregisteredUser(message: string, chatId: number) {
    if (message.startsWith("/start ")) {
      const userId = message.replace("/start ", "");
      const userInfo = await this.repo.getRecordByUserId(userId);
      if (userInfo === undefined) {
        await this.send(
          `El registro ha fallado, compruebe el código y vuelva a probar`,
          chatId
        );
        return;
      }

      userInfo.status = "LINKED";
      userInfo.telegramId = chatId;
      await this.repo.deleteUser(userId);
      await this.repo.addUser(userInfo);
      await this.send(
        `Bienvenido ${userInfo.name}, en este canal recibirará sus notificaciones`,
        chatId
      );
    } else {
      await this.send(
        `Este dispositivo no se encuentra registrado. Visite https://in.mundiaguabalear.com/core/user/ para iniciar el registro`,
        chatId
      );
    }
  }
}
