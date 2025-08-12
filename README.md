# Telegram Course Bot

A Telegram bot for Tellers Agency Academy course sales with Google Sheets integration.

## Features

- Welcome message with course catalog from JSON file
- Detailed course view with navigation
- User data collection (email, name, work position)
- Data validation and Google Sheets storage
- Payment link integration

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and fill in your API keys
4. Set up Google Sheets and Service Account (see Google Sheets Setup below)
5. Update `src/courses.json` with your courses
6. Run development server: `npm run dev`

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `GOOGLE_SPREADSHEET_ID` - Your Google Spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Your Google Service Account email
- `GOOGLE_PRIVATE_KEY` - Your Google Service Account private key
- `PAYMENT_LINK` - Link to your payment system

## Scripts

- `npm run dev` - Run in development mode with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server

## Google Sheets Setup

1. Create a Google Spreadsheet
2. Create a Google Service Account in Google Cloud Console
3. Generate and download the service account JSON key
4. Share your spreadsheet with the service account email
5. Add the credentials to your `.env` file

The bot will automatically create a "Users" sheet with the following columns:
- Timestamp
- Telegram Username
- Email
- Name
- Work Position
- Course ID
- Course Name

## Course Configuration

Edit `src/courses.json` to add your courses. Each course should have:
- `id` - Unique course identifier
- `name` - Course name
- `short_description` - Brief description for the list view
- `description` - Full description for detail view
- `authors` - Array of author objects with name and image
- `price` - Course price
- `currency` - Price currency
- `start_date` - Course start date (YYYY-MM-DD)
- `end_date` - Course end date (YYYY-MM-DD)
- `image` - Course image URL
- `link` - Course website link

## Bot Flow

1. User starts bot → Welcome message + course list
2. User selects course → Detailed course view
3. User clicks "Buy the course" → Data collection flow
4. User enters email → Name → Work position
5. Data saved to Google Sheets → Payment link provided
