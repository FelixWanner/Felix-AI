# Life OS Frontend - Placeholder
# Replace with actual React app later

FROM nginx:alpine

# Copy placeholder HTML
COPY index.html /usr/share/nginx/html/index.html

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 3000

# Run nginx on port 3000
CMD ["sh", "-c", "sed -i 's/listen       80;/listen       3000;/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
