import { bot } from './bot';
import { config, validateConfigEnv } from './config';
import { coursesService } from './services/CoursesService';
import { sheetsService } from './services/SheetsService';
import { logInfo, logError } from './utils/logger';

async function main() {
    console.log('🤖 Starting Telegram Course Bot...\n');

    try {
        validateConfigEnv();

        // Initialize services first
        console.log('🔧 Initializing services...');
        await Promise.all([sheetsService.init(), coursesService.init()]);
        console.log('✅ All services initialized\n');

        // Start the bot
        await bot.start();
        console.log(`🎉 Bot started successfully in ${config.app.nodeEnv} mode`);
    } catch (error) {
        logError('Failed to start application', error as Error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.once('SIGINT', () => {
    logInfo('Received SIGINT, shutting down gracefully');
    bot.stop();
    process.exit(0);
});

process.once('SIGTERM', () => {
    logInfo('Received SIGTERM, shutting down gracefully');
    bot.stop();
    process.exit(0);
});

main().catch((error) => {
    logError('Unhandled error', error as Error);
    process.exit(1);
});
