# Storv - Store Management System

A comprehensive store management system built with Nuxt 3, Firebase, and Tailwind CSS.

## Features

- Inventory management with folders and custom templates
- Receipt and sales tracking
- Customer management
- Department and staff management
- Multi-store support
- Real-time analytics and reporting
- Advanced global search
- Dark mode support

## Setup

### Prerequisites

- Node.js 18+ 
- Firebase project with Firestore enabled
- Firebase Authentication enabled

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your Firebase configuration
# See DEPLOYMENT_ENV_SETUP.md for details
```

4. Run the development server:
```bash
npm run dev
```

## Firebase Configuration

The application requires Firebase environment variables to be configured. See [DEPLOYMENT_ENV_SETUP.md](./DEPLOYMENT_ENV_SETUP.md) for detailed instructions.

**Required Environment Variables:**
- `NUXT_PUBLIC_FIREBASE_API_KEY`
- `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NUXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NUXT_PUBLIC_FIREBASE_APP_ID`
- `NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## Deployment

When deploying to production, ensure all Firebase environment variables are set in your deployment platform. The application will display a clear error message if configuration is missing.

See [DEPLOYMENT_ENV_SETUP.md](./DEPLOYMENT_ENV_SETUP.md) for platform-specific instructions.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
