# MeetHub

A modern meeting platform built with Next.js, NestJS, and Turborepo.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MeetHub

# Install all dependencies
pnpm install
```
Setup .env trong apps/api => create .env

```bash
PORT=8000
MONGODB_URI=mongodb+srv://novastack:ta7GN2kXrTzCU7WT@digitic.ifsul6g.mongodb.net/meethub?retryWrites=true&w=majority&appName=digitic
```

This will install dependencies for all apps and packages in the monorepo.

## 📁 Project Structure

```
MeetHub/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── packages/
│   └── ui/           # Shared UI components (future)
├── package.json      # Root package.json with workspace scripts
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
```

## 🛠️ Development

### Start all applications

```bash
# Start both web and API in development mode
pnpm dev
```

### Start specific applications

```bash
# Start only the web application
pnpm dev:web

# Start only the API
pnpm dev:api
```

### Build all applications

```bash
# Build all apps and packages
pnpm build
```

### Code Quality

```bash
# Run linting across all packages
pnpm lint

# Check TypeScript types
pnpm check-types

# Format code with Prettier
pnpm format
```

## 🌐 Applications

### Web App (`apps/web`)

- **Framework**: Next.js 15
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS
- **Port**: 3000

### API (`apps/api`)

- **Framework**: NestJS
- **Language**: TypeScript
- **Port**: 3001

## 🏗️ Build & Deploy

### Local Build

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build --filter=web
pnpm build --filter=api
```

### Production

Each application can be deployed independently:

- **Web**: Deploy to Vercel, Netlify, or any static hosting
- **API**: Deploy to Railway, Heroku, or any Node.js hosting

## 🔧 Configuration

### Turborepo

- **Cache**: Enabled for faster builds
- **Remote Caching**: Available with Vercel account
- **Tasks**: build, dev, lint, check-types

### Package Manager

- **pnpm**: Used for efficient dependency management
- **Workspace**: Configured for monorepo structure

## 📦 Available Scripts

| Script             | Description                                |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Start all applications in development mode |
| `pnpm dev:web`     | Start only the web application             |
| `pnpm dev:api`     | Start only the API                         |
| `pnpm build`       | Build all applications                     |
| `pnpm lint`        | Run ESLint across all packages             |
| `pnpm check-types` | Run TypeScript type checking               |
| `pnpm format`      | Format code with Prettier                  |

## 🚀 Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Start development servers**:

   ```bash
   pnpm dev
   ```

3. **Open your browser**:
   - Web App: http://localhost:3000
   - API: http://localhost:3001

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

