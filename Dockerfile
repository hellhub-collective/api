# use the official bun image
FROM oven/bun:latest as base
WORKDIR /usr/src/app

# set environment variables
ENV RATE_LIMIT="200"
ENV DATABASE_URL="file:./database/data.db"
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

# synchronize the database schema & generate client
RUN bunx prisma migrate deploy
RUN bunx prisma db push --skip-generate
RUN bunx prisma generate

# generate source data for the api
RUN bun run generate

# test generated source data
RUN bun test

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=prerelease /usr/src/app/prisma /usr/src/app/prisma
COPY ./node_modules /usr/src/app/node_modules
COPY ./package.json /usr/src/app/package.json
COPY ./tsconfig.json /usr/src/app/tsconfig.json
COPY ./src /usr/src/app/src

# src directory permissions
RUN chown -R bun:bun /usr/src/app

# set production environment
ENV NODE_ENV=production

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "--smol", "run", "src/index.ts"]
