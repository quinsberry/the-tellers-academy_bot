import { Bot, Context, session, SessionFlavor } from 'grammy';
import { config } from './config';
import { UserSession } from './types';
import { CoursesService, Course } from '@/services/CoursesService';
import { SheetsService, UserData } from '@/services/SheetsService';

// Extend the context with session data
type BotContext = Context & SessionFlavor<UserSession>;

export const bot = new Bot<BotContext>(config.telegram.botToken);

// Session middleware
function initial(): UserSession {
  return { step: 'start' };
}

bot.use(session({ initial }));

// Start command - show welcome message and course list
bot.command('start', async (ctx) => {
  await showWelcomeAndCourses(ctx);
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    '📚 Tellers Agency Academy Help\n\n' +
    '• /start - Start the bot and see course list\n' +
    '• /help - Show this help message\n\n' +
    'Simply select a course to view details and purchase!'
  );
});

// Function to show welcome message and course list
async function showWelcomeAndCourses(ctx: BotContext, edit = false) {
  ctx.session.step = 'start';
  
  try {
    const courses = CoursesService.getAllCourses();
    
    if (courses.length === 0) {
      const errorMsg = 'Sorry, no courses are currently available. Please check back later!';
      if (edit) {
        await ctx.editMessageText(errorMsg);
      } else {
        await ctx.reply(errorMsg);
      }
      return;
    }

    let message = '🎓 *Welcome to the Tellers Agency Academy*\n\n';
    message += '📚 *Available Courses:*\n\n';
    
    const keyboard = courses.map((course, index) => {
      message += `*${course.name}*\n`;
      message += `${course.short_description}\n\n`;
      message += `   📅 Starts: *${CoursesService.formatDate(course.start_date)}*\n`;
      message += `   💰 ${course.price} ${course.currency}\n\n`;
      
      return [{ text: `${course.name}`, callback_data: `course_${course.id}` }];
    });

    const finalMessage = message + '👇 *Select a course to view details:*';
    const replyMarkup = {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };

    if (edit) {
      await ctx.editMessageText(finalMessage, { ...replyMarkup, parse_mode: 'Markdown' });
    } else {
      await ctx.reply(finalMessage, { ...replyMarkup, parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error loading courses:', error);
    const errorMsg = 'Sorry, there was an error loading the courses. Please try again later.';
    if (edit) {
      await ctx.editMessageText(errorMsg);
    } else {
      await ctx.reply(errorMsg);
    }
  }
}

// Course detail view
bot.callbackQuery(/^course_(\d+)$/, async (ctx) => {
  const courseId = parseInt(ctx.match[1]);
  
  try {
    const course = CoursesService.getCourseById(courseId);
    
    if (!course) {
      await ctx.answerCallbackQuery('Course not found');
      return;
    }

    ctx.session.selectedCourseId = courseId;
    ctx.session.step = 'course_detail';

    const message = formatCourseDetails(course);
    
    await ctx.editMessageText(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💳 Buy the course', callback_data: 'buy_course' }],
          [{ text: '← Back to courses', callback_data: 'back_to_courses' }]
        ]
      }
    });
    
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Error showing course details:', error);
    await ctx.answerCallbackQuery('Error loading course details');
  }
});

// Format course details message
function formatCourseDetails(course: Course): string {
  return `📖 ${course.name}\n\n` +
         `📝 ${course.description}\n\n` +
         `👥 Authors: ${CoursesService.formatAuthors(course.authors)}\n\n` +
         `📅 Start Date: ${CoursesService.formatDate(course.start_date)}\n` +
         `📅 End Date: ${CoursesService.formatDate(course.end_date)}\n\n` +
         `💰 Price: ${course.price} ${course.currency}`;
}

// Back to courses
bot.callbackQuery('back_to_courses', async (ctx) => {
  await ctx.answerCallbackQuery();
  await showWelcomeAndCourses(ctx, true); // Pass true to edit the message
});

// Buy course - start data collection
bot.callbackQuery('buy_course', async (ctx) => {
  ctx.session.step = 'entering_email';
  
  await ctx.editMessageText(
    '📧 Please enter your email address:',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '← Back to course', callback_data: `course_${ctx.session.selectedCourseId}` }
        ]]
      }
    }
  );
  
  await ctx.answerCallbackQuery();
});

// Handle text messages based on current step
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  
  switch (ctx.session.step) {
    case 'entering_email':
      await handleEmailInput(ctx, text);
      break;
    case 'entering_name':
      await handleNameInput(ctx, text);
      break;
    case 'entering_position':
      await handlePositionInput(ctx, text);
      break;
    default:
      await ctx.reply('Please use /start to begin or select an option from the menu.');
  }
});

