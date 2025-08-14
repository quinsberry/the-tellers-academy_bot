import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN!,
    supportUrl: process.env.TELEGRAM_SUPPORT_URL || null,
  },
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID!,
    spreadsheeTabName: process.env.GOOGLE_SPREADSHEET_TAB_NAME!,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    timezone: process.env.APP_TIMEZONE || 'Europe/Kiev',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'GOOGLE_SPREADSHEET_ID',
  'GOOGLE_SPREADSHEET_TAB_NAME',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
