import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocument,
  GetCommand,
  GetCommandInput,
  QueryCommandInput,
  QueryCommand,
  DeleteCommand,
  DeleteCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { TelegramInfo } from "../type/telegram-info";
const log = require("lambda-log");

export class TelegramDynamoRepo {
  private readonly _table: string;

  constructor(table: string) {
    this._table = table;
  }

  public async getRecordByTelegramId(
    chatId: number
  ): Promise<TelegramInfo | undefined> {
    const client = TelegramDynamoRepo.createClient();
    const input: QueryCommandInput = {
      TableName: this._table,
      IndexName: "telegramId",
      KeyConditionExpression: "telegramId = :telegramChat",
      ExpressionAttributeValues: { ":telegramChat": chatId },
    };
    log.info("Getting info with chatId");
    log.info(input);
    const result = await client.send(new QueryCommand(input));
    const records = (result?.Items as TelegramInfo[]) ?? [];
    if (records.length !== 1) {
      return undefined;
    } else {
      return records[0];
    }
  }

  public async getRecordByUserId(
    userId: string
  ): Promise<TelegramInfo | undefined> {
    const client = TelegramDynamoRepo.createClient();
    const input: GetCommandInput = {
      TableName: this._table,
      Key: { userId: userId },
    };
    const result = await client.send(new GetCommand(input));
    return (result?.Item as TelegramInfo) ?? undefined;
  }

  public async deleteUser(userId: string) {
    const client = TelegramDynamoRepo.createClient();
    const input: DeleteCommandInput = {
      TableName: this._table,
      Key: { userId: userId },
    };
    await client.send(new DeleteCommand(input));
  }

  public async addUser(info: TelegramInfo) {
    const client = TelegramDynamoRepo.createClient();
    const input: PutCommandInput = {
      TableName: this._table,
      Item: info,
    };
    await client.send(new PutCommand(input));
  }

  private static createClient() {
    const client = new DynamoDBClient({});
    return DynamoDBDocument.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
}
