# Use the official Node.js image as a base
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Generate the Prisma client
RUN npx prisma generate

# Expose the port your app runs on
EXPOSE 8080

# Command to run your app, including migration on start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
