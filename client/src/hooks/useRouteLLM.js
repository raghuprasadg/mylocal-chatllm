import { useState, useCallback, useRef } from 'react';

const API = '/api';

/**
 * Live complexity preview (calls /api/route/analyze).
 * Debounced to avoid flooding.
 */
export function useRoutePreview() {
  const [preview, setPreview] = useState(null);
  const timerRef = useRef(null);

  const analyze = useCallback((text) => {
    if (!text.trim()) { setPreview(null); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/route/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) setPreview(await res.json());
      } catch { /* silent */ }
    }, 200);
  }, []);

  return { preview, analyze };
}

/**
 * Stream a chat response via SSE.
 */
export function useChatStream() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);

  const streamChat = useCallback(async ({
    messages,
    forceModel,
    onRouting,
    onToken,
    onDone,
    onError,
  }) => {
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, forceModel, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      await consumeSSE(res.body, { onRouting, onToken, onDone, onError });
    } catch (err) {
      if (err.name !== 'AbortError') onError?.(err.message);
    } finally {
      setStreaming(false);
    }
  }, []);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { streaming, streamChat, abort };
}

/**
 * Stream an agent response via SSE.
 */
export function useAgentStream() {
  const [streaming, setStreaming] = useState(false);
  const [steps, setSteps] = useState([]);
  const abortRef = useRef(null);

  const streamAgent = useCallback(async ({
    agentId,
    messages,
    forceModel,
    onRouting,
    onStep,
    onToken,
    onDone,
    onError,
  }) => {
    setStreaming(true);
    setSteps([]);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API}/agent/${agentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, forceModel }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      await consumeSSE(res.body, {
        onRouting,
        onStep: (data) => {
          setSteps((prev) => [...prev, data]);
          onStep?.(data);
        },
        onToken,
        onDone,
        onError,
      });
    } catch (err) {
      if (err.name !== 'AbortError') onError?.(err.message);
    } finally {
      setStreaming(false);
    }
  }, []);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { streaming, steps, streamAgent, abort };
}

// ── Internal SSE consumer ─────────────────────────
async function consumeSSE(body, handlers) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    let currentEvent = null;
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        switch (currentEvent) {
          case 'routing': handlers.onRouting?.(data); break;
          case 'step':    handlers.onStep?.(data);    break;
          case 'token':   handlers.onToken?.(data.token); break;
          case 'done':    handlers.onDone?.(data);    break;
          case 'error':   handlers.onError?.(data.error); break;
          case 'agent':   /* agent info */ break;
        }
        currentEvent = null;
      }
    }
  }
}
