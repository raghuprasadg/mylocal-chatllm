import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Helpers ────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

// ── Store ──────────────────────────────────────────
export const useStore = create(
  persist(
    (set, get) => ({
      // ── Mode ────────────────────────────────────
      mode: 'chat', // 'chat' | 'agents'
      setMode: (mode) => set({ mode }),

      // ── RouteLLM ────────────────────────────────
      routeEnabled: true,
      setRouteEnabled: (v) => set({ routeEnabled: v }),
      forceModel: null, // null | 'haiku' | 'sonnet' | 'opus'
      setForceModel: (v) => set({ forceModel: v }),

      // ── Stats ────────────────────────────────────
      stats: { haiku: 0, sonnet: 0, opus: 0, totalSavings: 0, totalCx: 0, n: 0 },
      recordRoute: (modelKey, score, savings) =>
        set((s) => ({
          stats: {
            ...s.stats,
            [modelKey]: s.stats[modelKey] + 1,
            n: s.stats.n + 1,
            totalCx: s.stats.totalCx + score,
            totalSavings: s.stats.totalSavings + savings,
          },
        })),

      // ── Conversations ────────────────────────────
      conversations: [],
      activeConvId: null,

      getActiveConv() {
        return get().conversations.find((c) => c.id === get().activeConvId) || null;
      },

      newConversation() {
        const id = uid();
        set((s) => ({
          conversations: [
            { id, title: 'New conversation', messages: [], createdAt: Date.now() },
            ...s.conversations,
          ],
          activeConvId: id,
        }));
        return id;
      },

      setActiveConv(id) {
        set({ activeConvId: id });
      },

      deleteConversation(id) {
        set((s) => {
          const convs = s.conversations.filter((c) => c.id !== id);
          const newActive =
            s.activeConvId === id ? (convs[0]?.id || null) : s.activeConvId;
          return { conversations: convs, activeConvId: newActive };
        });
      },

      updateConvTitle(id, title) {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }));
      },

      addMessage(convId, message) {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, message] }
              : c
          ),
        }));
      },

      updateLastMessage(convId, updates) {
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...updates };
            return { ...c, messages: msgs };
          }),
        }));
      },

      truncateMessages(convId, toIndex) {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: c.messages.slice(0, toIndex) }
              : c
          ),
        }));
      },

      // ── Agents ───────────────────────────────────
      activeAgentId: 'researcher',
      setActiveAgent: (id) => set({ activeAgentId: id }),
      agentHistories: {}, // { agentId: [messages] }

      getAgentHistory(agentId) {
        return get().agentHistories[agentId] || [];
      },

      addAgentMessage(agentId, message) {
        set((s) => ({
          agentHistories: {
            ...s.agentHistories,
            [agentId]: [...(s.agentHistories[agentId] || []), message],
          },
        }));
      },

      updateLastAgentMessage(agentId, updates) {
        set((s) => {
          const msgs = [...(s.agentHistories[agentId] || [])];
          if (!msgs.length) return s;
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...updates };
          return { agentHistories: { ...s.agentHistories, [agentId]: msgs } };
        });
      },

      clearAgentHistory(agentId) {
        set((s) => ({
          agentHistories: { ...s.agentHistories, [agentId]: [] },
        }));
      },
    }),
    {
      name: 'chatllm-store',
      partialize: (s) => ({
        conversations: s.conversations,
        activeConvId: s.activeConvId,
        activeAgentId: s.activeAgentId,
        agentHistories: s.agentHistories,
        stats: s.stats,
        routeEnabled: s.routeEnabled,
        forceModel: s.forceModel,
      }),
    }
  )
);
