# Use Node.js image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install


# Copy the rest of the project files
COPY . .

# Expose the port React runs on (default: 3000)
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]
