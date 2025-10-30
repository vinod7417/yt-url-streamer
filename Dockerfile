# Use an official Node image and install ffmpeg
FROM node:20-bullseye

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && apt-get clean && rm -rf /var/lib/apt/lists/*

# App dir
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy app code
COPY . .

# Expose a port for health check (not used for streaming)
EXPOSE 8080

# Start the node app
CMD ["node", "index.js"]
