#!/bin/bash

echo "🚀 Starting Compliance Management Frontend..."

if [ ! -f .env.local ]; then
    echo "✅ Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env.local
fi

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To start the production server, run:"
echo "  npm start"
echo ""
echo "📝 Make sure the backend is running on http://localhost:8080"
