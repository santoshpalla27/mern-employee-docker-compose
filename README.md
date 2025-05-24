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





How to fix it?
Set VITE_API_URL to the root domain only:


VITE_API_URL=https://santosh.website
Then your frontend app calling


`${import.meta.env.VITE_API_URL}/record/${params.id}`
will produce:


https://santosh.website/record/{id}
which matches your Ingress path /record correctly.




========================


final conclution :- if the base url is http://ip:port/api then the ingress will be 

          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050

  then final url will be http://domain/api and /api is where the backend is and nginx proxy will be 


location /api/ {
    proxy_pass http://44.201.204.19:5050;
}

========

and if the app has hardcoded api path then the api url will be http://domain:port and rest will be in app like http://base-url/api 

then the ingress will be 

paths:
- path: /api(/|$)(.*)
  pathType: ImplementationSpecific
  backend:
    service:
      name: backend
      port:
        number: 5050

the base url will be http://domain/api which will direct to http://domain/

and the nginx conf will be 

location /api/ {
    proxy_pass http://44.201.204.19:5050/;  # with / which will direct the requests without /api
 }


Final public base URL (what the frontend uses) is: http://domain/api

What happens under the hood:
User hits: http://domain/api/record

NGINX ingress strips /api prefix before forwarding to backend

Backend receives request as /record (no /api prefix)

Backend routes like /record, /record/123 work normally (no /api in paths)

===============

third case 

- path: /record
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 5050

and the app uses /record in the code hardcoded then the base url will be just domain http://domain.com since the app uses http://domain.com/record which is hard codded in backend then request goes to the /record that is backend


nginx config in kubernetes

location /api/ {
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/
}

location /api/ {
    proxy_pass http://backend-service:5050; # for http://backend-service:5050/api call
}

backend-service is used internally by NGINX to reach your backend so the nginx config can still communicate with the backend even if fontend is static in browser



frontend is Static — Doesn't Matter
Even if your frontend is:

Hosted on S3

Served from NGINX itself

Static React/Angular build

→ it doesn't matter, because the browser only talks to http://domain.com/api/..., and NGINX internally talks to http://backend-service:5050.

The static frontend doesn't need access to backend-service — NGINX handles the internal routing for API calls.



example in terms of code 

this is a frontend end code which expects base url to be http://ip:5000 or http://domain/api so the ingress will be 

paths:
- path: /api(/|$)(.*)
  pathType: ImplementationSpecific
  backend:
    service:
      name: backend
      port:
        number: 5050

which will direct the http://domain/api calls to http://domain and backend will http://domain/api/mysql/users

nginx config will be 

location /api/ {
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/
}


location /api/ # this should match with the starting call of api in the frontend   {
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/
}

backend code
 app.get('/api/mysql/users', async (req, res) => {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM users');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching users from MySQL:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });



frontend code

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; # backend url 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchMySQLUsers = () => {
  return api.get('/api/mysql/users');
};


because the backend code already has /api in its route so we cut in processing and if it does have /api in its backend and has in frontend then the url will be same without rewriting in nginx config and ingress

location /api/ # this should match with the starting call of api in the frontend   { 
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/


and the the / after the proxy depends the backend that has /api in the start or not  
}

in most cases they use /api but there can be cases where the /api will be different then the ingress and the nginx config will be same as what /api is changed with



location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass http://backend-service:5050/;
}


=================================================

            final verdict

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; # backend url 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchMySQLUsers = () => {
  return api.get('/api/mysql/users');
};

the frontend api call will be the location of nginx config and if the starting exist in the backend no / or rewrite is requied but if doesn't exist rewite or / needed in nginx config and ingress 

location /api/ {
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/
}

backend code
 app.get('/api/mysql/users', async (req, res) => {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM users');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching users from MySQL:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

here in the backend exist so the api url will be http://backend-service:5050/api

location /api/ {
    proxy_pass http://backend-service:5050; # call on http://backend-service:5050/api
}


paths:
- path: /api
  pathType: ImplementationSpecific
  backend:
    service:
      name: backend
      port:
        number: 5050





const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; # backend url 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchMySQLUsers = () => {
  return api.get('/api/mysql/users');
};

and if exist in frontend and no exist in the backend then we use / to rewrite the url like 

location /api/ {
    proxy_pass http://backend-service:5050/; # for rewrite and call on http://backend-service:5050/
}

backend code
 app.get('/mysql/users', async (req, res) => {
    try {
      const [rows] = await mysqlPool.query('SELECT * FROM users');
      res.json(rows);
    } catch (err) {
      console.error('Error fetching users from MySQL:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

the backend will go on http://backend-service:5050/api from frontend and then it will go as http://backend-service:5050/mysql to the backend without the api in the call and the ingress will be 

paths:
- path: /api(/|$)(.*)
  pathType: ImplementationSpecific
  backend:
    service:
      name: backend
      port:
        number: 5050

the frontend url for backend will be http://backend-service:5050/api but the calls will go the backend without api in it http://backend-service:5050/