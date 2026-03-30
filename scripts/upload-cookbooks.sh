#!/bin/bash
# Reads all .json files from the cookbooks drop folder,
# uploads each to the admin endpoint, and moves processed files to /done.
#
# Usage: bash scripts/upload-cookbooks.sh
# Drop folder: C:\Users\v_gow\spicechef\cookbooks\

set -e

DROP_FOLDER="/c/Users/v_gow/spicechef/cookbooks"
DONE_FOLDER="${DROP_FOLDER}/done"
FAILED_FOLDER="${DROP_FOLDER}/failed"
SUPABASE_URL="https://quejhlzniodtcxfoslpi.supabase.co"
ADMIN_SECRET="725ed0683ab6918eeb01584e13931a80ca78a75de4d01144b79e72c0e148d3f4"

mkdir -p "$DONE_FOLDER" "$FAILED_FOLDER"

# Find all .json files in the drop folder (not in subfolders)
FILES=$(find "$DROP_FOLDER" -maxdepth 1 -name "*.json" -type f 2>/dev/null)

if [ -z "$FILES" ]; then
  echo "No cookbook files found in $DROP_FOLDER"
  exit 0
fi

SUCCESS=0
FAIL=0

for FILE in $FILES; do
  FILENAME=$(basename "$FILE")
  echo "Processing: $FILENAME"

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${SUPABASE_URL}/functions/v1/admin-add-cookbook" \
    -H "Content-Type: application/json" \
    -H "x-admin-secret: ${ADMIN_SECRET}" \
    -d @"$FILE")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ]; then
    echo "  Success: $BODY"
    mv "$FILE" "$DONE_FOLDER/$FILENAME"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "  Failed (HTTP $HTTP_CODE): $BODY"
    mv "$FILE" "$FAILED_FOLDER/$FILENAME"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Done. $SUCCESS uploaded, $FAIL failed."