// Handle email input
async function handleEmailInput(ctx: BotContext, email: string) {
  // Comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Check if email is too long
  if (email.length > 254) {
    await ctx.reply('❌ Email address is too long. Please enter a valid email address:');
    return;
  }

  // Check if email is too short
  if (email.length < 5) {
    await ctx.reply('❌ Email address is too short. Please enter a valid email address:');
    return;
  }

  // Check email format
  if (!emailRegex.test(email)) {
    await ctx.reply('❌ Please enter a valid email address (e.g., user@example.com):');
    return;
  }

  // Check for common typos in domains
  const commonDomainTypos = {
    'gmail.com': ['gmai.com', 'gmial.com', 'gmail.co', 'gmaill.com'],
    'yahoo.com': ['yaho.com', 'yahoo.co', 'yahooo.com'],
    'hotmail.com': ['hotmai.com', 'hotmail.co', 'hotmial.com'],
    'outlook.com': ['outlook.co', 'outlok.com']
  };

  const domain = email.split('@')[1]?.toLowerCase();
  for (const [correctDomain, typos] of Object.entries(commonDomainTypos)) {
    if (typos.includes(domain)) {
      await ctx.reply(`❌ Did you mean *${email.replace(domain, correctDomain)}*? Please enter the correct email address:`, {
        parse_mode: 'Markdown'
      });
      return;
    }
  }

  ctx.session.email = email.toLowerCase().trim();
  ctx.session.step = 'entering_name';
  
  await ctx.reply('👤 Please enter your full name:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '← Back to course', callback_data: `course_${ctx.session.selectedCourseId}` }
      ]]
    }
  });
}

// Handle name input
async function handleNameInput(ctx: BotContext, name: string) {
  const trimmedName = name.trim();
  
  // Check minimum length
  if (trimmedName.length < 2) {
    await ctx.reply('❌ Please enter a valid name (at least 2 characters):');
    return;
  }

  // Check maximum length
  if (trimmedName.length > 100) {
    await ctx.reply('❌ Name is too long. Please enter a name with less than 100 characters:');
    return;
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\s\-'\.]+$/;
  if (!nameRegex.test(trimmedName)) {
    await ctx.reply('❌ Please enter a valid name using only letters, spaces, hyphens, and apostrophes:');
    return;
  }

  // Check for minimum number of parts (at least first name)
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  if (nameParts.length < 1) {
    await ctx.reply('❌ Please enter at least your first name:');
    return;
  }

  // Check that each part has reasonable length
  const hasValidParts = nameParts.every(part => part.length >= 1 && part.length <= 50);
  if (!hasValidParts) {
    await ctx.reply('❌ Please enter a valid name (each part should be 1-50 characters):');
    return;
  }

  // Check for suspicious patterns (repeated characters, etc.)
  if (/(.)\1{4,}/.test(trimmedName)) {
    await ctx.reply('❌ Please enter a real name:');
    return;
  }

  // Capitalize properly
  const capitalizedName = nameParts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

  ctx.session.name = capitalizedName;
  ctx.session.step = 'entering_position';
  
  await ctx.reply('💼 Please enter your work position:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '← Back to course', callback_data: `course_${ctx.session.selectedCourseId}` }
      ]]
    }
  });
}

// Handle work position input
async function handlePositionInput(ctx: BotContext, position: string) {
  const trimmedPosition = position.trim();
  
  // Check minimum length
  if (trimmedPosition.length < 2) {
    await ctx.reply('❌ Please enter a valid work position (at least 2 characters):');
    return;
  }

  // Check maximum length
  if (trimmedPosition.length > 100) {
    await ctx.reply('❌ Work position is too long. Please enter a position with less than 100 characters:');
    return;
  }

  // Check for valid characters (letters, numbers, spaces, common punctuation)
  const positionRegex = /^[a-zA-ZÀ-ÿĀ-žА-я0-9\s\-\.\,\&\/\(\)]+$/;
  if (!positionRegex.test(trimmedPosition)) {
    await ctx.reply('❌ Please enter a valid work position using letters, numbers, and common punctuation:');
    return;
  }

  // Check for suspicious patterns (too many repeated characters)
  if (/(.)\1{4,}/.test(trimmedPosition)) {
    await ctx.reply('❌ Please enter a real work position:');
    return;
  }

  // Check that it's not just numbers or special characters
  if (!/[a-zA-ZÀ-ÿĀ-žА-я]/.test(trimmedPosition)) {
    await ctx.reply('❌ Please enter a valid work position that contains letters:');
    return;
  }

  // Capitalize first letter of each word
  const capitalizedPosition = trimmedPosition
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  ctx.session.workPosition = capitalizedPosition;
  ctx.session.step = 'completed';
  
  // Save data to Google Sheets
  try {
    const course = CoursesService.getCourseById(ctx.session.selectedCourseId!);
    if (!course) {
      throw new Error('Course not found');
    }

    const userData: UserData = {
      telegramUsername: ctx.from?.username || `${ctx.from?.first_name} ${ctx.from?.last_name}` || 'Unknown',
      email: ctx.session.email!,
      name: ctx.session.name!,
      workPosition: ctx.session.workPosition!,
      courseId: course.id,
      courseName: course.name,
      timestamp: new Date().toISOString()
    };

    await SheetsService.saveUserData(userData);

    // Show success message with payment link
    await ctx.reply(
      '✅ Your information has been saved successfully!\n\n' +
      '💳 Follow the link to pay and save the receipt. You will need to confirm your purchase:\n\n' +
      `${course.payment_link}\n\n` +
      'Thank you for choosing Tellers Agency Academy!',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🏠 Back to courses', callback_data: 'back_to_courses' }
          ]]
        }
      }
    );

    // Reset session
    ctx.session = { step: 'start' };

  } catch (error) {
    console.error('Error saving user data:', error);
    await ctx.reply(
      '❌ Sorry, there was an error saving your information. Please try again later.\n\n' +
      'Use /start to return to the course list.'
    );
  }
}

// Error handler
bot.catch((err) => {
  console.error('Bot error:', err);
});

export default bot;