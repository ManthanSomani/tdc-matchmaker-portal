function fallbackCareerScores(userText, matchTexts) {
  return matchTexts.map((text) => (text === userText ? 100 : 45));
}

async function fetchCareerScores(userText, matchTexts, options = {}) {
  const url = options.url || process.env.NLP_SERVICE_URL;
  const timeoutMs = options.timeoutMs || Number(process.env.NLP_TIMEOUT_MS || 5000);
  const fetchImpl = options.fetchImpl || fetch;
  if (!url) return { scores: fallbackCareerScores(userText, matchTexts), source: 'rules-fallback' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${url}/api/batch-similarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_text: userText, match_texts: matchTexts }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`NLP service returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.scores) || data.scores.length !== matchTexts.length) {
      throw new Error('NLP service returned an invalid score set');
    }
    return { scores: data.scores, source: 'sentence-transformer' };
  } catch (error) {
    return {
      scores: fallbackCareerScores(userText, matchTexts),
      source: 'rules-fallback',
      warning: error.name === 'AbortError' ? 'NLP request timed out.' : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fallbackCareerScores, fetchCareerScores };
