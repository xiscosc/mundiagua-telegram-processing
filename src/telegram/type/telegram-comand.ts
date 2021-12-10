import { TelegramInfo } from "./telegram-info";

export type TelegramCommand = {
  userId: string;
  action: string;
  input?: string | TelegramInfo;
};
