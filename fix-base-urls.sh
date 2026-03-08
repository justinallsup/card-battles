#!/bin/bash
# Replace all BASE_URL definitions with simple relative URLs

find apps/web/app -name "*.tsx" -type f -exec sed -i \
  "s|const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:[0-9]*/api/v1');|const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';|g" \
  {} \;

find apps/web/app -name "*.tsx" -type f -exec sed -i \
  "s|const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:[0-9]*/api/v1');|const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';|g" \
  {} \;

find apps/web/app -name "*.tsx" -type f -exec sed -i \
  "s|const BASE_URL_SEARCH = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:[0-9]*/api/v1');|const BASE_URL_SEARCH = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';|g" \
  {} \;

find apps/web/app -name "*.tsx" -type f -exec sed -i \
  "s|const API = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:[0-9]*/api/v1');|const API = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';|g" \
  {} \;

find apps/web/components -name "*.tsx" -type f -exec sed -i \
  "s|const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? \`\${window.location.origin}/api/v1\` : 'http://localhost:[0-9]*/api/v1');|const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';|g" \
  {} \;

echo "✅ Fixed all BASE_URL definitions to use relative URLs"
