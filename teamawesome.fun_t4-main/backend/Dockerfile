# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY . .

# Expose backend port 
EXPOSE 3000

# Start server
CMD ["npm", "start"]
