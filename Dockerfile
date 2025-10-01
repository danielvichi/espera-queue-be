FROM node:23.11.1

# Create app directory
WORKDIR /usr/src/app

# starting with installing dependencies for better Docker caching
# (and using npm ci for production)
COPY package*.json ./

# Audit the dependencies, fail if there are vulnerabilities of `critical` level
# Note the --production tag allows us to ignore devDependencies
RUN npm audit --production --audit-level critical

RUN npm ci 

# Bundle app source
COPY . .

# Copying the cloud sql proxy script
RUN ECHO "Downloading cloud sql proxy..."
COPY --from=gcr.io/cloudsql-docker/gce-proxy /cloud_sql_proxy /cloudsql/cloud_sql_proxy

# Build
RUN npm run build

# TODO remove from base image
ENV PATH="/root/.local/bin:$PATH"

# Expose ports (for Nest server)
EXPOSE 3000
ENTRYPOINT ["npm"]
