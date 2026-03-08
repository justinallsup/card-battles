#!/bin/bash
# Fix all hardcoded localhost:3333 API URLs to use window.location.origin

FILES=(
  "apps/web/app/(app)/battles/[id]/page.tsx"
  "apps/web/app/(app)/create/page.tsx"
  "apps/web/app/(app)/profile/[username]/page.tsx"
  "apps/web/app/(app)/admin/page.tsx"
  "apps/web/app/(app)/pull-arena/page.tsx"
  "apps/web/app/(app)/pro/page.tsx"
  "apps/web/app/(app)/search/page.tsx"
  "apps/web/app/(app)/notifications/page.tsx"
  "apps/web/app/(app)/settings/page.tsx"
  "apps/web/app/(app)/onboarding/page.tsx"
  "apps/web/app/(app)/tournaments/page.tsx"
  "apps/web/app/(app)/collection/page.tsx"
  "apps/web/app/(app)/watchlist/page.tsx"
  "apps/web/app/(app)/history/page.tsx"
  "apps/web/app/(app)/grader/page.tsx"
  "apps/web/app/(app)/market/page.tsx"
  "apps/web/app/(app)/market/movers/page.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i "s|'http://localhost:3333/api/v1'|(typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:3333/api/v1')|g" "$file"
  fi
done

echo "Done! All files updated."
