# Security

## Secrets and environment files

- Do not commit `.env` or any file containing API keys.
- Use `.env.example` as the only env template in git.
- Configure real values via the Vibecode App **ENV** tab or a local `.env` (gitignored).

## Client-exposed configuration

Expo inlines `EXPO_PUBLIC_*` variables into the JavaScript bundle. Treat them as **public**.

| Variable | Notes |
| --- | --- |
| `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` | Avoid in production; use `EXPO_PUBLIC_VIBECODE_AI_PROXY_URL` + `server/ai-proxy` instead. |
| `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` | Server-side or proxy only when possible. |
| `EXPO_PUBLIC_VIBECODE_GROK_API_KEY` | Server-side or proxy only when possible. |
| `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY` | Restrict by HTTP referrer / app ID in Google Cloud Console. |
| `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY` | Server-side or proxy only when possible. |
| RevenueCat `EXPO_PUBLIC_VIBECODE_REVENUECAT_*` | Public SDK keys by design; still rotate if leaked. |

## Incident response

If secrets were committed to a public repo:

1. Remove them from the latest commit (this project untracks `.env` without rewriting history).
2. **Rotate every exposed key** at the provider dashboard.
3. Consider GitHub secret scanning alerts and provider usage logs for abuse.
