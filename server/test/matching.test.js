const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCandidatePool,
  choiceCompatibility,
  languageCompatibility,
  locationCompatibility,
  normalizeWeights,
  scoreMatch,
} = require('../matching');
const { fallbackCareerScores, fetchCareerScores } = require('../nlp');

const user = {
  id: 1,
  city: 'Bengaluru',
  gender: 'Female',
  designation: 'Engineer',
  languagesKnown: 'English, Hindi',
  wantKids: 'Yes',
  openToRelocate: 'No',
  openToPets: 'Maybe',
};

const match = {
  id: 2,
  city: 'Bengaluru',
  gender: 'Male',
  designation: 'Engineer',
  languagesKnown: 'English, Kannada',
  wantKids: 'Yes',
  openToRelocate: 'Maybe',
  openToPets: 'Yes',
};

test('normalizes custom scoring weights to one', () => {
  const weights = normalizeWeights({ career: 2, lifestyle: 1, location: 1, language: 0 });
  assert.equal(Object.values(weights).reduce((sum, value) => sum + value, 0), 1);
});

test('falls back to safe default weights when every weight is zero', () => {
  const weights = normalizeWeights({ career: 0, lifestyle: 0, location: 0, language: 0 });
  assert.equal(weights.career, 0.35);
});

test('scores matching choices at 100', () => {
  assert.equal(choiceCompatibility('Yes', 'Yes'), 100);
});

test('scores a Maybe choice as partial alignment', () => {
  assert.equal(choiceCompatibility('Maybe', 'No'), 65);
});

test('computes language overlap with Jaccard similarity', () => {
  assert.equal(Math.round(languageCompatibility('English, Hindi', 'English, Kannada')), 33);
});

test('rewards matching cities without using protected traits', () => {
  assert.equal(locationCompatibility(user, match), 100);
});

test('candidate pool excludes the selected client', () => {
  assert.deepEqual(buildCandidatePool([user, match], user).map((item) => item.id), [2]);
});

test('candidate pool respects an explicit gender preference', () => {
  const another = { ...match, id: 3, gender: 'Female' };
  assert.deepEqual(
    buildCandidatePool([user, match, another], user, { preferredGenders: ['Male'] }).map((item) => item.id),
    [2],
  );
});

test('returns an explainable score breakdown', () => {
  const scored = scoreMatch(user, match, 90);
  assert.ok(scored.matchScore >= 0 && scored.matchScore <= 100);
  assert.equal(scored.scoreBreakdown.career, 90);
  assert.equal(scored.explanations.length, 2);
});

test('career fallback is deterministic', () => {
  assert.deepEqual(fallbackCareerScores('Engineer', ['Engineer', 'Designer']), [100, 45]);
});

test('NLP failures return fallback scores and an observable warning', async () => {
  const fetchImpl = async () => { throw new Error('offline'); };
  const result = await fetchCareerScores('Engineer', ['Designer'], {
    url: 'https://nlp.invalid', fetchImpl, timeoutMs: 10,
  });
  assert.equal(result.source, 'rules-fallback');
  assert.deepEqual(result.scores, [45]);
  assert.equal(result.warning, 'offline');
});
