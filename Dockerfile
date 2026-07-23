FROM node:18-alpine

WORKDIR /app

# Copy the backend package.json and install dependencies
COPY Backend/package*.json ./
RUN npm install

# Copy the rest of the backend source code
COPY Backend/ ./

EXPOSE 3000

CMD ["npm", "start"]
