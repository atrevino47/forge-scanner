FROM mcr.microsoft.com/playwright:v1.52.0-noble

# Expose CDP port
EXPOSE 9222

# Run Chromium with remote debugging enabled
# --no-sandbox is required in Docker
# --disable-gpu for headless server environments
# Binary path from: find /ms-playwright -name 'chrome' -type f
# If Playwright image version changes, re-run that find command.
CMD ["/ms-playwright/chromium-1169/chrome-linux/chrome", \
     "--headless=new", \
     "--no-sandbox", \
     "--disable-gpu", \
     "--disable-dev-shm-usage", \
     "--disable-features=LazyImageLoading,LazyFrameLoading", \
     "--remote-debugging-port=9222", \
     "--remote-debugging-address=0.0.0.0"]
