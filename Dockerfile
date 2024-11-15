# Use Node.js official image as a base
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Step 5: Install TypeScript (dev dependency)
RUN npm install -D typescript

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
