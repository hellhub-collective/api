# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# Set environment variables
ENV RATE_LIMIT="200"
ENV DATABASE_URL="file:./database/data.db"
ENV HISTORY_API_URL="https://helldivers-b.omnedia.com/api"
ENV API_URL="https://api.live.prod.thehelldiversgame.com/api"
ENV STRATAGEM_IMAGE_URL="https://vxspqnuarwhjjbxzgauv.supabase.co/storage/v1/object/public/stratagems"

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/

# install production dependencies
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app .

# set the environment to production
ENV NODE_ENV=production

# delete all migrations
RUN bun run clean

# create the database
RUN bunx prisma migrate deploy
RUN bunx prisma db push

# create primsa client
RUN bunx prisma generate

# fetch the initial data
RUN bun run generate

# test the app
RUN bun test

# build the app
RUN bun run output

# create a non-root use
RUN chmod a+rw prisma/database prisma/database/*

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "build/index.js"]