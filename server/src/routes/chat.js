const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { decide, estimateSavings } = require('../routellm');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/chat
 * Body: { messages, forceModel?, stream? }
 *
 * Returns SSE stream of tokens + routing metadata.
 */
router.post('/', requireApiKey, async (req, res) => {
  const { messages, forceModel = null, stream = true } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Validate message format
  const validRoles = ['user', 'assistant'];
  for (const m of messages) {
    if (!validRoles.includes(m.role) || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }
  }

  // Get the last user message for routing
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) {
    return res.status(400).json({ error: 'No user message found' });
  }

  // RouteLLM decision
  const routing = decide(lastUserMsg.content, forceModel);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Non-streaming response ────────────────────────
  if (!stream) {
    try {
      const response = await client.messages.create({
        model: routing.model.id,
        max_tokens: 2048,
        messages,
      });

      const content = response.content[0]?.text || '';
      return res.json({
        content,
        routing: {
          score: routing.score,
          modelKey: routing.modelKey,
          model: routing.model,
          reason: routing.reason,
          isManual: routing.isManual,
          estimatedSavings: estimateSavings(routing.modelKey),
        },
        usage: response.usage,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── SSE streaming response ────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send routing metadata first
  res.write(`event: routing\ndata: ${JSON.stringify({
    score: routing.score,
    modelKey: routing.modelKey,
    model: routing.model,
    reason: routing.reason,
    isManual: routing.isManual,
  })}\n\n`);

  try {
    const stream = await client.messages.stream({
      model: routing.model.id,
      max_tokens: 2048,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const token = chunk.delta.text;
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
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
