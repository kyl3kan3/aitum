# AI proxy (optional)

Deploy this lightweight proxy so **OpenAI API keys are not embedded** in the Expo client bundle. The mobile app calls `EXPO_PUBLIC_VIBECODE_AI_PROXY_URL` instead of `api.openai.com` directly.

## Environment (server only)

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI secret key (never use `EXPO_PUBLIC_` on the server) |
| `ALLOWED_ORIGINS` | Optional comma-separated origins for CORS (omit to allow all) |

## Run locally

```bash
cd server/ai-proxy
npm install
OPENAI_API_KEY=your_key node index.mjs
```

Default listen port: `8787`. Set `EXPO_PUBLIC_VIBECODE_AI_PROXY_URL=http://YOUR_MACHINE_IP:8787` in the app ENV tab.

## Deploy

Host `index.mjs` on any Node-compatible platform (Railway, Fly.io, Cloud Run, etc.) with `OPENAI_API_KEY` set as a secret.
