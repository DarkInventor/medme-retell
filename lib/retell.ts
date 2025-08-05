import { Retell } from 'retell-sdk';

if (!process.env.RETELL_API_KEY) {
  console.warn('RETELL_API_KEY not found in environment variables');
}

const client = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export default client;