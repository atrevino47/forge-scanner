# Hetzner VPS Setup — Self-Hosted Chrome for Scanner

## Server: Hetzner CX22 (~$4/mo)
- 2 vCPU, 4 GB RAM, 40 GB SSD
- Location: Ashburn (us-east) or Nuremberg (eu-central)
- OS: Ubuntu 24.04

## Initial Setup

```bash
ssh root@YOUR_VPS_IP
apt update && apt install -y docker.io docker-compose-v2 curl
systemctl enable docker
```

## Deploy Chrome

```bash
mkdir -p /opt/forge-chrome
# Copy docker/chrome/ contents to /opt/forge-chrome/
cd /opt/forge-chrome
docker compose up -d
```

## Verify

```bash
curl http://localhost:9222/json/version
# Should return { "Browser": "...", "webSocketDebuggerUrl": "ws://..." }
```

## Firewall — CRITICAL

Chrome CDP must NOT be exposed to the internet. Three options:

### Option A: SSH tunnel from Vercel serverless (complex)
Not recommended for serverless environments.

### Option B: Restrict to Vercel IPs via ufw
```bash
ufw default deny incoming
ufw allow ssh
# Allow Vercel IP ranges (check Vercel docs for current list)
ufw allow from 76.76.21.0/24 to any port 9222
ufw enable
```

### Option C: Cloudflare Tunnel (recommended — zero-trust, no open ports)

```bash
# 1. Install cloudflared
curl -L https://pkg.cloudflare.com/cloudflared-linux-amd64.deb -o /tmp/cf.deb && dpkg -i /tmp/cf.deb

# 2. Authenticate
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create forge-chrome

# 4. Configure tunnel to point to local Chrome CDP
# Edit ~/.cloudflared/config.yml:
#   tunnel: <tunnel-id>
#   credentials-file: /root/.cloudflared/<tunnel-id>.json
#   ingress:
#     - hostname: chrome.forge-chrome.forgewith.ai
#       service: http://localhost:9222
#     - service: http_status:404

# 5. Route DNS
cloudflared tunnel route dns forge-chrome chrome.forge-chrome.forgewith.ai

# 6. Run as service
cloudflared service install
systemctl start cloudflared
```

## Environment Variable

Set in Vercel (Settings > Environment Variables):

```
# Direct connection (if using ufw):
BROWSER_WS_ENDPOINT=ws://YOUR_VPS_IP:9222

# With Cloudflare Tunnel (recommended):
BROWSER_WS_ENDPOINT=wss://chrome.forge-chrome.forgewith.ai
```

## Monitoring

The Docker healthcheck pings the CDP endpoint every 30s. Check container health:

```bash
docker compose ps   # Should show "healthy"
docker compose logs --tail 50  # Check for errors
```

## Restart / Update

```bash
cd /opt/forge-chrome
docker compose pull   # Pull latest image
docker compose up -d  # Restart with new image
```
