const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function trackSponsorClick(battleId: string, destinationUrl: string): Promise<void> {
  try {
    await fetch(`${API}/analytics/sponsor-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ battleId, destinationUrl }),
      keepalive: true, // fires even if page unloads
    });
  } catch {
    // Non-blocking — never throw
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  // PostHog or custom analytics
  if (typeof window !== 'undefined' && (window as unknown as { posthog?: { capture: (n: string, p?: unknown) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (n: string, p?: unknown) => void } }).posthog.capture(name, properties);
  }
}
