FROM mcr.microsoft.com/devcontainers/javascript-node

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV TURBO_TELEMETRY_DISABLED=1
RUN npm install -g bun
RUN npm install -g pnpm
RUN npm install -g turbo
RUN npm install -g reactlith
