const express = require('express');
const { decide, scoreComplexity, MODELS, THRESHOLDS } = require('../routellm');

const router = express.Router();

/**
 * POST /api/route/analyze
 * Body: { text, forceModel? }
 * Returns routing decision without calling Anthropic.
 */
router.post('/analyze', (req, res) => {
  const { text, forceModel } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  const decision = decide(text.slice(0, 2000), forceModel);
  res.json(decision);
});

/**
 * GET /api/route/models
 * Returns all available models and thresholds.
 */
router.get('/models', (req, res) => {
  res.json({ models: MODELS, thresholds: THRESHOLDS });
});

module.exports = router;
