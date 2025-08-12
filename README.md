# Telegram Course Bot

A Telegram bot for course sales with Stripe payments and Supabase backend.

## Features

- Course catalog display
- Contact collection
- Stripe payment integration
- Order management with Supabase

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and fill in your API keys
4. Set up Supabase database (see Database Schema below)
5. Run development server: `npm run dev`

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Scripts

- `npm run dev` - Run in development mode
- `npm run dev:watch` - Run in development mode with auto-reload
- `npm run build` - Build for production
- `npm start` - Start production server

## Database Schema

### Courses Table
```sql
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  user_id TEXT NOT NULL, -- Telegram user ID
  user_name TEXT,
  user_contact TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
