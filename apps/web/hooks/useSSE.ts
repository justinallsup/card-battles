'use client';
import { useEffect, useRef } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

export function useBattleSSE(battleId: string | undefined, onUpdate: (data: unknown) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!battleId) return;
    const es = new EventSource(`${BASE_URL}/battles/${battleId}/live`);
    es.onmessage = (e) => {
      try { onUpdateRef.current(JSON.parse(e.data)); } catch {}
    };
    es.onerror = () => {
      // Silently handle SSE errors (server may restart)
    };
    return () => es.close();
  }, [battleId]);
}
