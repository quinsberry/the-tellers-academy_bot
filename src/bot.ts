import { Bot, Context, session, SessionFlavor } from 'grammy';
import { config } from './config';
import { UserSession } from './types';
import { Database, Course } from './database';

// Extend the context with session data
type BotContext = Context & SessionFlavor<UserSession>;

export const bot = new Bot<BotContext>(config.telegram.botToken);

// Session middleware
function initial(): UserSession {
  return { step: 'start' };
}

bot.use(session({ initial }));

// Start command
bot.command('start', async (ctx) => {
  ctx.session.step = 'start';
  
  await ctx.reply(
    '🎓 Welcome to Course Bot!\n\n' +
    'I can help you browse and purchase our available courses.\n\n' +
    'Use /courses to see all available courses or /help for more information.'
  );
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📚 Course Bot Help\n\n' +
    '• /start - Start the bot\n' +
    '• /courses - Browse available courses\n' +
    '• /help - Show this help message\n\n' +
    'Simply follow the prompts to select a course, provide your contact information, and complete your purchase!'
  );
});

// Courses command
bot.command('courses', async (ctx) => {
  try {
    const courses = await Database.getCourses();
    
    if (courses.length === 0) {
      await ctx.reply('Sorry, no courses are currently available. Please check back later!');
      return;
    }

    ctx.session.step = 'selecting_course';
    
    let message = '📚 Available Courses:\n\n';
    
    const keyboard = courses.map((course) => {
      const price = (course.price / 100).toFixed(2);
      message += `📖 ${course.name}\n`;
      if (course.description) {
        message += `   ${course.description}\n`;
      }
      message += `   💰 $${price} ${course.currency.toUpperCase()}\n\n`;
      
      return [{ text: `Select: ${course.name}`, callback_data: `select_course_${course.id}` }];
    });

    await ctx.reply(message + 'Choose a course to purchase:', {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    await ctx.reply('Sorry, there was an error loading the courses. Please try again later.');
  }
});

// Course selection callback
bot.callbackQuery(/^select_course_(.+)$/, async (ctx) => {
  const courseId = ctx.match[1];
  
  try {
    const course = await Database.getCourse(courseId);
    
    if (!course) {
      await ctx.answerCallbackQuery('Course not found');
      return;
    }

    ctx.session.selectedCourseId = courseId;
    ctx.session.step = 'entering_contact';

    const price = (course.price / 100).toFixed(2);
    
    await ctx.editMessageText(
      `✅ You selected: ${course.name}\n` +
      `💰 Price: $${price} ${course.currency.toUpperCase()}\n\n` +
      `📞 Please provide your contact information (email or phone number) to proceed with the purchase:`
    );
    
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Error selecting course:', error);
    await ctx.answerCallbackQuery('Error selecting course');
    await ctx.reply('Sorry, there was an error. Please try again.');
  }
});

// Handle contact information
bot.on('message:text', async (ctx) => {
  if (ctx.session.step === 'entering_contact') {
    const contact = ctx.message.text.trim();
    
    // Basic validation for email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    
    if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
      await ctx.reply('Please provide a valid email address or phone number.');
      return;
    }

    ctx.session.contact = contact;
    ctx.session.step = 'payment';

    try {
      const course = await Database.getCourse(ctx.session.selectedCourseId!);
      
      if (!course) {
        await ctx.reply('Course not found. Please start over with /courses');
        return;
      }

      const price = (course.price / 100).toFixed(2);
      
      await ctx.reply(
        `📋 Order Summary:\n\n` +
        `📖 Course: ${course.name}\n` +
        `📞 Contact: ${contact}\n` +
        `💰 Total: $${price} ${course.currency.toUpperCase()}\n\n` +
        `Click the button below to proceed with payment:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: `💳 Pay $${price}`, callback_data: 'proceed_payment' }
            ]]
          }
        }
      );
    } catch (error) {
      console.error('Error preparing payment:', error);
      await ctx.reply('Sorry, there was an error. Please try again.');
    }
  }
});

// Payment callback (placeholder for now)
bot.callbackQuery('proceed_payment', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    '🚧 Payment integration coming soon!\n\n' +
    'Your order has been recorded and we will contact you shortly to complete the payment.\n\n' +
    'Use /courses to browse more courses or /start to begin again.'
  );
  
  // Reset session
  ctx.session.step = 'start';
  delete ctx.session.selectedCourseId;
  delete ctx.session.contact;
});

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

export default bot;
