# Jetpunk Together - Deployment Guide

## 📦 Building for Production

The project now uses TypeScript and provides several options for deployment.

### Option 1: Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** along with:
   - `package.json` (production dependencies only)
   - `assets/` folder
   - `database/` folder
   - `.env` file (with production settings)

3. **On the production server**:
   ```bash
   npm ci --only=production
   npm run start:prod
   ```

### Option 2: Docker Deployment

1. **Build Docker image**:
   ```bash
   docker build -t jetpunk-together .
   ```

2. **Run container**:
   ```bash
   docker run -d -p 3000:3000 \
     -e PORT=3000 \
     -e HOST_SERVER="https://your-domain.com" \
     jetpunk-together
   ```

### Option 3: Platform-as-a-Service (Heroku, Railway, etc.)

The project is ready for PaaS deployment with:
- `package.json` configured with proper start scripts
- TypeScript build process
- Environment variable support

## 🌍 Environment Variables

Configure these environment variables for production:

```
PORT=3000
HOST_SERVER=https://your-production-domain.com
```

## 📋 Production Checklist

- [ ] Set `HOST_SERVER` to your actual domain
- [ ] Ensure `database/` folder is writable
- [ ] Configure reverse proxy (nginx) if needed
- [ ] Set up SSL/HTTPS
- [ ] Configure process manager (PM2) for uptime
- [ ] Set up logging and monitoring