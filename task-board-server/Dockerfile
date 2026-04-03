FROM node:20-alpine AS build

WORKDIR /app

# Copy shared library
COPY shared /app/shared

# Copy server files
COPY task-board-server /app/task-board-server

# Build with webpack (enabled in nest-cli.json) 
# to bundle shared library code into single main.js
WORKDIR /app/task-board-server
RUN npm install
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app/task-board-server

# Only copy everything from build stage to start fresh
COPY --from=build /app/task-board-server/package*.json ./
# Install production deps
RUN npm install --production

# Copy the bundled dist (which contains ONE set of JS files now thanks to webpack)
COPY --from=build /app/task-board-server/dist ./dist

EXPOSE 3000

# With webpack, the entrypoint is reliably at dist/main.js
CMD ["node", "dist/main"]