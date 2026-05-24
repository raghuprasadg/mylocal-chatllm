/**
 * Validate Anthropic API key is present.
 */
function requireApiKey(req, res, next) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env',
    });
  }
  next();
}

module.exports = { requireApiKey };
