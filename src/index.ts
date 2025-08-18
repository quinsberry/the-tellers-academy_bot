import dotenv from 'dotenv';

// Only load .env in development (Railway provides env vars directly)
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import { config } from '@/config';
import { TBot, createBot } from '@/bot';
import { coursesService } from '@/services/CoursesService';
import { localizationService } from '@/services/LocalizationService';
import { sheetsService } from '@/services/SheetsService';
import { logger } from '@/utils/logger';

async function main() {
    console.log('🤖 Starting Telegram Course Bot...\n');

    try {
        const bot: TBot = createBot();

        onShutdown(async () => {
            logger.info('Shutdown');
            await bot.stop();
        });

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

main().catch((error) => {
    logger.error(error as Error, 'Unhandled error');
    process.exit(1);
});

function onShutdown(cleanUp: () => Promise<void>) {
    let isShuttingDown = false;
    const handleShutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        await cleanUp();
    };
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
}
