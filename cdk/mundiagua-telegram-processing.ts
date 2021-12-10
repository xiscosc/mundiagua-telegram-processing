#!/usr/bin/env node
import "source-map-support/register";
import { MundiaguaTelegramProcessingStack } from "./mundiagua-telegram-processing-stack";
import { App } from "@aws-cdk/core";

const app = new App();
const stage: string = process.env.stage as string;
const telegramApiArn: string = process.env.telegramApiArn as string;
const sentryDsn: string = process.env.sentryDsn as string;

const telegramStackProps = {
  stage: stage,
  telegramApiKeyArn: telegramApiArn,
  sentryDsn: sentryDsn,
};

new MundiaguaTelegramProcessingStack(
  app,
  "MundiaguaTelegramProcessingStack-" + stage,
  telegramStackProps
);
