import { bot } from './bot';
import { config } from './config';
import { coursesService } from './services/CoursesService';
import { sheetsService } from './services/SheetsService';

async function main() {
    console.log('🤖 Starting Telegram Course Bot...\n');

    try {
        // Initialize services first
        console.log('🔧 Initializing services...');
        await Promise.all([sheetsService.init(), coursesService.init()]);
        console.log('✅ All services initialized\n');

        // Start the bot
        await bot.start();
        console.log(`🎉 Bot started successfully in ${config.app.nodeEnv} mode`);
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        console.error('\n💡 Fix the issues above and try again.');
        process.exit(1);
    }
}

// Handle graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    bot.stop();
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    bot.stop();
    process.exit(0);
});

main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
