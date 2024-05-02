# use the official bun image
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# install nodejs and npm
RUN apt-get update
RUN echo "y" | apt-get install curl
# nvm env vars
RUN mkdir -p /usr/local/nvm
ENV NVM_DIR /usr/local/nvm
# set the exact version
ENV NODE_VERSION v20.11.1
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"
# add node and npm to the PATH
ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH

# set environment variables
ENV RATE_LIMIT="200"
ENV DATABASE_URL="file:../databases/data.db"
ENV HISTORY_API_URL="https://helldivers-b.omnedia.com/api"
ENV API_URL="https://api.live.prod.thehelldiversgame.com/api"
ENV STORAGE_URL="https://vxspqnuarwhjjbxzgauv.supabase.co/storage/v1/object/public"

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# reset old database and generate new one
RUN bun run db:reset
RUN bun run db:init

# synchronize the database schema & generate client
RUN bunx prisma migrate deploy
RUN bunx prisma db push

# generate source data for the api
RUN bun run generate

# test generated source data
RUN bun test

# build the app
RUN bun run app:reset
RUN bun run app:build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=prerelease /usr/src/app/build build
COPY --from=prerelease /usr/src/app/prisma prisma
COPY --from=prerelease /usr/src/app/databases databases
COPY --from=prerelease /usr/src/app/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json package.json

# src directory permissions
RUN chown -R bun:bun /usr/src/app

# set production environment
ENV NODE_ENV=production

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "--smol", "build/index.mjs"]
