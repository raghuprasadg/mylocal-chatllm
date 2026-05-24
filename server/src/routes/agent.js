const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { decide, estimateSavings } = require('../routellm');
const { getAgent, getAllAgents, buildAgentMessages } = require('../agents');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/agent
 * Returns all available agents.
 */
router.get('/', (req, res) => {
  res.json({ agents: getAllAgents() });
});

/**
 * GET /api/agent/:id
 * Returns a specific agent.
 */
router.get('/:id', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agent });
});

/**
 * POST /api/agent/:id/chat
 * Body: { messages, forceModel? }
 *
 * Streams agent response with RouteLLM routing decision.
 * Agent step reasoning events are emitted before token stream.
 */
router.post('/:id/chat', requireApiKey, async (req, res) => {
  const { id } = req.params;
  const { messages = [], forceModel = null } = req.body;

  const agent = getAgent(id);
  if (!agent) return res.status(404).json({ error: `Agent '${id}' not found` });

  // Get last user message for routing
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return res.status(400).json({ error: 'No user message found' });

  // RouteLLM decision for this agent request
  const routing = decide(lastUserMsg.content, forceModel);

  // Build agent-aware messages
  const agentMessages = buildAgentMessages(id, messages.slice(0, -1), lastUserMsg.content);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── SSE ───────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // 1. Emit agent info
  res.write(`event: agent\ndata: ${JSON.stringify({
    id: agent.id,
    name: agent.name,
    emoji: agent.emoji,
  })}\n\n`);

  // 2. Emit routing decision
  res.write(`event: routing\ndata: ${JSON.stringify({
    score: routing.score,
    modelKey: routing.modelKey,
    model: routing.model,
    reason: routing.reason,
    isManual: routing.isManual,
  })}\n\n`);

  // 3. Emit agent reasoning steps (simulated pipeline transparency)
  const steps = [
    { step: 'analyze', label: 'Analyzing query', detail: `Complexity score: ${routing.score}/100` },
    { step: 'route', label: 'RouteLLM decision', detail: `Routing to ${routing.model.label} — ${routing.reason}` },
    { step: 'invoke', label: `Invoking ${agent.name}`, detail: `System context loaded, generating response…` },
  ];

  for (const step of steps) {
    res.write(`event: step\ndata: ${JSON.stringify(step)}\n\n`);
    await new Promise(r => setTimeout(r, 120)); // brief delay for UX
  }

  // 4. Stream tokens
  try {
    const stream = await client.messages.stream({
      model: routing.model.id,
      max_tokens: 2048,
      messages: agentMessages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        res.write(`event: token\ndata: ${JSON.stringify({ token: chunk.delta.text })}\n\n`);
      }
    }

    const finalMsg = await stream.finalMessage();
    const savings = estimateSavings(routing.modelKey, finalMsg.usage?.output_tokens || 500);

    res.write(`event: done\ndata: ${JSON.stringify({
      usage: finalMsg.usage,
      estimatedSavings: savings,
    })}\n\n`);

  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
