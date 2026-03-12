import "server-only";

export function getXIntegrationStatus() {
  const accountHandle = process.env.X_ACCOUNT_HANDLE ?? "";
  const apiKey = process.env.X_API_KEY ?? "";
  const apiSecret = process.env.X_API_SECRET ?? "";
  const bearerToken = process.env.X_BEARER_TOKEN ?? "";

  return {
    accountHandle,
    apiKeyPresent: Boolean(apiKey),
    apiSecretPresent: Boolean(apiSecret),
    bearerTokenPresent: Boolean(bearerToken),
    publishingReady: Boolean(accountHandle && apiKey && apiSecret),
    ingestionReady: Boolean(accountHandle && bearerToken),
    configReady: Boolean(accountHandle && apiKey && apiSecret && bearerToken),
  };
}
