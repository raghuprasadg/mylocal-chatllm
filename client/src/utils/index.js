import { marked } from 'marked';

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(text = '') {
  return marked.parse(text);
}

export function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function truncate(str = '', max = 45) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function formatSavings(amount = 0) {
  return '$' + amount.toFixed(3);
}

export function modelClass(modelKey) {
  return { haiku: 'h', sonnet: 's', opus: 'o' }[modelKey] || 's';
}

export function modelIcon(modelKey) {
  return { haiku: '⚡', sonnet: '⚖️', opus: '💎' }[modelKey] || '⚖️';
}

export function tierColor(cls) {
  return {
    h: 'var(--haiku-c)', haiku: 'var(--haiku-c)',
    s: 'var(--sonnet-c)', sonnet: 'var(--sonnet-c)',
    o: 'var(--opus-c)', opus: 'var(--opus-c)',
  }[cls] || 'var(--sonnet-c)';
}

export function tierBg(cls) {
  return {
    h: 'var(--haiku-bg)', haiku: 'var(--haiku-bg)',
    s: 'var(--sonnet-bg)', sonnet: 'var(--sonnet-bg)',
    o: 'var(--opus-bg)', opus: 'var(--opus-bg)',
  }[cls] || 'var(--sonnet-bg)';
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
