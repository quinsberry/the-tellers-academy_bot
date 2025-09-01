function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        console.error(`❌ Missing required environment variable: ${key}`);
        console.error(
            `📋 Available env vars: ${Object.keys(process.env)
                .filter((k) => k.startsWith('TELEGRAM') || k.startsWith('GOOGLE') || k.startsWith('AXIOM'))
                .join(', ')}`,
        );
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config = {
    get telegram() {
        return {
            botToken: getRequiredEnv('TELEGRAM_BOT_TOKEN'),
            supportUrl: process.env.TELEGRAM_SUPPORT_URL || null,
        };
    },
    get googleSheets() {
        return {
            spreadsheetId: getRequiredEnv('GOOGLE_SPREADSHEET_ID'),
            spreadsheeTabName: getRequiredEnv('GOOGLE_SPREADSHEET_TAB_NAME'),
            serviceAccountEmail: getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
            privateKey: getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
        };
    },
    get app() {
        return {
            maxRequestsPerMinutePerUser: 100,
            defaultLanguage: 'ua',
            nodeEnv: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT || '3000', 10),
            timezone: process.env.APP_TIMEZONE || 'Europe/Kiev',
        };
    },
    get logger() {
        return {
            AXIOM_DATASET: getRequiredEnv('AXIOM_DATASET'),
            AXIOM_TOKEN: getRequiredEnv('AXIOM_TOKEN'),
        };
    },
};
