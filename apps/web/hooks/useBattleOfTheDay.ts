import { useState, useEffect } from 'react';

export function useBattleOfTheDay() {
  const [botd, setBotd] = useState<{battle:{id:string};date:string;badge:string} | null>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

  useEffect(() => {
    fetch(`${API}/battle-of-the-day`)
      .then(r => r.json()).then(setBotd).catch(console.error);
  }, [API]);

  return botd;
}
