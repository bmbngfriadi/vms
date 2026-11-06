FROM nginx:alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD curl -f http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]

