in this type of setup where we use nginx for api calls instead of env variable and nor the public ip is requied 

 frontend:
    build:
      context: ./mern/frontend
      args:
        VITE_API_URL: ""


we update the nginx config to proxy pass the api requests to /record 

        # Proxy API requests to your backend server
        location /record {
            proxy_pass http://backend:5050;


so because there is a empty string in env  it uses nginx for api calls 

so the url will be http://ip/record


