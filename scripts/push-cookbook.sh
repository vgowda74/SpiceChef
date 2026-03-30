#!/bin/bash
# Usage: ./scripts/push-cookbook.sh path/to/cookbook.json
#
# The JSON file should have this shape:
# {
#   "cookbook": { "title": "My Cookbook", "author": "Author Name" },
#   "recipes": [
#     {
#       "title": "Recipe Name",
#       "base_serves": 4,
#       "duration_mins": 30,
#       "tags": ["Vegetarian"],
#       "ingredients": [{ "name": "...", "amount": 2, "unit": "tbsp", "category": "PRODUCE" }],
#       "steps": [{ "order": 1, "title": "...", "text": "...", "timer_seconds": 300, "timer_label": "..." }]
#     }
#   ]
# }

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <cookbook.json>"
  exit 1
fi

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}"
ADMIN_SECRET="${ADMIN_SECRET}"

if [ -z "$SUPABASE_URL" ] || [ -z "$ADMIN_SECRET" ]; then
  echo "Error: Set EXPO_PUBLIC_SUPABASE_URL and ADMIN_SECRET in .env"
  exit 1
fi

echo "Pushing cookbook from $1..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${SUPABASE_URL}/functions/v1/admin-add-cookbook" \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: ${ADMIN_SECRET}" \
  -d @"$1")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "Success! $BODY"
else
  echo "Failed (HTTP $HTTP_CODE): $BODY"
  exit 1
fi
