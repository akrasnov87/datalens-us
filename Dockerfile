ARG UBUNTU_VERSION=24.04

# use native build platform for build js files only once
FROM --platform=${BUILDPLATFORM} ubuntu:${UBUNTU_VERSION} AS native-build-stage

ARG NODE_MAJOR=22

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg

# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nodejs g++ make

RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

WORKDIR /opt/app

COPY package.json package-lock.json .npmrc /opt/app/
RUN npm ci

COPY ./dist /opt/app/dist
COPY ./src /opt/app/src
COPY ./typings /opt/app/typings
COPY tsconfig.json /opt/app/

RUN npm run build && chown app /opt/app/dist/run

# runtime base image for both platform
FROM ubuntu:${UBUNTU_VERSION} AS base-stage

ARG NODE_MAJOR=22

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get -y upgrade && apt-get -y install ca-certificates curl gnupg

# node
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get -y install nodejs

# install postgresql-client
RUN apt-get -y install postgresql-client

# remove unnecessary packages
RUN apt-get -y purge curl gnupg gnupg2 && \
    apt-get -y autoremove && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /etc/apt/sources.list.d/nodesource.list && \
    rm -rf /etc/apt/keyrings/nodesource.gpg


# timezone setting
ENV TZ="Etc/UTC"
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

# user app
RUN useradd -m -u 1001 app && mkdir /opt/app && chown app:app /opt/app

# add postgresql repository
RUN install -d /usr/share/postgresql-common/pgdg && \
    curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc && \
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main" | tee /etc/apt/sources.list.d/pgdg.list

# install system dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install tzdata && \
    apt-get -y install nginx supervisor nodejs postgresql-client-13 build-essential

# cleanup tmp and defaults
RUN rm -rf /etc/nginx/sites-enabled/default /var/lib/apt/lists/*

ARG app_version
ARG CERT
ARG USER=app

ENV APP_VERSION=$app_version
ENV TMPDIR=/tmp

WORKDIR /opt/app

COPY package.json package-lock.json /opt/app/
COPY ./scripts/preflight.sh /opt/app/scripts/preflight.sh

COPY deploy/nginx /etc/nginx
COPY deploy/supervisor /etc/supervisor/conf.d
COPY package.json package-lock.json /opt/app/
COPY . .

# prepare rootless permissions for supervisor and nginx
RUN chown -R ${USER} /var/log/supervisor/ && \
    mkdir /var/run/supervisor && \
    chown -R ${USER} /var/run/supervisor && \
    mkdir -p /var/cache/nginx && chown -R ${USER} /var/cache/nginx && \
    mkdir -p /var/log/nginx  && chown -R ${USER} /var/log/nginx && \
    mkdir -p /var/lib/nginx  && chown -R ${USER} /var/lib/nginx && \
    touch /run/nginx.pid && chown -R ${USER} /run/nginx.pid 

# build app
RUN npm ci -q --no-progress --include=dev --also=dev
RUN npm run build
RUN npm prune --production
RUN rm -rf /tmp/*

RUN chown -R ${USER} /opt/app/dist/run

# adding certificate
RUN echo $CERT > /usr/local/share/ca-certificates/cert.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/cert.pem
RUN update-ca-certificates

USER app

ENV NODE_ENV=production
ENV APP_PORT=8080

EXPOSE 8080

ENTRYPOINT ["/opt/app/scripts/preflight.sh"]
