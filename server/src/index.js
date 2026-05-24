require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const chatRoutes = require('./routes/chat');
const agentRoutes = require('./routes/agent');
const routeRoutes = require('./routes/route');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ─────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api/', limiter);

// ── Middleware ───────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ── Health check ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routellm: true,
  });
});

// ── API Routes ───────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/route', routeRoutes);

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`\n🧠 ChatLLM Server running on http://localhost:${PORT}`);
  console.log(`⚡ RouteLLM engine: ACTIVE`);
  console.log(`🔑 Anthropic API: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : '⚠ Missing ANTHROPIC_API_KEY'}\n`);
});

module.exports = app;
