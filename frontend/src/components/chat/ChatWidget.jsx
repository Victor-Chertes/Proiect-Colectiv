import { useEffect, useRef, useState } from 'react';
import { streamChat } from '../../services/chatService';

const STORAGE_KEY = 'fitflow_chat';

const loadHistory = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.83L3 20l1.4-3.72A7.6 7.6 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage unavailable – history just won't persist
    }
  }, [messages]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, error]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = [...messages, { role: 'user', content: text }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setError('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat(
        history,
        (piece) => setMessages((prev) => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: last.content + piece }];
        }),
        controller.signal,
      );
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      // Drop an empty assistant bubble if nothing arrived.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return last?.role === 'assistant' && !last.content ? prev.slice(0, -1) : prev;
      });
      setLoading(false);
      abortRef.current = null;
    }
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError('');
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Deschide asistentul FitFlow"
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-black/40 flex items-center justify-center transition-colors"
      >
        <ChatIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[min(32rem,calc(100vh-8rem))] flex flex-col bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600 bg-dark-700">
        <div>
          <p className="text-white font-semibold text-sm">FitFlow Coach</p>
          <p className="text-gray-400 text-xs">Antrenamente și nutriție</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={clear} className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-dark-600">
            Șterge
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label="Închide" className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-dark-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <div className="max-w-[85%] bg-dark-700 text-gray-200 text-sm rounded-2xl rounded-bl-sm px-3 py-2">
          Salut! Întreabă-mă orice despre antrenamente sau nutriție.
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] text-sm rounded-2xl px-3 py-2 whitespace-pre-wrap break-words ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-dark-700 text-gray-200 rounded-bl-sm'
              }`}
            >
              {m.content || <span className="text-gray-500 animate-pulse">Se gândește…</span>}
            </div>
          </div>
        ))}
        {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-dark-600">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1500}
          placeholder="Scrie o întrebare…"
          className="flex-1 bg-dark-700 text-white text-sm rounded-xl px-3 py-2 outline-none border border-dark-600 focus:border-brand-500 placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors"
        >
          Trimite
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
