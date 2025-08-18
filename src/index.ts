import { bot } from '@/bot';
import { config, validateConfigEnv } from '@/config';
import { coursesService } from '@/services/CoursesService';
import { localizationService } from '@/services/LocalizationService';
import { sheetsService } from '@/services/SheetsService';
import { logger } from '@/utils/logger';

async function main() {
    console.log('🤖 Starting Telegram Course Bot...\n');

    try {
        validateConfigEnv();

        // Initialize services first
        console.log('🔧 Initializing services...');
        await Promise.all([sheetsService.init(), coursesService.init(), localizationService.init()]);
        console.log('✅ All services initialized\n');

        // Start the bot
        await bot.start();
        console.log(`🎉 Bot started successfully in ${config.app.nodeEnv} mode`);
    } catch (error) {
        logger.error(error as Error, 'Failed to start application');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.once('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    bot.stop();
    process.exit(0);
});

process.once('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    bot.stop();
    process.exit(0);
});

main().catch((error) => {
    logger.error(error as Error, 'Unhandled error');
    process.exit(1);
});
