#!/usr/bin/env bash
# Run this yourself in the project folder. It copies values from your local .env (parsed by node, like the scripts) into GitHub Actions secrets
# without printing them. Needs `gh` logged in with repo access.
set -euo pipefail
REPO="${1:?usage: push-secrets.sh owner/repo}"
SECRETS=(R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET PUBLIC_VIDEO_BASE_URL INSTAGRAM_ACCESS_TOKEN INSTAGRAM_USER_ID ELEVENLABS_API_KEY TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID)
envval() { node -e 'process.loadEnvFile(".env"); process.stdout.write((process.env[process.argv[1]] ?? "").trim())' "$1"; }
for name in "${SECRETS[@]}"; do
  value="$(envval "$name")"
  if [ -z "$value" ]; then echo "skip $name (empty in .env)"; continue; fi
  printf '%s' "$value" | gh secret set "$name" --repo "$REPO" >/dev/null && echo "set $name"
done
for v in CHANNEL_NAME CHANNEL_HANDLE; do value="$(envval "$v")"; [ -n "$value" ] && gh variable set "$v" --repo "$REPO" --body "$value" >/dev/null && echo "set variable $v"; done
GRAPH_API_VERSION="$(envval GRAPH_API_VERSION)"
gh variable set TTS_PROVIDER --repo "$REPO" --body "elevenlabs"
gh variable set GRAPH_API_VERSION --repo "$REPO" --body "${GRAPH_API_VERSION:-v27.0}"
gh variable set AUDIENCE_TZ --repo "$REPO" --body "Europe/Moscow"
echo done
