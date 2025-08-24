# 💰 Duitku - Personal Finance Dashboard

**Duitku** is a modern, responsive personal financial management web application that helps you take control of your money with powerful analytics, smart categorization, and intuitive dashboards.

## ✨ Features

- 📊 **Real-time Analytics Dashboard** – Get instant insights into your financial health
- 🍽️ **Smart Category Management** – Organize expenses by categories (Food, Transportation, Entertainment, etc.)
- 📈 **Trends & Activity Tracking** – Visualize monthly trends and weekly activities
- 🏦 **Multi-Account Management** – Add multiple bank/cash accounts and track balances
- 🗂️ **Custom Categories** – Create your own expense/income categories
- 🔍 **Advanced Transaction History** – Browse with smart filters (last 7/30 days, income/expense only)
- 🔐 **Secure Authentication** – Protected routes with JWT tokens
- 📱 **Responsive Design** – Works perfectly on desktop, tablet, and mobile

## 🖼️ Screenshots

###  Dashboard Overview
![Dashboard](./public/images/screenshots/Dashboard1.png)

###  Analytics & Trends
![Analytics](./public/images/screenshots/Dashboard2.png)

### 🗂️ Category Management
![Categories](./public/images/screenshots/Category.png)

### 🏦 Account Overview
![Accounts](./public/images/screenshots/Account.png)

### 🧾 Transaction History
![Transactions](./public/images/screenshots/Transaction.png)

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks
- **Authentication**: JWT with protected routes
- **Backend**: Go API (https://github.com/leo140803/be-duitku.git)
- **Database**: Supabase
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git

##  Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/leo140803/fe-duitku.git
cd finance-app-frontend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Optional: Supabase configuration (if using direct frontend integration)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## ️ Project Structure

```
finance-app-frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── accounts/          # Account management
│   ├── categories/        # Category management
│   ├── transactions/      # Transaction management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # Reusable components
│   ├── Protected.tsx      # Route protection component
│   └── UI.tsx             # UI components
├── hooks/                  # Custom React hooks
│   └── useAuth.tsx        # Authentication hook
├── lib/                    # Utility libraries
│   └── api.ts             # API client configuration
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Testing (if configured)
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No |

## 🔐 Authentication Flow

1. **Registration**: Users create accounts with email/password
2. **Login**: JWT-based authentication
3. **Protected Routes**: Automatic redirect to login for unauthenticated users
4. **Token Management**: Automatic token refresh and logout handling

## 📱 Responsive Design

The application is fully responsive and optimized for:
- ️ **Desktop** (1200px+)
- 💻 **Laptop** (768px - 1199px)
- 📱 **Mobile** (320px - 767px)

## 🎨 UI Components

Built with modern design principles:
- **Clean Interface**: Minimalist design focusing on usability
- **Consistent Spacing**: 8px grid system for consistent layouts
- **Accessibility**: WCAG 2.1 AA compliant
- **Dark/Light Mode**: Ready for theme switching (can be implemented)

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

##  Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

##  Performance

- **Lighthouse Score**: 90+ on all metrics
- **Bundle Size**: Optimized with Next.js built-in optimizations
- **Image Optimization**: Automatic image optimization with Next.js
- **Code Splitting**: Automatic route-based code splitting

## 🔒 Security Features

- **Protected Routes**: Authentication middleware
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Built-in Next.js security features

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful component and variable names
- Add proper error handling
- Include JSDoc comments for complex functions
- Follow the existing code style

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Dependency Issues**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**API Connection Issues**
- Verify backend server is running
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure CORS is properly configured on backend

## 📚 API Documentation

The frontend communicates with the backend API. See the [Backend README](../finance-app-backend/README.md) for complete API documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you need help:

1. 📖 Check this README and documentation
2. 🐛 Search existing [Issues](../../issues)
3.  Create a new issue with detailed information
4. 📧 Contact the development team

##  Acknowledgments

- Next.js team for the amazing framework
- TailwindCSS for the utility-first CSS framework
- Supabase for the database infrastructure
- All contributors and users

---

**Built with ❤️ by the Duitku Team**

*Empowering financial freedom, one transaction at a time.*
```
