import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { useChatStream, useRoutePreview } from '../hooks/useRouteLLM';
import Message from './Message';
import InputBar from './InputBar';
import EmptyState from './EmptyState';
import { truncate, copyToClipboard } from '../utils';

export default function ChatPane() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const mode = useStore((s) => s.mode);
  const routeEnabled = useStore((s) => s.routeEnabled);
  const setRouteEnabled = useStore((s) => s.setRouteEnabled);
  const forceModel = useStore((s) => s.forceModel);
  const setForceModel = useStore((s) => s.setForceModel);
  const recordRoute = useStore((s) => s.recordRoute);

  const activeConvId = useStore((s) => s.activeConvId);
  const getActiveConv = useStore((s) => s.getActiveConv);
  const newConversation = useStore((s) => s.newConversation);
  const addMessage = useStore((s) => s.addMessage);
  const updateLastMessage = useStore((s) => s.updateLastMessage);
  const updateConvTitle = useStore((s) => s.updateConvTitle);
  const truncateMessages = useStore((s) => s.truncateMessages);

  const { streaming, streamChat } = useChatStream();
  const { preview, analyze } = useRoutePreview();

  const conv = getActiveConv();
  const messages = conv?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  const handleInputChange = (val) => {
    setInput(val);
    analyze(val);
  };

  const handleSend = async (prefill) => {
    const text = (prefill || input).trim();
    if (!text || streaming) return;

    setInput('');

    // Ensure a conversation exists
    let convId = activeConvId;
    if (!convId) convId = newConversation();

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', content: text };
    addMessage(convId, userMsg);

    // Auto-title from first message
    const currentConv = useStore.getState().getActiveConv();
    if (!currentConv || currentConv.messages.length <= 1) {
      updateConvTitle(convId, truncate(text, 42));
    }

    // Placeholder AI message
    const aiMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      isStreaming: true,
      modelKey: null,
      modelLabel: null,
      score: null,
      routeDecision: null,
    };
    addMessage(convId, aiMsg);

    // Build messages for API (all except the placeholder)
    const convMessages = useStore.getState().conversations
      .find((c) => c.id === convId)?.messages || [];
    const apiMessages = convMessages
      .filter((m) => !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));

    let accText = '';

    await streamChat({
      messages: [...apiMessages, { role: 'user', content: text }],
      forceModel: routeEnabled ? null : forceModel,
      onRouting: (data) => {
        updateLastMessage(convId, {
          modelKey: data.modelKey,
          modelLabel: data.model?.label,
          score: data.score,
          routeDecision: data.reason,
          isManual: data.isManual,
        });
      },
      onToken: (token) => {
        accText += token;
        updateLastMessage(convId, { content: accText });
      },
      onDone: (data) => {
        updateLastMessage(convId, { isStreaming: false, content: accText });
        const savedMsg = useStore.getState().conversations
          .find((c) => c.id === convId)?.messages.slice(-1)[0];
        if (savedMsg?.modelKey) {
          recordRoute(savedMsg.modelKey, savedMsg.score || 50, data.estimatedSavings || 0);
        }
      },
      onError: (err) => {
        updateLastMessage(convId, { isStreaming: false, content: err, isError: true });
      },
    });
  };

  const handleRegen = (index) => {
    if (streaming) return;
    const conv = getActiveConv();
    if (!conv) return;
    truncateMessages(conv.id, index);
    const lastUser = [...conv.messages].slice(0, index).reverse().find((m) => m.role === 'user');
    if (lastUser) handleSend(lastUser.content);
  };

  const handleCopyChat = () => {
    const conv = getActiveConv();
    if (!conv?.messages.length) return;
    const text = conv.messages.map((m) => `${m.role === 'user' ? 'You' : 'Claude'}: ${m.content}`).join('\n\n');
    copyToClipboard(text);
  };

  return { messages, streaming, input, handleInputChange, handleSend, handleRegen, handleCopyChat, preview, routeEnabled, setRouteEnabled, forceModel, setForceModel, conv };
}
