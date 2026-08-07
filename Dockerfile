FROM node:24-bookworm-slim

# enable corepack and lock pnpm version for team consistency
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

WORKDIR /app

CMD ["bash"]