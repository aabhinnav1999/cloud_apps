FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the app
COPY . .

# Ensure the data directory exists inside the container
RUN mkdir -p /app/data

# App listens on 3000 by default
EXPOSE 3000

# Run the server
CMD ["node", "server.js"]
