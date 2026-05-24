/**
 * RouteLLM Engine
 * Automatically scores query complexity and routes to the optimal model.
 *
 * Scoring Dimensions:
 *  - Length / verbosity
 *  - Code & technical indicators
 *  - Reasoning / analysis depth
 *  - Math & science signals
 *  - Multi-step / planning signals
 *  - Creative / nuanced writing
 *  - Simplicity penalties (short factual queries)
 */

// Model definitions
const MODELS = {
  haiku: {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    tier: 'haiku',
    costPer1k: 0.00025,
    description: 'Fast, efficient — ideal for simple lookups and short tasks',
  },
  sonnet: {
    id: 'claude-sonnet-4-20250514',
    label: 'Sonnet 4',
    tier: 'sonnet',
    costPer1k: 0.003,
    description: 'Balanced performance — ideal for most tasks',
  },
  opus: {
    id: 'claude-opus-4-20250514',
    label: 'Opus 4',
    tier: 'opus',
    costPer1k: 0.015,
    description: 'Most capable — ideal for deep analysis and complex reasoning',
  },
};

// Routing thresholds (0–100 scale)
const THRESHOLDS = {
  haiku: 35,   // 0–34 → haiku
  sonnet: 68,  // 35–67 → sonnet
                // 68–100 → opus
};

/**
 * Score query complexity on a 0–100 scale.
 */
function scoreComplexity(text = '') {
  let score = 0;
  const t = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // ── Length factor ──────────────────────────────────
  score += Math.min(wordCount / 2.5, 18);

  // ── Code indicators ───────────────────────────────
  const codeKeywords = /\b(code|function|algorithm|implement|debug|refactor|class|interface|api|sql|regex|recursive|complexity|big.?o|runtime|async|await|promise|callback|typescript|javascript|python|rust|golang|kubernetes|docker|microservice)\b/;
  if (codeKeywords.test(t)) score += 14;
  if (/```|def |const |function |import |class |SELECT |INSERT |FROM /i.test(text)) score += 12;
  if (/\b(architecture|system design|scalab|distributed|concurrent|thread)\b/.test(t)) score += 10;

  // ── Reasoning / analysis ──────────────────────────
  const reasoningKeywords = /\b(analyze|analyse|compare|evaluate|critique|assess|explain why|explain how|reason|argument|pros.?and.?cons|trade.?off|implications|nuance|critically|synthesize|investigate|differentiate)\b/;
  if (reasoningKeywords.test(t)) score += 18;

  // ── Math & science ────────────────────────────────
  const scienceKeywords = /\b(equation|calculus|derivative|integral|matrix|vector|quantum|thermodynamics|statistics|hypothesis|proof|theorem|algorithm complexity|probability|bayesian|fourier|eigenvalue)\b/;
  if (scienceKeywords.test(t)) score += 20;
  if (/[∫∑∏√±≈≠≤≥∞∂∇]|\b(dx|dy|dz|lim\s*[→(])\b/.test(text)) score += 15;

  // ── Multi-step / planning ─────────────────────────
  const planningKeywords = /\b(step.?by.?step|plan|strategy|design|architect|comprehensive|detailed|thorough|in.?depth|breakdown|roadmap|workflow|pipeline|end.?to.?end|full.?stack)\b/;
  if (planningKeywords.test(t)) score += 12;

  // ── Creative / nuanced ────────────────────────────
  const creativeKeywords = /\b(write a story|poem|essay|creative|narrative|nuanced|philosophical|ethical dilemma|debate|persuade|argue|dissertation|literary analysis)\b/;
  if (creativeKeywords.test(t)) score += 10;

  // ── Long-form context ─────────────────────────────
  if (wordCount > 80) score += 10;
  if (wordCount > 150) score += 8;

  // ── Simplicity penalties ──────────────────────────
  const simplePatterns = /^(what is|who is|when was|where is|define|how do you spell|translate|convert|what does|what's the capital|what year)\b/i;
  if (simplePatterns.test(text) && wordCount < 12) score -= 22;
  if (wordCount < 6) score -= 15;
  if (wordCount < 10 && !/\b(code|analyze|compare|explain|design|implement)\b/.test(t)) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Route a complexity score to a model key.
 */
function routeModel(complexityScore) {
  if (complexityScore < THRESHOLDS.haiku) return 'haiku';
  if (complexityScore < THRESHOLDS.sonnet) return 'sonnet';
  return 'opus';
}

/**
 * Generate a human-readable routing rationale.
 */
function routeReason(complexityScore, modelKey) {
  const reasons = {
    haiku: [
      'Short or simple query — fast model selected for efficiency',
      'Straightforward lookup — routing to lightweight model',
      'Low complexity detected — Haiku handles this optimally',
    ],
    sonnet: [
      'Moderate complexity — balanced model selected',
      'Technical query with moderate depth — Sonnet is well-suited',
      'Mixed reasoning and factual content — balanced routing',
    ],
    opus: [
      'High complexity query — most capable model selected',
      'Deep analysis required — Opus handles this best',
      'Multi-faceted reasoning detected — routing to top-tier model',
    ],
  };
  const pool = reasons[modelKey] || reasons.sonnet;
  // Pick deterministically based on score to avoid randomness
  return pool[complexityScore % pool.length];
}

/**
 * Full routing decision for a query.
 */
function decide(text, forceModel = null) {
  const score = scoreComplexity(text);

  let modelKey;
  let isManual = false;

  if (forceModel && MODELS[forceModel]) {
    modelKey = forceModel;
    isManual = true;
  } else {
    modelKey = routeModel(score);
  }

  const model = MODELS[modelKey];

  return {
    score,
    modelKey,
    model,
    isManual,
    reason: isManual ? 'Manual model override' : routeReason(score, modelKey),
    thresholds: THRESHOLDS,
  };
}

/**
 * Calculate estimated savings vs always using Opus.
 */
function estimateSavings(modelKey, tokenCount = 500) {
  const opusCost = MODELS.opus.costPer1k * (tokenCount / 1000);
  const actualCost = MODELS[modelKey].costPer1k * (tokenCount / 1000);
  return Math.max(0, opusCost - actualCost);
}

module.exports = {
  MODELS,
  THRESHOLDS,
  scoreComplexity,
  routeModel,
  routeReason,
  decide,
  estimateSavings,
};
