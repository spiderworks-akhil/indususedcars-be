# Use official Node.js image as a base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY backend/package*.json ./

# Install dependencies
RUN npm install 
 
# Copy the rest of the Strapi application files
COPY backend/ .

# Build the Strapi admin panel
RUN npm run build

# Expose the application port
EXPOSE 1337

# Command to run the Strapi application
CMD ["npm", "start"]
