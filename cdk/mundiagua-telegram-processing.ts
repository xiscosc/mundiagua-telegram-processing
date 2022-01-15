#!/usr/bin/env node
import "source-map-support/register";
import { MundiaguaTelegramProcessingStack } from "./mundiagua-telegram-processing-stack";
import { App } from "aws-cdk-lib";

const app = new App();
const stage: string = process.env.stage as string;
const telegramApiArn: string = process.env.telegramApiArn as string;

const telegramStackProps = {
  stage: stage,
  telegramApiKeyArn: telegramApiArn,
};

new MundiaguaTelegramProcessingStack(
  app,
  "MundiaguaTelegramProcessingStack-" + stage,
  telegramStackProps
);
