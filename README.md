# A simple MERN stack application 

### Create a network for the docker containers

`docker network create demo`

### Build the client 

```sh
cd mern/frontend
docker build -t mern-frontend .
```

### Run the client

`docker run --name=frontend --network=demo -d -p 5173:5173 mern-frontend`

### Verify the client is running

Open your browser and type `http://localhost:5173`

### Run the mongodb container

`docker run --network=demo --name mongodb -d -p 27017:27017 -v ~/opt/data:/data/db mongodb:latest`

### Build the server

```sh
cd mern/backend
docker build -t mern-backend .
```

### Run the server

`docker run --name=backend --network=demo -d -p 5050:5050 mern-backend`

## Using Docker Compose

`docker compose up -d`




FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with cache optimization
RUN npm install

# Copy source code
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build


the vite_api_url should be included in dockerfile because once we run npm build the javasciprt becomes static so the VITE_API_URL in env varible does work so the varible has to be set a docker build level not at runtime level


  frontend:
    build: 
      context: ./mern/frontend
      args:
        VITE_API_URL: http://44.201.204.19:5050



docker build \
  --build-arg VITE_API_URL=http://44.201.204.19:5050 \
  -t my-frontend-app .


location /api/ {
            proxy_pass http://44.201.204.19:5050/;                  using of / removes prefix mean the api call goes without using /api instead of http://domain.com/api/record  api call goes http://domain.com/record
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }



    # With trailing slash - REMOVES /api prefix
location /api/ {
    proxy_pass http://44.201.204.19:5050/;
    # /api/record → http://44.201.204.19:5050/record
}

# Without trailing slash - KEEPS /api prefix  
location /api/ {
    proxy_pass http://44.201.204.19:5050;
    # /api/record → http://44.201.204.19:5050/api/record
}


with api the base url will be http://44.201.204.19:5050/api 

with api prefix the base url will be http://44.201.204.19:5050

the ingress will be 

          - path: /record
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050

then the backend base url will be http://domain/record


with api prefix the base url 

          - path: /api/record
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050

then the backend base url will be http://domain/api/record



imagine a secnario 

my app expects the base url to be http://domain:port with the below ingress i made the base url as http://santosh.website/record/ 

so the nginx proxy will be 

    # With trailing slash - REMOVES /api prefix
location /api/ {
    proxy_pass http://44.201.204.19:5050/;
    # /api/record → http://44.201.204.19:5050/record
}


---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: three-tier-app
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing 
    alb.ingress.kubernetes.io/target-type: ip 
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]' # Added HTTPS
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:537124971455:certificate/1b7675d8-3da9-4022-b498-9ca7e31e27e1 # Added ACM certificate
    alb.ingress.kubernetes.io/ssl-redirect: "443" # Redirect HTTP to HTTPS
spec:
  ingressClassName: alb
  rules:
    - host: santosh.website
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 5173
          - path: /record
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050



what will be the ingress and nginx proxy if my app base url is http://domain:port/api

 1. NGINX Proxy
You should preserve the /api prefix and not strip it in the proxy_pass directive.

# PRESERVES /api prefix
location /api/ {
    proxy_pass http://44.201.204.19:5050/api/;
    # /api/record → http://44.201.204.19:5050/api/record
}


apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: three-tier-app
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing 
    alb.ingress.kubernetes.io/target-type: ip 
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:537124971455:certificate/1b7675d8-3da9-4022-b498-9ca7e31e27e1
    alb.ingress.kubernetes.io/ssl-redirect: "443"
spec:
  ingressClassName: alb
  rules:
    - host: santosh.website
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 5173
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050


VITE_API_BASE_URL=https://santosh.website/api





paths:
- path: /api(/|$)(.*)
  pathType: ImplementationSpecific
  backend:
    service:
      name: backend
      port:
        number: 5050


| Incoming Request Path | Matched? | Captured in `(.*)` |
| --------------------- | -------- | ------------------ |
| `/api`                | ✅        | `""`               |
| `/api/`               | ✅        | `""`               |
| `/api/record`         | ✅        | `record`           |
| `/api/record/data`    | ✅        | `record/data`      |
| `/apisomething`       | ❌        | —                  |


use with 

annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /$2



Resulting Behavior

| Public Request URL             | Matched? | Rewritten path sent to backend |
| ------------------------------ | -------- | ------------------------------ |
| `https://domain/api`           | ✅        | `/`                            |
| `https://domain/api/`          | ✅        | `/`                            |
| `https://domain/api/record`    | ✅        | `/record`                      |
| `https://domain/api/user/data` | ✅        | `/user/data`                   |
| `https://domain/apisomething`  | ❌        | (not matched)                  |
