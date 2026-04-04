FROM mcr.microsoft.com/playwright:v1.52.0-noble

# socat bridges Chrome's 127.0.0.1-only CDP to 0.0.0.0 for Docker port mapping
RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

EXPOSE 9222

# Chrome binary path from: find /ms-playwright -name 'chrome' -type f
# If Playwright image version changes, re-run that find command.
#
# Chrome binds to 127.0.0.1:9223 — socat exposes it on 0.0.0.0:9222.
# --disable-features=LazyImageLoading,LazyFrameLoading prevents Chromium
# from honoring loading="lazy" — images load eagerly for screenshot capture.
CMD /ms-playwright/chromium-1169/chrome-linux/chrome \
    --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --disable-features=LazyImageLoading,LazyFrameLoading \
    --remote-debugging-port=9223 --remote-debugging-address=127.0.0.1 & \
    sleep 2 && \
    socat TCP-LISTEN:9222,fork,reuseaddr,bind=0.0.0.0 TCP:127.0.0.1:9223
