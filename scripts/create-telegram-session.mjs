import nextEnv from '@next/env';
import telegram from 'telegram';
import telegramSessions from 'telegram/sessions/index.js';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const { loadEnvConfig } = nextEnv;
const { TelegramClient } = telegram;
const { StringSession } = telegramSessions;

loadEnvConfig(process.cwd());

const apiIdRaw = process.env.TELEGRAM_API_ID;
const apiHash = process.env.TELEGRAM_API_HASH;
const apiId = Number(apiIdRaw);

if (!apiIdRaw || !apiHash) {
  console.error('Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env.local');
  process.exit(1);
}

if (!Number.isInteger(apiId) || apiId <= 0) {
  console.error('TELEGRAM_API_ID must be a positive integer');
  process.exit(1);
}

const rl = createInterface({ input, output });
const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
  connectionRetries: 5,
});

try {
  await client.start({
    phoneNumber: async () => rl.question('Telegram phone number (include country code): '),
    password: async () => rl.question('Telegram 2FA password (leave blank if none): '),
    phoneCode: async () => rl.question('Telegram login code: '),
    onError: (err) => console.error(err),
  });

  console.log('\nAdd this to .env.local:');
  console.log(`TELEGRAM_SESSION_STRING=${client.session.save()}`);
} finally {
  rl.close();
  await client.disconnect();
}
