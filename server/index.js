require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { OpenAI } = require('openai');
const data = require('./data.json');
const { authenticate, issueToken, requireAuth, requireRole } = require('./auth');
const { buildCandidatePool, scoreMatch } = require('./matching');
const { fetchCareerScores } = require('./nlp');
const { introSchema, loginSchema, preferencesSchema } = require('./schemas');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tdc-matchmaker-api', syntheticData: true });
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const user = await authenticate(credentials.username, credentials.password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    return res.json({ token: issueToken(user), user });
  } catch (error) {
    return next(error);
  }
});

app.use('/api/customers', requireAuth, requireRole('matchmaker'));
app.use('/api/generate-intro', requireAuth, requireRole('matchmaker'));

app.get('/api/customers', (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(24, Math.max(6, Number.parseInt(req.query.limit || '12', 10)));
  const search = String(req.query.search || '').trim().toLowerCase();
  const filtered = search
    ? data.filter((profile) => `${profile.firstName} ${profile.lastName} ${profile.city} ${profile.designation}`.toLowerCase().includes(search))
    : data;
  const start = (page - 1) * limit;
  res.json({
    data: filtered.slice(start, start + limit),
    meta: { page, limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
  });
});

app.post('/api/customers/:id/matches', async (req, res, next) => {
  try {
    const user = data.find((profile) => profile.id === Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'Client not found.' });
    const preferences = preferencesSchema.parse(req.body || {});
    const pool = buildCandidatePool(data, user, preferences);
    const career = await fetchCareerScores(user.designation, pool.map((match) => match.designation));
    const matches = pool
      .map((match, index) => scoreMatch(user, match, career.scores[index], preferences.weights))
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, 5);
    return res.json({ data: matches, meta: { scoringSource: career.source, warning: career.warning || null } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/generate-intro', async (req, res, next) => {
  try {
    const { client, match } = introSchema.parse(req.body);
    if (!process.env.GROQ_API_KEY) {
      return res.json({
        explanation: `${client.firstName} and ${match.firstName} share promising professional and lifestyle alignment.`,
        emailDraft: `Hi ${client.firstName},\n\nI found a profile that may be worth exploring: ${match.firstName}, a ${match.designation}. Their preferences align with several priorities in your profile. Would you like me to arrange an introduction?`,
        source: 'template-fallback',
      });
    }

    const openai = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
    const prompt = `Return JSON with keys explanation and emailDraft. Explain, without sensitive-trait assumptions, why ${client.firstName} (${client.designation}) and ${match.firstName} (${match.designation}) may be compatible. Then draft a warm three-sentence opt-in introduction email.`;
    const response = await openai.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });
    const parsed = JSON.parse(response.choices[0].message.content);
    return res.json({ ...parsed, source: 'groq' });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.name === 'ZodError') {
    return res.status(400).json({ error: 'Invalid request.', details: error.issues });
  }
  console.error(error);
  return res.status(500).json({ error: 'The service could not complete the request.' });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => console.log(`TDC API listening on port ${port}`));
}

module.exports = { app };
