import 'dotenv/config';
import { resolveEndedBattles } from './workers/battleResolution';
import { generateDailyBattles } from './workers/autoBattles';

console.log('[Worker] Card Battles worker started');

// Resolve ended battles every 60 seconds
async function runResolutionLoop() {
  while (true) {
    try {
      await resolveEndedBattles();
    } catch (err) {
      console.error('[Worker] Resolution loop error:', err);
    }
    await new Promise((r) => setTimeout(r, 60_000));
  }
}

// Generate battles 3x/day: 7am, 1pm, 7pm UTC
function scheduleAutoBattles() {
  const now = new Date();
  const hours = [7, 13, 19];

  for (const hour of hours) {
    const next = new Date();
    next.setUTCHours(hour, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    const delay = next.getTime() - now.getTime();

    setTimeout(async () => {
      await generateDailyBattles(10);
      // Re-schedule for next day
      setInterval(() => generateDailyBattles(10), 24 * 60 * 60 * 1000);
    }, delay);

    console.log(`[Worker] Auto-battles scheduled for ${next.toISOString()}`);
  }
}

runResolutionLoop();
scheduleAutoBattles();
