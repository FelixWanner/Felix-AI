# n8n Workflow Initialization Container
# Imports workflows and sets up credentials on startup

FROM alpine:3.19

# Install required tools
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    ca-certificates

# Create app directory
WORKDIR /app

# Copy initialization scripts
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Workflows will be mounted at runtime
VOLUME ["/workflows"]

ENTRYPOINT ["/app/entrypoint.sh"]
