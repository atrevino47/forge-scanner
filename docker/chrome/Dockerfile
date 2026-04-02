FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Expose CDP port
EXPOSE 9222

# Run Chromium with remote debugging enabled
# --no-sandbox is required in Docker
# --disable-gpu for headless server environments
CMD ["chromium", \
     "--headless=new", \
     "--no-sandbox", \
     "--disable-gpu", \
     "--disable-dev-shm-usage", \
     "--remote-debugging-port=9222", \
     "--remote-debugging-address=0.0.0.0"]
