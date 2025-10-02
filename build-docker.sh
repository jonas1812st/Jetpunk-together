#!/bin/bash
# Build script for Jetpunk Together Docker image
# Uses legacy Docker builder to avoid BuildKit npm issues

echo "Building Jetpunk Together Docker image..."
DOCKER_BUILDKIT=0 docker build -t jetpunk-together .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 3000:3000 -e HOST_SERVER='http://your-domain.com:3000' jetpunk-together"
    echo ""
    echo "Or use docker-compose:"
    echo "  docker-compose up -d"
else
    echo "❌ Build failed"
    exit 1
fi
