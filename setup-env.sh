#!/bin/bash
# Setup script to create .env file from current Firebase config

if [ -f .env ]; then
  echo ".env file already exists. Backing up to .env.backup"
  cp .env .env.backup
fi

cat > .env << 'ENVEOF'
# Firebase Configuration
# Generated from existing Firebase config

NUXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjWHyQswMM_u98vZ5vokrv9m3TuJndPkU
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storv-ux.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=storv-ux
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storv-ux.firebasestorage.app
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1038005888848
NUXT_PUBLIC_FIREBASE_APP_ID=1:1038005888848:web:1630fa92450882af08ee55
NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TW5BCF05NL
ENVEOF

echo ".env file created successfully!"
echo "Please review the .env file and update values if needed."
