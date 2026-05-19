FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

# FIX: Copy all your local code into the container
COPY . .

# Expose the port your app uses (usually 3000 for Node/Next.js)
EXPOSE 3000

# Start your app in development mode
CMD ["npm", "run", "dev"]
