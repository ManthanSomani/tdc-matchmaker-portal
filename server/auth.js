const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

function getAuthConfig() {
  const jwtSecret = process.env.JWT_SECRET || (!isProduction ? 'local-development-only-secret' : '');
  const username = process.env.DEMO_ADMIN_USERNAME || 'admin';
  const passwordHash = process.env.DEMO_ADMIN_PASSWORD_HASH;
  const password = process.env.DEMO_ADMIN_PASSWORD || (!isProduction ? 'admin' : '');

  if (!jwtSecret) throw new Error('JWT_SECRET must be configured in production.');
  if (!passwordHash && !password) {
    throw new Error('DEMO_ADMIN_PASSWORD_HASH must be configured in production.');
  }

  return { jwtSecret, username, passwordHash, password };
}

async function authenticate(username, password) {
  const config = getAuthConfig();
  if (username !== config.username) return null;
  const valid = config.passwordHash
    ? await bcrypt.compare(password, config.passwordHash)
    : password === config.password;
  if (!valid) return null;
  return { username, role: 'matchmaker' };
}

function issueToken(user) {
  const { jwtSecret } = getAuthConfig();
  return jwt.sign(user, jwtSecret, { expiresIn: '2h', issuer: 'tdc-matchmaker-api' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const { jwtSecret } = getAuthConfig();
    req.user = jwt.verify(token, jwtSecret, { issuer: 'tdc-matchmaker-api' });
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    return next();
  };
}

module.exports = { authenticate, issueToken, requireAuth, requireRole };
