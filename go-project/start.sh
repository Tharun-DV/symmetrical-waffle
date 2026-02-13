#!/bin/bash

echo "🚀 Starting Compliance Management Backend..."

if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✏️  Please edit .env with your database credentials"
    exit 1
fi

echo "📦 Installing dependencies..."
go mod download

echo "🔨 Building application..."
go build -buildvcs=false -o compliance-server main.go

echo "✅ Build complete!"
echo ""
echo "To start the server, run:"
echo "  ./compliance-server"
echo ""
echo "Or run directly with:"
echo "  go run main.go"
echo ""
echo "📝 Don't forget to:"
echo "  1. Create database: createdb compliance_db"
echo "  2. Run migrations: psql -d compliance_db -f database/schema.sql"
echo "  3. Configure .env file"
