#!/bin/bash
# Generate hero images for recipes using fal.ai Schnell model
# Uploads to Supabase Storage bucket "recipe-images"
#
# Usage: bash scripts/generate-images.sh
#
# Requires: FAL_KEY and SUPABASE vars in .env

set -e

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

FAL_KEY="${FAL_KEY}"
SUPABASE_URL="${EXPO_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${EXPO_PUBLIC_SUPABASE_ANON_KEY}"

if [ -z "$FAL_KEY" ] || [ -z "$SUPABASE_URL" ]; then
  echo "Error: Set FAL_KEY and EXPO_PUBLIC_SUPABASE_URL in .env"
  exit 1
fi

PROMPT_PREFIX="Professional overhead food photography of"
PROMPT_SUFFIX=", beautifully plated, moody lighting, dark background, cookbook style, high quality"

# Input: JSON file with array of { id, title } objects
INPUT_FILE="${1:-scripts/recipes-to-image.json}"

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file not found: $INPUT_FILE"
  echo "Create a JSON file with: [{\"id\": \"r1\", \"title\": \"Saag Paneer\", \"type\": \"recipe\"}]"
  exit 1
fi

TOTAL=$(python3 -c "import json; print(len(json.load(open('$INPUT_FILE'))))" 2>/dev/null || python -c "import json; print(len(json.load(open('$INPUT_FILE'))))")
echo "Generating images for $TOTAL items..."
echo ""

COUNT=0
ERRORS=0

# Process each item
python3 -c "
import json, sys
items = json.load(open('$INPUT_FILE'))
for item in items:
    print(json.dumps(item))
" 2>/dev/null | while IFS= read -r line; do
  ID=$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  TITLE=$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin)['title'])" 2>/dev/null)
  TYPE=$(echo "$line" | python3 -c "import json,sys; print(json.load(sys.stdin).get('type','recipe'))" 2>/dev/null)

  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $TITLE ($ID)"

  # Build prompt based on type
  if [ "$TYPE" = "cookbook" ]; then
    PROMPT="Professional cookbook cover design for '$TITLE', elegant food arrangement, moody lighting, dark background, premium cookbook style"
  else
    PROMPT="${PROMPT_PREFIX} ${TITLE}${PROMPT_SUFFIX}"
  fi

  # Generate image via fal.ai
  RESPONSE=$(curl -s -X POST "https://fal.run/fal-ai/flux-1/schnell" \
    -H "Authorization: Key $FAL_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$PROMPT\", \"image_size\": \"landscape_16_9\", \"num_images\": 1}")

  IMAGE_URL=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin)['images'][0]['url'])" 2>/dev/null)

  if [ -z "$IMAGE_URL" ] || [ "$IMAGE_URL" = "None" ]; then
    echo "  ERROR: Failed to generate image"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Download image
  TMP_FILE="/tmp/spicechef_${ID}.jpg"
  curl -s -o "$TMP_FILE" "$IMAGE_URL"

  # Upload to Supabase Storage
  STORAGE_PATH="images/${TYPE}s/${ID}.jpg"
  UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -X POST \
    "${SUPABASE_URL}/storage/v1/object/recipe-images/${STORAGE_PATH}" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: image/jpeg" \
    --data-binary @"$TMP_FILE")

  HTTP_CODE="${UPLOAD_RESPONSE: -3}"
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    PUBLIC_URL="${SUPABASE_URL}/storage/v1/object/public/recipe-images/${STORAGE_PATH}"
    echo "  OK: $PUBLIC_URL"
  else
    echo "  UPLOAD ERROR ($HTTP_CODE) — trying upsert..."
    # Try upsert if file exists
    UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -X PUT \
      "${SUPABASE_URL}/storage/v1/object/recipe-images/${STORAGE_PATH}" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "Content-Type: image/jpeg" \
      --data-binary @"$TMP_FILE")
    HTTP_CODE="${UPLOAD_RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
      echo "  OK (upserted)"
    else
      echo "  FAILED ($HTTP_CODE)"
      ERRORS=$((ERRORS + 1))
    fi
  fi

  rm -f "$TMP_FILE"

  # Small delay to avoid rate limits
  sleep 0.5
done

echo ""
echo "Done. Errors: $ERRORS"
