import { ClientSecretCredential } from '@azure/identity';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

async function getToken() {
  const clientSecretCredential = new ClientSecretCredential(
    process.env.GRAPH_TENANT_ID!,
    process.env.NEXT_PUBLIC_GRAPH_CLIENT_ID!,
    process.env.GRAPH_CLIENT_SECRET!
  );

  try {
    // Request token with the correct scope
    const token = await clientSecretCredential.getToken(['https://graph.microsoft.com/.default']);
    console.log('Token:', token.token);
  } catch (error) {
    console.error('Error fetching token:', error);
  }
}

getToken();
