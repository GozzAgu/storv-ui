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

### Vercel Deployment

When deploying to Vercel, you **must** set Firebase environment variables:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add all 7 Firebase environment variables (see values below)
3. **Redeploy** your application after adding variables

**Quick Setup**: See [VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md) for detailed step-by-step instructions.

**Required Variables for Vercel:**
```
NUXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjWHyQswMM_u98vZ5vokrv9m3TuJndPkU
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storv-ux.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=storv-ux
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storv-ux.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1038005888848
NUXT_PUBLIC_FIREBASE_APP_ID=1:1038005888848:web:1630fa92450882af08ee55
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TW5BCF05NL
```

⚠️ **Important**: 
- Variables must start with `NUXT_PUBLIC_` to be available in the browser
- You must **redeploy** after adding variables
- Select **Production**, **Preview**, and **Development** environments

For other platforms, see [DEPLOYMENT_ENV_SETUP.md](./DEPLOYMENT_ENV_SETUP.md).

## Documentation

- **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Complete step-by-step guide for setting environment variables in Vercel
- **[DEPLOYMENT_ENV_SETUP.md](./DEPLOYMENT_ENV_SETUP.md)** - General deployment guide for all platforms
