# Presence Shift Companion

A Next.js-based AI chatbot that guides users through The Presence Shift®—a brief, structured 5-step ritual designed to help individuals transition mindfully between activities in their day.

## Overview

The Presence Shift Companion is an intelligent conversational interface powered by OpenAI's GPT-4 that walks users through five distinct steps:

1. **Answer** - Acknowledge how your day feels right now
2. **Intend** - Set a clear intention for what's next
3. **Focus** - Identify what deserves attention
4. **Flow** - Find your grounded entry point
5. **Begin** - Step into your next activity with presence

## Features

- 🤖 **AI-Powered Guidance** - GPT-4o drives adaptive, context-aware conversations
- 🔄 **Structured Flow** - Step-by-step progression through the ritual
- 💾 **Session Management** - Tracks user progress and conversation context
- 🛡️ **Safety Checks** - Built-in crisis detection with appropriate responses
- ⚙️ **Admin Panel** - Configure ritual scripts and manage versions
- 📱 **Responsive Design** - Works seamlessly on mobile and desktop
- 🎯 **JSON-Structured Responses** - Reliable, validated AI outputs

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4o API
- **Database**: Prisma (session storage)
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd presence-shift-companion
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
OPENAI_API_KEY=your_openai_api_key_here
ADMIN_SECRET=your_secure_admin_password
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### User Flow

1. Navigate to `/shift` to begin a Presence Shift session
2. Answer the initial questions about your current state and next activity
3. Engage in conversation as the AI guides you through each step
4. Complete the ritual when you reach the **Begin** step

### Admin Panel

Access the admin panel at `/admin` to:
- View and edit ritual configuration
- Manage step scripts and descriptions
- Update brand voice guidelines
- Configure safety check parameters

**Login**: Use the `ADMIN_SECRET` from your `.env.local` file

## Project Structure

```
presence-shift-companion/
├── app/
│   ├── api/
│   │   └── chat/          # Chat API endpoint
│   ├── admin/             # Admin panel
│   ├── shift/             # Main chat interface
│   └── layout.tsx         # Root layout
├── lib/
│   ├── config.ts          # Ritual configuration
│   ├── promptBuilder.ts   # AI prompt generation
│   ├── safety.ts          # Safety checks
│   ├── sessionStore.ts    # Session management
│   └── types.ts           # TypeScript types
├── config/
│   └── presenceShift.json # Ritual scripts and settings
└── styles/
    └── globals.css        # Global styles
```

## Configuration

Edit `config/presenceShift.json` to customize:

- Step descriptions and scripts
- Brand voice and tone
- Transition rules
- Safety keywords and responses

## API Endpoints

### `POST /api/chat`

Main chat endpoint that processes user messages and returns AI responses.

**Request:**
```json
{
  "sessionId": "string",
  "userMessage": "string",
  "nextActivity": "string" (optional)
}
```

**Response:**
```json
{
  "assistantMessage": "string",
  "currentStep": "ANSWER | INTEND | FOCUS | FLOW | BEGIN | DONE",
  "done": boolean
}
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checking
npm run type-check
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 access | Yes |
| `ADMIN_SECRET` | Password for admin panel access | Yes |
| `DATABASE_URL` | Database connection string (if using persistent storage) | No |

## Deployment

### Deploy to Vercel (Recommended)

This project is optimized for deployment on Vercel. Follow these quick steps:

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Set Root Directory: `MVP/presence-shift-companion` (if applicable)
   - Framework: Next.js (auto-detected)

3. **Configure Environment Variables**
   Add these in Vercel dashboard:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ADMIN_SECRET=your_secure_admin_password
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live at: `https://your-project.vercel.app`

5. **Test Your Deployment**
   - Visit `/shift` - Test the chat interface
   - Visit `/admin` - Verify admin panel access

**📚 For detailed deployment instructions, troubleshooting, and custom domain setup, see:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOY_QUICK_REFERENCE.md](./DEPLOY_QUICK_REFERENCE.md) - One-page quick reference

### Automatic Updates

Once deployed, Vercel automatically redeploys on every `git push` to your main branch:
```bash
git push origin main  # Triggers automatic deployment
```

### Environment Variables

After deployment, you can update environment variables in:
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Remember to redeploy after changing variables

## Troubleshooting

### Hydration Errors
If you encounter React hydration errors, ensure nested layouts don't contain `<html>` or `<body>` tags. Only the root `app/layout.tsx` should have these.

### JSON Parsing Errors
The system uses GPT-4's JSON mode to ensure valid responses. If issues persist, check the `promptBuilder.ts` configuration and ensure `response_format` is set correctly.

### Session State Issues
Clear the `.next` cache folder and restart the dev server if session data appears inconsistent.

### Deployment Issues
- **Build fails**: Run `npm run build` locally first to catch errors
- **404 errors**: Verify Root Directory setting in Vercel
- **API key errors**: Check environment variables are set in Vercel dashboard
- **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete troubleshooting guide**

## Security Considerations

- Store `ADMIN_SECRET` securely and use a strong password
- Never commit `.env.local` to version control
- The app includes basic safety checks but is not a substitute for professional mental health support
- Crisis resources are displayed when safety keywords are detected

## License

[Your License Here]

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Documentation

- [README.md](./README.md) - This file, project overview
- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete Vercel deployment guide
- [DEPLOY_QUICK_REFERENCE.md](./DEPLOY_QUICK_REFERENCE.md) - Quick deployment reference
- [IMPROVEMENTS.md](./IMPROVEMENTS.md) - Technical improvements documentation
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentation hub

## Support

For issues or questions, please open a GitHub issue or contact [your-email@example.com].

---

Built with ❤️ using Next.js and OpenAI
