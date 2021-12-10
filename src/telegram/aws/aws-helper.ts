import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export async function getSecretFromSecretsManager(
  key: string
): Promise<string> {
  const awsSecret = await new SecretsManagerClient({}).send(
    new GetSecretValueCommand({ SecretId: key })
  );
  return awsSecret.SecretString!!;
}
