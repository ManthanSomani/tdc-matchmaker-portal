# Development guide

## Repository layout

```text
client/                 React 19 + TypeScript + Vite
server/index.js         Express composition and routes
server/auth.js          Credential verification, JWTs, RBAC
server/matching.js      Consent filters and explainable scoring
server/nlp.js           ML client, timeout, fallback
server/nlp_server.py    FastAPI sentence-transformer service
server/schemas.js       Zod request contracts
server/test/            Node test runner suites
docs/                   Architecture, API, deployment, security
```

## Environment

Copy both `.env.example` files. Never commit `.env` files or real keys. `VITE_API_URL` must end at the Express `/api` prefix. `NLP_SERVICE_URL` must be the FastAPI origin without `/api/batch-similarity`.

Generate a production bcrypt value from `server/`:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "replace-this-password"
```

## Adding a scoring dimension

Add the bounded input contract to `schemas.js`, implement a pure dimension function in `matching.js`, add an explanation label, and cover normalization, zero/missing input, and final-score behavior in `server/test`. Do not add protected traits or inferred preferences.

## Definition of done

- `npm test` passes in `server/`.
- `npm run typecheck` and `npm run build` pass in `client/`.
- `npm audit --omit=dev` reports no production vulnerability at the configured threshold.
- New API input is schema-validated and authorization is explicit.
- README/API/security docs reflect behavioral changes.
