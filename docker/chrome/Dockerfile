FROM mcr.microsoft.com/playwright:v1.58.0-noble

# socat bridges Chrome's 127.0.0.1-only CDP to 0.0.0.0 for Docker port mapping
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

EXPOSE 9222

# Chrome binary path from: find /ms-playwright -name 'chrome' -type f
# If Playwright image version changes, re-run that find command.
# v1.58.0 ships chromium-1140 — verify after build with:
#   docker exec <container> find /ms-playwright -name 'chrome' -type f
#
# Chrome binds to 127.0.0.1:9223 — socat exposes it on 0.0.0.0:9222.
# Flags:
#   --disable-features=LazyImageLoading,LazyFrameLoading  prevents native lazy loading
#   --disable-background-timer-throttling     keeps timers at full speed in background tabs
#   --disable-backgrounding-occluded-windows  prevents throttling of hidden windows
#   --disable-renderer-backgrounding          keeps renderer active when not focused
CMD find /ms-playwright -name 'chrome' -type f -path '*/chrome-linux/chrome' | head -1 | xargs -I{} sh -c \
    '{} \
    --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --disable-features=LazyImageLoading,LazyFrameLoading \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --remote-debugging-port=9223 --remote-debugging-address=127.0.0.1 & \
    sleep 2 && \
    socat TCP-LISTEN:9222,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:9223'
