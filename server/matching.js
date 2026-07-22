const DEFAULT_WEIGHTS = Object.freeze({
  career: 0.35,
  lifestyle: 0.3,
  location: 0.2,
  language: 0.15,
});

const splitLanguages = (value = '') =>
  new Set(value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean));

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function normalizeWeights(input = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...input };
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0);
  if (total <= 0) return DEFAULT_WEIGHTS;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Number(value || 0) / total]),
  );
}

function choiceCompatibility(left, right) {
  if (!left || !right) return 50;
  if (left === right) return 100;
  if (left === 'Maybe' || right === 'Maybe') return 65;
  return 0;
}

function languageCompatibility(left, right) {
  const a = splitLanguages(left);
  const b = splitLanguages(right);
  if (!a.size || !b.size) return 50;
  const intersection = [...a].filter((language) => b.has(language)).length;
  const union = new Set([...a, ...b]).size;
  return (intersection / union) * 100;
}

function locationCompatibility(user, match) {
  if (user.city === match.city) return 100;
  if (user.openToRelocate === 'Yes' || match.openToRelocate === 'Yes') return 80;
  if (user.openToRelocate === 'Maybe' || match.openToRelocate === 'Maybe') return 55;
  return 20;
}

function buildCandidatePool(profiles, user, preferences = {}) {
  const preferredGenders = preferences.preferredGenders || [];
  return profiles.filter((profile) => {
    if (profile.id === user.id) return false;
    if (preferredGenders.length && !preferredGenders.includes(profile.gender)) return false;
    return true;
  });
}

function scoreMatch(user, match, careerScore, rawWeights = {}) {
  const weights = normalizeWeights(rawWeights);
  const lifestyle = [
    choiceCompatibility(user.wantKids, match.wantKids),
    choiceCompatibility(user.openToPets, match.openToPets),
    choiceCompatibility(user.openToRelocate, match.openToRelocate),
  ].reduce((sum, value) => sum + value, 0) / 3;

  const components = {
    career: clamp(careerScore),
    lifestyle,
    location: locationCompatibility(user, match),
    language: languageCompatibility(user.languagesKnown, match.languagesKnown),
  };

  const matchScore = Math.round(
    Object.entries(components).reduce((sum, [key, value]) => sum + value * weights[key], 0),
  );

  const explanations = Object.entries(components)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 2)
    .map(([name, value]) => `${name} alignment ${Math.round(value)}%`);

  return { ...match, matchScore, scoreBreakdown: components, explanations };
}

module.exports = {
  DEFAULT_WEIGHTS,
  buildCandidatePool,
  choiceCompatibility,
  languageCompatibility,
  locationCompatibility,
  normalizeWeights,
  scoreMatch,
};
