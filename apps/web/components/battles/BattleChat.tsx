'use client';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

type ChatMsg = { id: string; username: string; text: string; createdAt: string };

export function BattleChat({ battleId, token }: { battleId: string; token: string | null }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

  useEffect(() => {
    // Load existing messages
    fetch(`${API}/battles/${battleId}/chat`)
      .then(r => r.json())
      .then((d: { messages: ChatMsg[] }) => setMessages(d.messages))
      .catch(console.error);

    // SSE for live updates
    const es = new EventSource(`${API}/battles/${battleId}/chat/live`);
    es.addEventListener('chat', (e) => {
      const msg = JSON.parse(e.data) as ChatMsg;
      setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
    });
    return () => es.close();
  }, [battleId, API]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !token) return;
    setSending(true);
    await fetch(`${API}/battles/${battleId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: input.trim() }),
    }).catch(console.error);
    setInput('');
    setSending(false);
  };

  return (
    <div className="bg-[#12121a] rounded-xl border border-[#1e1e2e] flex flex-col" style={{ height: 320 }}>
      <div className="px-4 py-2 border-b border-[#1e1e2e] text-sm font-semibold text-[#94a3b8]">
        💬 Live Chat
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-[#475569] text-center mt-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className="text-sm">
            <span className="font-bold text-[#6c47ff]">@{m.username}</span>{' '}
            <span className="text-white" dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-2 border-t border-[#1e1e2e] flex gap-2">
        {token ? (
          <>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Say something..."
              maxLength={300}
              className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#6c47ff]"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="bg-[#6c47ff] text-white rounded-lg px-3 py-2 disabled:opacity-50 hover:bg-[#5a38e0] transition-colors"
            >
              <Send size={16} />
            </button>
          </>
        ) : (
          <p className="text-xs text-[#475569] w-full text-center py-1">Sign in to chat</p>
        )}
      </div>
    </div>
  );
}
