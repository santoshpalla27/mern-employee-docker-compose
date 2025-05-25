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


=================

second case of api call frontend has api and backed doesn't so need rewrite in backend


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

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mysql-api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
  - host: mysql.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-service
            port:
              number: 5050


the backend url for frontend will be http://backend-service:5050/api but the calls will go the backend without api in it http://backend-service:5050/

if api is hardcoded in frontend then the url will be http://domain instead of http://domain/api

===============================
in most cases they use /api but there can be cases where the /api will be different then the ingress and the nginx config will be same as what /api is changed with




            last scenario if there is no prefix in either frontend and backend 
backend code 

app.use(express.json());
app.use("/record", records);

// Health check endpoint (liveness probe)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});



fontend code

if (isNew) {
        // if we are adding a new record we will POST to /record.
        response = await fetch(`${import.meta.env.VITE_API_URL}/record` ,{                      # this expects http://domain or http://ip:port 
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(person),
        });


this expects http://domain or http://ip:port 


then we will use 

location /record {                                          # after / need to add the api using in the frontend 
        proxy_pass http://localhost:5050;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: records-api-ingress
spec:
  rules:
  - host: records.example.com
    http:
      paths:
      - path: /record
        pathType: Prefix
        backend:
          service:
            name: records-api-service
            port:
              number: 80


separate domain with prefix for backend 

this routes traffic to https://records.example.com/record

==============================================================================


Scenario 4: Frontend has no /api, but backend has /api

location /record {
    rewrite ^/(.*)$ /api/$1 break;
    proxy_pass http://backend-service:5050;
}


Frontend calls /record

NGINX rewrites it to /api/record before proxying

Backend receives /api/record



Ingress: Add prefix using nginx.ingress.kubernetes.io/rewrite-target

⚠️ Don't Use Both Together
If you're running an Ingress and also running NGINX behind it with rewrite logic, you may accidentally double-rewrite:

Ingress rewrites /record → /api/record

Then backend NGINX rewrites /api/record → /api/api/record (bad)

✅ Use one or the other, based on where the rewrite needs to happen.


apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /api/record$2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
  - host: records.example.com
    http:
      paths:
      - path: /record(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-service
            port:
              number: 80



Expected Behavior:

Requests to /record or /record/anything are rewritten to /api/anything and forwarded to backend-service.

Requests to /api or /api/anything are forwarded directly to backend-service without modification.



Incoming request: /record

Ingress rewrites to: /api/record

Backend receives /api/record



Frontend:

await fetch(`${import.meta.env.VITE_API_URL}/record`, {
  method: "POST",
  ...
});

Backend:

app.post('/api/record', handler);





==========

 BUT — if you're using a reverse proxy (like Nginx, Ingress, API Gateway, etc.), then:
You can change the path between frontend and backend as long as the proxy rewrites it accordingly.

🔧 Example:
Frontend calls:
/api/users

Backend defines route:
/users ← no /api

Nginx handles it like this:

location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    proxy_pass http://backend-service:5050/;
}


summary of Your Scenarios:

Frontend /api + Backend /api → Direct proxy (no rewrite)
Frontend /api + Backend no prefix → Proxy with rewrite
Frontend no prefix + Backend no prefix → Direct proxy to root
===================================================


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


====================================================
                        some therioes


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



============================================================================

                          this app 

location /record {
            proxy_pass http://3.94.123.243:5050;

this will pass traffic to backend on /record 

and backend will recive traffic on http://3.94.123.243:5050 and /record is hard coded



to run this docker-compose edit the ip of machine in both nginx.conf file and docker-compose file vite url 

and clone the repo and go to the root folder and run docker-compose up -d and docker ps -a to view the container 

fontend will be available on port 80 

backend will be aviable on port 5050 