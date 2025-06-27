# ChatBot Platform - AI-Powered Chatbot SaaS

A modern SaaS platform for creating, customizing, and embedding AI chatbots on websites. Built with Next.js 15, Supabase, Stripe, and OpenAI.

## Features

- 🤖 **AI-Powered Chatbots** - Train ChatGPT on your own data
- 📚 **Knowledge Base Integration** - Upload PDFs and scrape websites
- 💳 **Subscription Management** - Stripe-powered billing with multiple plans
- 🎨 **Customizable Widgets** - Embed beautiful chat widgets on any website
- 📊 **Analytics Dashboard** - Track usage and performance
- 🔒 **User Authentication** - Secure user management with Supabase
- 🚀 **Production Ready** - Comprehensive testing and CI/CD

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4, LangChain, Vector embeddings
- **Payments**: Stripe
- **Authentication**: Supabase Auth
- **Testing**: Vitest, Playwright, React Testing Library
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 20.11.1 or higher
- pnpm package manager
- Supabase account
- Stripe account
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd chatbot-platform
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID=your_stripe_price_id

# Stripe Price IDs for different plans
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOW_COMING_SOON=false

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Stripe Setup

1. Create a Stripe account and get your API keys
2. Create products and price IDs for your plans:
   - Pro Monthly
   - Pro Yearly
   - Enterprise Monthly
   - Enterprise Yearly
3. Set up webhook endpoints pointing to `/api/stripe/webhook`
4. Update the price IDs in your environment variables

### 5. OpenAI Setup

1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to your environment variables

### 6. Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Build for production
pnpm build
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to set these in your production environment:

- All Supabase keys
- OpenAI API key
- Stripe keys and webhook secret
- Upstash Redis credentials
- `NEXT_PUBLIC_APP_URL` pointing to your production domain

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── chat/              # Chat interface
│   └── ...
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── chatbot/          # Chatbot-specific components
│   └── ...
├── lib/                  # Utility libraries
├── contexts/             # React contexts
├── hooks/                # Custom hooks
└── types/                # TypeScript types
```

## API Endpoints

- `POST /api/chat` - Chat with AI chatbot
- `GET/POST /api/chatbots` - Manage chatbots
- `POST /api/knowledge-base/upload` - Upload documents
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:api
pnpm test:components
pnpm test:pages

# Run e2e tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourdomain.com or create an issue in the repository.
