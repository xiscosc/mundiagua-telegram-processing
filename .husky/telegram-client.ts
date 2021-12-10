import { Axios, AxiosResponse } from "axios";

export class TelegramClient {
  private readonly apiUrl: string;
  private readonly chatId: string | number;
  private httpClient: Axios;

  constructor(token: string, chatId: string | number) {
    console.log("creating client");
    this.apiUrl = `https://api.telegram.org/bot${token}/`;
    this.chatId = chatId;
    console.log("creating client 2");
    this.httpClient = new Axios();
    console.log("client created");
  }

  async sendMessage(text: string) {
    console.log("sending message " + this.apiUrl);
    console.log("sending message " + this.chatId);
    console.log("sending message " + this.httpClient);
    const method = "sendMessage";
    const body = {
      chat_id: this.chatId,
      text: text,
    };

    console.log("sending message " + JSON.stringify(body));
    await this.httpClient.post(this.apiUrl + method, body);
  }
}
