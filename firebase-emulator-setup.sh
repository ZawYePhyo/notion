#!/bin/bash
# Quick Firebase Emulator Setup Script

echo "Setting up Firebase Emulators for local testing..."

# Update .env for emulator use
cat > .env << 'EOF'
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=demo-dzn-timme
VITE_FIREBASE_STORAGE_BUCKET=demo-dzn-timme.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
EOF

echo "✅ Environment configured for emulators"
echo ""
echo "To start emulators, run:"
echo "  firebase emulators:start"
echo ""
echo "Then access the app at http://localhost:5173"
