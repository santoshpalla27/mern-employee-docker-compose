FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache optimization
RUN npm install

# Copy source code
COPY . .


ENV VITE_API_URL = ""

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx_group && \
    adduser -S nginx_user -u 1001 -G nginx_group

# Change ownership of nginx files
RUN chown -R nginx_user:nginx_group /usr/share/nginx/html && \
    chown -R nginx_user:nginx_group /var/cache/nginx && \
    chown -R nginx_user:nginx_group /var/log/nginx && \
    chown -R nginx_user:nginx_group /etc/nginx/conf.d

# Create nginx PID directory
RUN mkdir -p /var/run/nginx && \
    chown -R nginx_user:nginx_group /var/run/nginx

# Switch to non-root user
USER nginx_user

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]




# addgroup -g 1001 -S nodejs
# addgroup: Creates a new group.

# -g 1001: Specifies the GID (Group ID) as 1001.

# -S: Creates a system group (not meant for login users).

# nodejs: The name of the group being created.

# 📌 Result: Creates a system group named nodejs with GID 1001.

# ✅ adduser -S nextjs -u 1001
# adduser: Creates a new user.

# -S: Creates a system user (used by daemons or services, not for human login).

# nextjs: The name of the user.

# -u 1001: Specifies the UID (User ID) as 1001.

# 📌 Result: Creates a system user named nextjs with UID 1001.