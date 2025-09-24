# 🚀 Jetpunk Together

This project allows anyone to host their own server, enabling them to solve quizzes together with friends on the Jetpunk.com website.

## 📋 Table of Contents

- [Requirements](#📋-requirements)
- [Installation](#🛠️-installation)
- [Usage](#🚀-usage)
- [Tampermonkey Script Installation](#tampermonkey-script-installation)

## 📋 Requirements

Before you begin, make sure the following are in place:

- Browser extension "Tampermonkey" for Firefox or Chrome
  - For Firefox: [Install here](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)
  - For Chrome: [Install here](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
- Installed Node.js (version 16 or higher) and NPM on your machine

## 🛠️ Installation

Follow these steps to set up the project:

1. Clone the repository: 
```bash
git clone https://github.com/jonas1812st/Jetpunk-together.git
```
2. Navigate to the project directory: 
```bash
cd Jetpunk-together
```
3. Install required node_modules: 
```bash
npm install
```

## 🔧 Development

This project is now built with TypeScript for better type safety and development experience.

### Development Scripts

- **Development mode with hot-reload**: `npm run dev:watch`
- **Development mode (single run)**: `npm run dev` 
- **Build TypeScript to JavaScript**: `npm run build`
- **Production start**: `npm start` (builds and runs)
- **Reset database**: `npm run reset-db`

### File Structure

```
src/
├── server.ts          # Main server file (TypeScript)
├── services/
│   ├── db.ts         # Database connection and queries
│   ├── users.ts      # User management functions
│   ├── rooms.ts      # Room management functions
│   ├── schemas.ts    # Joi validation schemas
│   ├── check.ts      # Utility checking functions
│   └── seed.ts       # Database seeding script
dist/                 # Compiled JavaScript output (auto-generated)
assets/               # Static files (tampermonkey script, etc.)
```

## 🚀 Usage

### Customize Server Options:

1. In the `.env` file, you can adjust the `PORT` and `HOST_SERVER` options.
2. `PORT` sets the server port.
3. `HOST_SERVER` defaults to `http://localhost:3000`.

### Tampermonkey Script Installation:

1. Start the server: 
```bash
npm run start
```
2. Go to `https://YOUR_DOMAIN/jetpunk_together.user.js`
3. Tampermonkey should automatically suggest installing the script.
4. Click "Install".

### 🎮 After Successfully Installing the Script:

1. Go to Jetpunk.com
2. A blue box will appear at the top. This is where all the multiplayer action happens.

