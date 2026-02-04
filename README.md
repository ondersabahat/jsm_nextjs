# DevFlow

A modern Q&A platform built with Next.js, featuring AI-powered answers, job search integration, and a vibrant developer community.

## 🚀 Features

- **Questions & Answers**: Ask questions, provide answers, and engage with the community
- **AI-Powered Answers**: Get intelligent answers powered by OpenAI
- **Voting System**: Upvote and downvote questions and answers
- **Tags & Categories**: Organize content with tags and filter by topics
- **User Profiles**: Customizable profiles with reputation points and badges
- **Collections**: Save favorite questions to your personal collection
- **Job Search**: Integrated job search powered by JSearch API
- **Authentication**: Multiple auth options (GitHub, Google, Email/Password)
- **Dark Mode**: Beautiful dark/light theme support
- **Responsive Design**: Fully responsive design for all devices
- **Real-time Search**: Global and local search functionality

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible component primitives
- **MDX Editor** - Rich text editor for questions/answers
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **NextAuth.js v5** - Authentication
- **bcryptjs** - Password hashing

### External Services
- **OpenAI API** - AI-powered answers
- **JSearch API (RapidAPI)** - Job search
- **Rest Countries API** - Country data for job filters

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Pino** - Logging

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **MongoDB** database (local or MongoDB Atlas)
- **Git**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jsm_nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Authentication
   AUTH_SECRET="your-auth-secret"
   AUTH_GITHUB_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   # Database
   MONGODB_URI="your-mongodb-connection-string"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"

   # RapidAPI (JSearch)
   NEXT_PUBLIC_RAPID_API_KEY="your-rapidapi-key"

   # API Base URL (optional, defaults to localhost:3000)
   NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
jsm_nextjs/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (root)/            # Main application routes
│   └── api/               # API routes
├── components/             # React components
│   ├── cards/             # Card components
│   ├── forms/             # Form components
│   ├── filters/           # Filter components
│   ├── navigation/        # Navigation components
│   ├── search/            # Search components
│   └── ui/                # UI primitives
├── constants/             # Constants and configuration
├── database/              # Mongoose models
├── lib/                   # Utility functions and actions
│   ├── actions/          # Server actions
│   ├── handlers/         # Request/error handlers
│   └── validations/      # Zod schemas
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH_SECRET` | Secret key for NextAuth.js | ✅ |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID | ✅ |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | ✅ |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `NEXT_PUBLIC_RAPID_API_KEY` | RapidAPI key for JSearch | ✅ |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | ❌ |

## ✅ Type Checking

The project includes TypeScript type checking. Before pushing code, run:

```bash
npm run type-check
```

A git pre-push hook is configured to automatically run type checking before pushing to GitHub. If there are TypeScript errors, the push will be blocked.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Netlify**
- **Railway**
- **AWS Amplify**
- **DigitalOcean App Platform**

Make sure to set all required environment variables in your deployment platform.

## 📝 Key Features Explained

### Authentication
- **OAuth Providers**: GitHub and Google authentication
- **Credentials**: Email/password authentication with bcrypt hashing
- **Session Management**: Secure session handling with NextAuth.js

### Database Models
- **Users**: User profiles with reputation and badges
- **Questions**: Questions with tags, votes, and answers
- **Answers**: Answers linked to questions
- **Tags**: Tag system for categorization
- **Votes**: Voting system for questions and answers
- **Collections**: Saved questions for users
- **Interactions**: User interaction tracking

### API Routes
- `/api/users` - User management
- `/api/accounts` - Account management
- `/api/auth` - Authentication endpoints
- `/api/ai/answers` - AI-powered answer generation

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [MongoDB](https://www.mongodb.com/) - Database
- [OpenAI](https://openai.com/) - AI capabilities
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

Built with ❤️ using Next.js
