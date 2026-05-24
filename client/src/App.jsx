import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from './store';
import { useChatStream, useAgentStream, useRoutePreview } from './hooks/useRouteLLM';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import StatsBar from './components/StatsBar';
import Message from './components/Message';
import InputBar from './components/InputBar';
import EmptyState from './components/EmptyState';
import { truncate, copyToClipboard } from './utils';

const AGENTS_META = [
  { id: 'researcher', emoji: '🔬', name: 'Researcher', description: 'Deep analysis, citations, summaries' },
  { id: 'coder', emoji: '💻', name: 'Code Assistant', description: 'Write, debug, review & explain code' },
  { id: 'writer', emoji: '✍️', name: 'Writer', description: 'Creative & professional writing' },
  { id: 'analyst', emoji: '📊', name: 'Data Analyst', description: 'Data insights & interpretation' },
  { id: 'planner', emoji: '📋', name: 'Task Planner', description: 'Goals → actionable steps & strategy' },
];

export default function App() {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Store
  const mode = useStore((s) => s.mode);
  const routeEnabled = useStore((s) => s.routeEnabled);
  const setRouteEnabled = useStore((s) => s.setRouteEnabled);
  const forceModel = useStore((s) => s.forceModel);
  const setForceModel = useStore((s) => s.setForceModel);
  const recordRoute = useStore((s) => s.recordRoute);

  // Chat store
  const conversations = useStore((s) => s.conversations);
  const activeConvId = useStore((s) => s.activeConvId);
  const getActiveConv = useStore((s) => s.getActiveConv);
  const newConversation = useStore((s) => s.newConversation);
  const setActiveConv = useStore((s) => s.setActiveConv);
  const addMessage = useStore((s) => s.addMessage);
  const updateLastMessage = useStore((s) => s.updateLastMessage);
  const updateConvTitle = useStore((s) => s.updateConvTitle);
  const truncateMessages = useStore((s) => s.truncateMessages);

  // Agent store
  const activeAgentId = useStore((s) => s.activeAgentId);
  const getAgentHistory = useStore((s) => s.getAgentHistory);
  const addAgentMessage = useStore((s) => s.addAgentMessage);
  const updateLastAgentMessage = useStore((s) => s.updateLastAgentMessage);
  const clearAgentHistory = useStore((s) => s.clearAgentHistory);

  // Hooks
  const { streaming: chatStreaming, streamChat } = useChatStream();
  const { streaming: agentStreaming, streamAgent } = useAgentStream();
  const { preview, analyze } = useRoutePreview();

  const streaming = chatStreaming || agentStreaming;
  const activeAgent = AGENTS_META.find((a) => a.id === activeAgentId);

  // Current messages
  const chatMessages = getActiveConv()?.messages || [];
  const agentMessages = getAgentHistory(activeAgentId);
  const messages = mode === 'chat' ? chatMessages : agentMessages;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 680);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (val) => {
    setInput(val);
    analyze(val);
  };

  // ── SEND ───────────────────────────────────────────
  const handleSend = useCallback(async (prefill) => {
    const text = (prefill || input).trim();
    if (!text || streaming) return;
    setInput('');

    if (mode === 'chat') {
      await sendChat(text);
    } else {
      await sendAgent(text);
    }
  }, [input, streaming, mode, activeConvId, activeAgentId, routeEnabled, forceModel]);

  async function sendChat(text) {
    let convId = activeConvId;
    if (!convId) convId = newConversation();

    addMessage(convId, { id: `u_${Date.now()}`, role: 'user', content: text });

    const state = useStore.getState();
    const conv = state.conversations.find((c) => c.id === convId);
    if (conv && conv.messages.filter((m) => m.role === 'user').length === 1) {
      updateConvTitle(convId, truncate(text, 42));
    }

    addMessage(convId, {
      id: `a_${Date.now()}`, role: 'assistant', content: '', isStreaming: true,
      modelKey: null, modelLabel: null, score: null, routeDecision: null,
    });

    const conv2 = useStore.getState().conversations.find((c) => c.id === convId);
    const apiMsgs = (conv2?.messages || [])
      .filter((m) => !m.isStreaming && m.role !== 'error')
      .map((m) => ({ role: m.role, content: m.content }));

    let accText = '';
    await streamChat({
      messages: apiMsgs,
      forceModel: routeEnabled ? null : forceModel,
      onRouting: (d) => updateLastMessage(convId, { modelKey: d.modelKey, modelLabel: d.model?.label, score: d.score, routeDecision: d.reason }),
      onToken: (tok) => { accText += tok; updateLastMessage(convId, { content: accText }); },
      onDone: (d) => {
        updateLastMessage(convId, { isStreaming: false });
        const lastMsg = useStore.getState().conversations.find((c) => c.id === convId)?.messages.slice(-1)[0];
        if (lastMsg?.modelKey) recordRoute(lastMsg.modelKey, lastMsg.score || 50, d.estimatedSavings || 0);
      },
      onError: (err) => updateLastMessage(convId, { isStreaming: false, content: `Error: ${err}`, isError: true }),
    });
  }

  async function sendAgent(text) {
    const agentId = activeAgentId;
    addAgentMessage(agentId, { id: `u_${Date.now()}`, role: 'user', content: text });
    addAgentMessage(agentId, {
      id: `a_${Date.now()}`, role: 'assistant', content: '', isStreaming: true,
      modelKey: null, modelLabel: null, score: null, steps: [],
    });

    const history = useStore.getState().getAgentHistory(agentId);
    const apiMsgs = history
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    let accText = '';
    await streamAgent({
      agentId,
      messages: apiMsgs,
      forceModel: routeEnabled ? null : forceModel,
      onRouting: (d) => updateLastAgentMessage(agentId, { modelKey: d.modelKey, modelLabel: d.model?.label, score: d.score, routeDecision: d.reason }),
      onStep: (step) => {
        updateLastAgentMessage(agentId, {
          steps: [...(useStore.getState().getAgentHistory(agentId).slice(-1)[0]?.steps || []), step],
        });
      },
      onToken: (tok) => { accText += tok; updateLastAgentMessage(agentId, { content: accText }); },
      onDone: (d) => {
        updateLastAgentMessage(agentId, { isStreaming: false });
        const lastMsg = useStore.getState().getAgentHistory(agentId).slice(-1)[0];
        if (lastMsg?.modelKey) recordRoute(lastMsg.modelKey, lastMsg.score || 50, d.estimatedSavings || 0);
      },
      onError: (err) => updateLastAgentMessage(agentId, { isStreaming: false, content: `Error: ${err}`, isError: true }),
    });
  }

  // ── Regen ───────────────────────────────────────
  const handleRegen = (index) => {
    if (streaming) return;
    if (mode === 'chat') {
      const conv = getActiveConv();
      if (!conv) return;
      truncateMessages(conv.id, index);
      const lastUser = conv.messages.slice(0, index).reverse().find((m) => m.role === 'user');
      if (lastUser) handleSend(lastUser.content);
    }
  };

  // ── Topbar helpers ───────────────────────────────
  const getTitle = () => {
    if (mode === 'agents' && activeAgent) return `${activeAgent.emoji} ${activeAgent.name}`;
    return getActiveConv()?.title || 'New Chat';
  };

  const getSubtitle = () => {
    if (mode === 'agents') return 'Agent · RouteLLM';
    return 'RouteLLM';
  };

  const handleCopyChat = () => {
    const msgs = mode === 'chat' ? chatMessages : agentMessages;
    if (!msgs.length) return;
    copyToClipboard(msgs.map((m) => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n'));
  };

  const handleNewChat = () => {
    if (mode === 'chat') newConversation();
    else clearAgentHistory(activeAgentId);
  };

  // ── Placeholder for input ────────────────────────
  const placeholder = mode === 'agents' && activeAgent
    ? `Message ${activeAgent.name}…`
    : 'Message ChatLLM…';

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar onNewChat={handleNewChat} onNewAgent={() => clearAgentHistory(activeAgentId)} />
      )}

      {/* Main */}
      <div style={styles.main}>
        <Topbar
          title={getTitle()}
          subtitle={getSubtitle()}
          showMenu={window.innerWidth <= 680}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
          onCopyChat={handleCopyChat}
        />

        <StatsBar routeEnabled={routeEnabled} />

        {/* Chat area */}
        <div style={styles.chatArea} ref={chatAreaRef}>
          {messages.length === 0 ? (
            <EmptyState
              mode={mode}
              activeAgent={activeAgent}
              onSuggest={(text) => handleSend(text)}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <Message
                  key={msg.id || i}
                  message={msg}
                  agentEmoji={mode === 'agents' ? activeAgent?.emoji : undefined}
                  agentName={mode === 'agents' ? activeAgent?.name : undefined}
                  onRegen={!msg.isStreaming && msg.role === 'assistant' && mode === 'chat' ? () => handleRegen(i) : null}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <InputBar
          value={input}
          onChange={handleInputChange}
          onSend={() => handleSend()}
          disabled={streaming}
          routePreview={preview}
          routeEnabled={routeEnabled}
          forceModel={forceModel || 'sonnet'}
          onToggleRoute={() => setRouteEnabled(!routeEnabled)}
          onChangeForceModel={setForceModel}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

const styles = {
  app: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-900)' },
  chatArea: { flex: 1, overflowY: 'auto', padding: '18px 0 8px', scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent', scrollBehavior: 'smooth' },
};
