# Security, privacy, and limitations

## Implemented controls

- Signed, issuer-checked, two-hour JWTs and a matchmaker role guard
- bcrypt password-hash support; production configuration validation
- Zod/Pydantic request validation and a 100 KB Express body limit
- Helmet headers, explicit CORS allowlists, and API rate limiting
- Bounded, timed ML calls with non-sensitive error responses
- Server-side Groq calls so API keys never enter the browser bundle

## Demo-data policy

All names, contact details, and profiles are synthetic. Do not upload real personal data. Legacy sensitive attributes in `data.json` and `generate.js` are not used by the scorer and should be deleted during a database migration.

## Not production-ready

A real service additionally needs SSO/MFA, user provisioning and revocation, database encryption, secret rotation, audit trails, consent records, data retention/deletion workflows, monitoring, abuse controls, security review, and applicable privacy/legal assessment.

Report vulnerabilities privately to the repository owner; do not put credentials or personal data in a public issue.
