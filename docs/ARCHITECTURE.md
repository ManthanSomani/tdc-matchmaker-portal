# Architecture and scoring

## Components

The browser owns presentation and short-lived session storage. The Express API is the trust boundary: it verifies signed JWTs, validates payloads, selects candidate profiles, combines scoring dimensions, and calls optional AI services. The FastAPI service only receives job titles and returns cosine-similarity percentages.

## Request flow

1. `POST /api/auth/login` verifies the configured operator credential and returns a two-hour JWT.
2. The directory requests a bounded page from `GET /api/customers`.
3. `POST /api/customers/:id/matches` validates consent preferences and removes the selected client from the pool.
4. The API asks the sentence-transformer service for career scores. A five-second timeout or malformed response activates a deterministic fallback and returns a warning in metadata.
5. The API calculates and explains every score, then returns the best five candidates.
6. `POST /api/generate-intro` uses Groq when configured or returns a deterministic template. The browser opens the reviewed draft in the user's email client.

## Compatibility model

Default weights are career 35%, lifestyle 30%, location 20%, and language 15%. Custom non-negative weights are normalized to 100%. Lifestyle answers reward exact agreement and partially reward `Maybe`; language overlap uses Jaccard similarity; location rewards a shared city. Every result includes human-readable reasons.

Sensitive fields remain in the legacy synthetic dataset only to demonstrate migration constraints. The scoring path deliberately does not read religion, caste, income, or date of birth. Those fields should be removed from a future data model.

## Design trade-offs

- JSON avoids infrastructure for a demo, but cannot support durable edits or concurrent operators.
- A rules fallback keeps the core flow available during ML cold starts, but offers coarser career comparisons.
- Session storage limits token persistence across browser restarts, but XSS prevention and secure server headers remain essential.
- External LLM drafting reduces implementation complexity, but adds latency, cost, and third-party data-processing considerations.
