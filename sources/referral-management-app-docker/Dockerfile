# Build the static web interface.
FROM nginx:alpine AS web
COPY index.html app.js styles.css API-INTEGRATION.md SYSTEM-PROPOSAL.md /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Build the website integration API.
FROM node:22-alpine AS api
WORKDIR /app
COPY package.json server.js API-INTEGRATION.md ./
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    BRANCH_LEDGER_PRIVATE_DIR=/data/private
VOLUME ["/data"]
EXPOSE 8787
CMD ["node", "server.js"]
