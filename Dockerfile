FROM node:24-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl
# enable corepack and lock pnpm version for team consistency
RUN corepack enable && corepack prepare pnpm@11.26.0 --activate

WORKDIR /app

CMD ["bash"]
