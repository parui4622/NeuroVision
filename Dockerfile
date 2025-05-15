# Root Dockerfile (optional, for monorepo pattern)
# You can use this if you want to build everything from the root, but usually docker-compose is preferred.
FROM node:18
WORKDIR /app
COPY . .
CMD ["echo", "Use docker-compose.yml to run the project"]
