# Docker Configuration Documentation

## Overview

The NeuroVision application is containerized using Docker, enabling consistent deployment across different environments. The container architecture includes separate services for the frontend, backend, and database.

## Docker Components

### 1. Docker Compose Configuration

The `docker-compose.yml` file orchestrates all services, defining their relationships and configuration:

```yaml
services:
  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    networks:
      - neurovision_network

  backend:
    build: ./major-project-backend
    container_name: neurovision-backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/neurovision?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=${NODE_ENV}
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - neurovision_network

  frontend:
    build: ./major-project-frontend
    container_name: neurovision-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - neurovision_network

volumes:
  mongo_data:
    driver: local

networks:
  neurovision_network:
    driver: bridge
```

### 2. Backend Dockerfile

The backend Dockerfile sets up the Node.js environment and application:

```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install Python and other dependencies for node-gyp and potential Python scripts
RUN apk add --no-cache python3 make g++ gcc

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directory for Python models if it doesn't exist
RUN mkdir -p ./python/models

# Expose API port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
```

### 3. Frontend Dockerfile

The frontend Dockerfile builds and serves the React application:

```dockerfile
# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Environment Configuration

The Docker setup uses environment variables for configuration:

### Environment Variables
- `MONGO_USERNAME`: MongoDB username
- `MONGO_PASSWORD`: MongoDB password
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment setting (development, production)

These can be defined in a `.env` file at the project root:

```
MONGO_USERNAME=neurovision_admin
MONGO_PASSWORD=secure_password_here
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## Volumes and Persistence

- **MongoDB Data**: Persisted using a named volume `mongo_data`
- **User Uploads**: Stored within appropriate container paths

## Networking

All services are connected via the `neurovision_network` bridge network:
- Frontend can access backend on port 5000
- Backend can access MongoDB on port 27017

## Deployment Instructions

### Initial Setup

1. Ensure Docker and Docker Compose are installed
2. Create `.env` file with required variables
3. Build and start all services:
   ```
   docker-compose up -d --build
   ```

### Managing Services

- **Start all services**: `docker-compose up -d`
- **Stop all services**: `docker-compose down`
- **View logs**: `docker-compose logs -f [service_name]`
- **Restart a service**: `docker-compose restart [service_name]`

### Updating the Application

1. Pull the latest code changes
2. Rebuild the affected services:
   ```
   docker-compose up -d --build [service_name]
   ```

### Backup and Restore

#### Database Backup
```
docker exec mongo mongodump --uri="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:27017/neurovision?authSource=admin" --out=/data/backup/
```

#### Database Restore
```
docker exec mongo mongorestore --uri="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:27017/neurovision?authSource=admin" /data/backup/
```

## Production Considerations

1. **Security**:
   - Set strong passwords for MongoDB
   - Use a secure, randomly generated JWT secret
   - Configure proper firewall rules

2. **Scaling**:
   - Consider using Docker Swarm or Kubernetes for scaling
   - Implement load balancing for the frontend and backend

3. **Monitoring**:
   - Set up container monitoring (e.g., Prometheus/Grafana)
   - Implement log aggregation (e.g., ELK stack)

4. **Performance**:
   - Tune MongoDB for production workloads
   - Configure appropriate resource limits for containers
