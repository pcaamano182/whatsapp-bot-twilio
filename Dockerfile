# Use Node.js 20 LTS
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create credentials directory
RUN mkdir -p credentials

# Expose port (Cloud Run will set PORT env var)
EXPOSE 8080

# Start the application
CMD [ "node", "src/index.js" ]
