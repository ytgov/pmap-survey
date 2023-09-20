FROM oraclelinux:7-slim

RUN yum upgrade -y && yum install yum-utils
RUN  yum -y install oracle-release-el7 && \
     yum-config-manager --enable ol7_oracle_instantclient && \
     yum -y install oracle-instantclient19.3-basiclite && \
     rm -rf /var/cache/yum

RUN yum-config-manager --enable *addons
RUN yum install -y gcc-c++ make libaio

RUN curl -sL https://rpm.nodesource.com/setup_13.x | bash -
RUN yum install -y nodejs

RUN mkdir /home/node 
RUN mkdir /home/node/web 
WORKDIR /home/node/web
COPY src/web/package*.json ./
RUN npm install && npm cache clean --force --loglevel=error
COPY src/web ./

RUN mkdir /home/node/app 
RUN mkdir /home/node/app/db
WORKDIR /home/node/app
COPY src/api/package*.json ./
COPY src/api/.env* ./

ENV NODE_ENV=test
RUN npm install && npm cache clean --force --loglevel=error
COPY src/api ./

RUN npm run build
EXPOSE 3000

WORKDIR /home/node/web
ENV NODE_ENV=production
RUN npm run build:docker

WORKDIR /home/node/app

COPY --chown=node:node src/api/src/templates/* /home/node/app/dist/templates/

CMD ["node", "./dist/index.js"]
