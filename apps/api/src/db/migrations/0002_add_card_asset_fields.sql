-- Add grade and cert_number fields to card_assets table
ALTER TABLE "card_assets" ADD COLUMN "grade" varchar(30);
ALTER TABLE "card_assets" ADD COLUMN "cert_number" varchar(100);

-- Add index on player_name if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_card_assets_player_name" ON "card_assets" ("player_name");

-- Add index on year for faster filtering
CREATE INDEX IF NOT EXISTS "idx_card_assets_year" ON "card_assets" ("year");

-- Add index on source for filtering seeded vs uploaded
CREATE INDEX IF NOT EXISTS "idx_card_assets_source" ON "card_assets" ("source");
