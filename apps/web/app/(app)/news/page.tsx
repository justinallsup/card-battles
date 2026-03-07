'use client';
import { useState, useEffect } from 'react';
import { BackButton } from '../../../components/ui/BackButton';
import { ExternalLink } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333/api/v1';

type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  sport: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl: string;
};

const SPORTS = [
  { id: 'all', label: 'All', emoji: '🌐' },
  { id: 'nfl', label: 'NFL', emoji: '🏈' },
  { id: 'nba', label: 'NBA', emoji: '🏀' },
  { id: 'mlb', label: 'MLB', emoji: '⚾' },
  { id: 'wnba', label: 'WNBA', emoji: '🏀' },
];

const SPORT_COLORS: Record<string, string> = {
  nfl: '#22c55e',
  nba: '#f59e0b',
  mlb: '#3b82f6',
  wnba: '#ec4899',
  all: '#6c47ff',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h} hour${h === 1 ? '' : 's'} ago`;
  if (m > 0) return `${m} minute${m === 1 ? '' : 's'} ago`;
  return 'just now';
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const sportColor = SPORT_COLORS[article.sport] || SPORT_COLORS.all;

  return (
    <a
      href={article.url}
      className="block bg-[#12121a] rounded-xl border border-[#1e1e2e] hover:border-[#6c47ff]/40 transition-all p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-bold text-white leading-snug flex-1">{article.title}</h3>
        <ExternalLink size={13} className="text-[#374151] flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">{article.summary}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${sportColor}22`, color: sportColor, border: `1px solid ${sportColor}44` }}
          >
            {article.sport.toUpperCase()}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(108,71,255,0.12)', color: '#a78bfa', border: '1px solid rgba(108,71,255,0.25)' }}
          >
            {article.source}
          </span>
        </div>
        <span className="text-[10px] text-[#475569]">{timeAgo(article.publishedAt)}</span>
      </div>
    </a>
  );
}

export default function NewsPage() {
  const [sport, setSport] = useState('all');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = sport === 'all' ? `${API}/news` : `${API}/news?sport=${sport}`;
    fetch(url)
      .then(r => r.json())
      .then((d: { articles: NewsArticle[] }) => {
        setArticles(d.articles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sport]);

  return (
    <div className="space-y-4 pb-8">
      <BackButton />

      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-7 text-center"
        style={{
          background: 'linear-gradient(135deg, #0f0721 0%, #12121a 40%, #0a0a0f 100%)',
          border: '1px solid rgba(108, 71, 255, 0.2)',
        }}
      >
        <h1 className="text-2xl font-black text-white mb-1">📰 Card News</h1>
        <p className="text-sm text-[#64748b]">Latest sports card & collectibles news</p>
      </div>

      {/* Sport filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SPORTS.map(s => (
          <button
            key={s.id}
            onClick={() => setSport(s.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0"
            style={sport === s.id
              ? { background: 'rgba(108,71,255,0.15)', borderColor: '#6c47ff', color: '#a78bfa' }
              : { background: '#12121a', borderColor: '#1e1e2e', color: '#64748b' }
            }
          >
            <span>{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[#12121a] rounded-xl border border-[#1e1e2e] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          {articles.length === 0 && (
            <div className="text-center py-12 text-[#64748b]">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-white">No articles found</p>
              <p className="text-sm mt-1">Try a different sport filter</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center space-y-1 pt-4 border-t border-[#1e1e2e]">
        <p className="text-xs text-[#475569] font-semibold">Powered by Card Battles News Aggregator</p>
        <p className="text-[10px] text-[#374151]">Demo — showing curated sample articles</p>
      </div>
    </div>
  );
}
