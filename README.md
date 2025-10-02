# 🚀 Jetpunk Together

This project allows anyone to host their own server, enabling them to solve quizzes together with friends on the Jetpunk.com website.

## 📋 Table of Contents

- [Requirements](#📋-requirements)
- [Installation](#🛠️-installation)
- [Usage](#🚀-usage)
- [Tampermonkey Script Installation](#tampermonkey-script-installation)
- [Docker Deployment](#🐳-docker-deployment)

## 📋 Requirements

Before you begin, make sure the following are in place:

- Browser extension "Tampermonkey" for Firefox or Chrome
  - For Firefox: [Install here](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search)
  - For Chrome: [Install here](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
- Installed Node.js and NPM on your machine

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

## 🐳 Docker Deployment

You can deploy this project using Docker for easy setup and deployment.

### Building the Docker Image:

#### Method 1: Using the build script (Recommended)
```bash
./build-docker.sh
```

#### Method 2: Manual build
```bash
DOCKER_BUILDKIT=0 docker build -t jetpunk-together .
```

**Note:** We use `DOCKER_BUILDKIT=0` to avoid a known issue with BuildKit and npm install timing out during build.

### Running with Docker:

#### Method 1: Using docker run
```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -e HOST_SERVER="http://your-domain.com:3000" \
  -v $(pwd)/database:/app/database \
  --name jetpunk-together \
  jetpunk-together
```

#### Method 2: Using docker-compose (Recommended)

1. Create or modify `.env` file with your settings:
```bash
PORT=3000
HOST_SERVER="http://your-domain.com:3000"
```

2. Start the container:
```bash
docker-compose up -d
```

3. Stop the container:
```bash
docker-compose down
```

### Docker Environment Variables:

- `PORT`: The port the server runs on (default: 3000)
- `HOST_SERVER`: The public URL where your server is accessible (e.g., `http://your-domain.com:3000`)

### Accessing the Tampermonkey Script:

After starting the Docker container, go to:
```
http://your-domain.com:3000/jetpunk_together.user.js
```

Tampermonkey will prompt you to install the script.

