'use client';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Trophy, X } from 'lucide-react';
import { showToast } from '../../../components/ui/Toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

interface FlipCard {
  id: string;
  playerName: string;
  imageUrl: string;
  sport: string;
}

interface GameData {
  gameId: string;
  cards: FlipCard[];
  answerId: string;
  values: { id: string; value: number }[];
}

interface GameResult {
  correct: boolean;
  answerId: string;
  values: { id: string; value: number }[];
  message: string;
}

type GameState = 'loading' | 'guessing' | 'revealing' | 'revealed' | 'error';

const SPORT_COLORS: Record<string, string> = {
  nfl: '#ef4444',
  nba: '#f59e0b',
  mlb: '#22c55e',
  nhl: '#3b82f6',
  soccer: '#6c47ff',
};

function getSportLabel(sport: string) {
  const labels: Record<string, string> = { nfl: '🏈 NFL', nba: '🏀 NBA', mlb: '⚾ MLB', nhl: '🏒 NHL', soccer: '⚽ Soccer' };
  return labels[sport] || sport?.toUpperCase() || '🃏';
}

function CardBack() {
  return (
    <div
      className="w-full h-full rounded-2xl flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #2a1a4a 50%, #1a1030 100%)', border: '2px solid #6c47ff55' }}
    >
      <div className="text-center">
        <div style={{ fontSize: 48 }}>🎴</div>
        <p className="text-[#6c47ff] text-sm font-bold mt-2">TAP TO GUESS</p>
      </div>
    </div>
  );
}

