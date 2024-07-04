import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

let graphClient: Client | null = null;

export const initializeGraphClient = () => {
  if (!graphClient) {
    const credential = new ClientSecretCredential(
      process.env.GRAPH_TENANT_ID!,
      process.env.GRAPH_CLIENT_ID!,
      process.env.GRAPH_CLIENT_SECRET!
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    graphClient = Client.initWithMiddleware({ authProvider });
  }
  return graphClient;
};