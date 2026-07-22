# API reference

Base URL locally: `http://localhost:5000`. JSON endpoints below `/api` are rate-limited to 120 requests per minute per client.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Liveness and demo-data disclosure |
| POST | `/api/auth/login` | No | Exchange configured credentials for a two-hour JWT |
| GET | `/api/customers?page=1&limit=12&search=` | Matchmaker | Paginated synthetic directory |
| POST | `/api/customers/:id/matches` | Matchmaker | Validate preferences and return five explained matches |
| POST | `/api/generate-intro` | Matchmaker | Draft an opt-in introduction |

Protected calls use `Authorization: Bearer <token>`.

Match request example:

```json
{
  "preferredGenders": ["Female"],
  "weights": { "career": 0.35, "lifestyle": 0.3, "location": 0.2, "language": 0.15 }
}
```

Errors use HTTP status codes and `{ "error": "..." }`. Validation errors also contain `details`. The match response metadata identifies `sentence-transformer` or `rules-fallback`; a fallback caused by an upstream failure includes a warning.

The ML service exposes `GET /health` and `POST /api/batch-similarity`. It accepts one non-empty `user_text` and 1–100 `match_texts`, each bounded by Pydantic validation.