function CardFront({ card, value, isWinner, isRevealing }: { card: FlipCard; value: number; isWinner: boolean; isRevealing: boolean }) {
  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden relative"
      style={{
        border: isWinner ? '2px solid #22c55e' : '2px solid #ef444455',
        boxShadow: isWinner ? '0 0 20px #22c55e55' : 'none',
        background: '#0a0a0f',
      }}
    >
      {card.imageUrl && (
        <img
          src={card.imageUrl}
          alt={card.playerName}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div
        className="absolute inset-0 flex flex-col justify-end p-3"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
      >
        <div
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1 w-fit"
          style={{ background: SPORT_COLORS[card.sport] || '#6c47ff', color: 'white' }}
        >
          {getSportLabel(card.sport)}
        </div>
        <p className="text-white font-black text-sm leading-tight">{card.playerName}</p>
        <p className="text-[#22c55e] font-black text-lg">${value.toLocaleString()}</p>
        <p className="text-[#64748b] text-[10px]">PSA 10 est.</p>
      </div>
      {isWinner && (
        <div className="absolute top-2 right-2 bg-[#22c55e] rounded-full p-1">
          <Trophy size={14} className="text-white" />
        </div>
      )}
    </div>
  );
}

export default function FlipGamePage() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState<GameState>('loading');
  const [result, setResult] = useState<GameResult | null>(null);
  const [flipped, setFlipped] = useState([false, false]);
  const [guessedIdx, setGuessedIdx] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    document.title = '🎴 Flip Game | Card Battles';
    // Load score from localStorage
    try {
      const saved = localStorage.getItem('flipgame-score');
      if (saved) setScore(JSON.parse(saved));
    } catch {}
  }, []);

  const saveScore = useCallback((newScore: { correct: number; total: number }) => {
    try {
      localStorage.setItem('flipgame-score', JSON.stringify(newScore));
    } catch {}
  }, []);

  const fetchGame = useCallback(async () => {
    setGameState('loading');
    setResult(null);
    setFlipped([false, false]);
    setGuessedIdx(null);
    try {
      const res = await fetch(`${BASE_URL}/flip-game`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGameData(data);
      setGameState('guessing');
    } catch {
      setGameState('error');
    }
  }, []);

  useEffect(() => { fetchGame(); }, [fetchGame]);

  const handleGuess = async (idx: number) => {
    if (!gameData || gameState !== 'guessing') return;
    setGuessedIdx(idx);
    setGameState('revealing');

    const guess = gameData.cards[idx].id;
    try {
      const res = await fetch(`${BASE_URL}/flip-game/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: gameData.gameId, guess, answerId: gameData.answerId, values: gameData.values }),
      });
      const data: GameResult = await res.json();
      setResult(data);

      // Flip both cards with slight delay between them
      setTimeout(() => setFlipped([true, false]), 100);
      setTimeout(() => setFlipped([true, true]), 400);
      setTimeout(() => {
        setGameState('revealed');
        const newScore = { correct: score.correct + (data.correct ? 1 : 0), total: score.total + 1 };
        setScore(newScore);
        saveScore(newScore);
        if (data.correct) {
          showToast('🎉 Correct! Great eye!', 'success');
        } else {
          showToast('❌ Not quite — check the values!', 'error');
        }
      }, 800);
    } catch {
      setGameState('error');
    }
  };

  const getCardValue = (cardId: string) => {
    return gameData?.values.find(v => v.id === cardId)?.value ?? 0;
  };

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            🎴 Flip Game
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">Which card is worth more?</p>
        </div>
        {/* Score */}
        <div className="text-right">
          <p className="text-white font-black text-lg">{score.correct}/{score.total}</p>
          <p className="text-[#64748b] text-xs">{accuracy}% accuracy</p>
        </div>
      </div>

      {/* Score bar */}
      {score.total > 0 && (
        <div className="rounded-xl border border-[#1e1e2e] p-3 flex items-center gap-3" style={{ background: '#12121a' }}>
          <Trophy size={16} className="text-[#f59e0b] flex-shrink-0" />
          <div className="flex-1">
            <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${accuracy}%`, background: accuracy >= 60 ? '#22c55e' : '#ef4444' }}
              />
            </div>
          </div>
          <p className="text-white text-sm font-bold">{accuracy}%</p>
        </div>
      )}

      {/* Game area */}
      {gameState === 'error' && (
        <div className="text-center py-12">
          <p className="text-[#64748b] mb-4">Failed to load game</p>
          <button onClick={fetchGame} className="px-6 py-3 rounded-xl bg-[#6c47ff] text-white font-bold">Try Again</button>
        </div>
      )}

      {(gameState === 'loading') && (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">🎴</div>
          <p className="text-[#64748b]">Shuffling cards...</p>
        </div>
      )}

      {gameData && gameState !== 'loading' && gameState !== 'error' && (
        <>
          {/* Instruction */}
          <div className="text-center">
            {gameState === 'guessing' && (
              <p className="text-[#94a3b8] text-sm font-semibold">👇 Tap the card you think is worth more</p>
            )}
            {(gameState === 'revealing' || gameState === 'revealed') && result && (
              <div className={`text-lg font-black ${result.correct ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {result.message}
              </div>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-2 gap-4">
            {gameData.cards.map((card, idx) => {
              const isWinner = result ? card.id === result.answerId : false;
              const cardValue = getCardValue(card.id);

              return (
                <button
                  key={card.id}
                  onClick={() => handleGuess(idx)}
                  disabled={gameState !== 'guessing'}
                  className="relative focus:outline-none"
                  style={{ perspective: '1000px', height: 280 }}
                >
                  {/* Flip container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s ease',
                      transform: flipped[idx] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Back face */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
                      <CardBack />
                    </div>
                    {/* Front face */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <CardFront card={card} value={cardValue} isWinner={isWinner} isRevealing={gameState === 'revealing'} />
                    </div>
                  </div>

                  {/* Hover ring for guessing state */}
                  {gameState === 'guessing' && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent hover:border-[#6c47ff] transition-all pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* VS divider */}
          <div className="text-center -mt-2">
            <span className="text-[#6c47ff] font-black text-xl">VS</span>
          </div>

          {/* Next round button */}
          {gameState === 'revealed' && (
            <button
              onClick={fetchGame}
              className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6c47ff 0%, #9b7aff 100%)' }}
            >
              <RefreshCw size={18} />
              Next Round
            </button>
          )}
        </>
      )}

      {/* Reset score */}
      {score.total > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              const newScore = { correct: 0, total: 0 };
              setScore(newScore);
              saveScore(newScore);
            }}
            className="text-[#64748b] text-xs flex items-center gap-1 mx-auto hover:text-[#94a3b8] transition-colors"
          >
            <X size={12} /> Reset score
          </button>
        </div>
      )}
    </div>
  );
}
