#!/bin/bash
# This script switches the Prisma provider between SQLite and PostgreSQL
# based on the DATABASE_URL environment variable.
# - If DATABASE_URL starts with "file:" → use SQLite (local dev)
# - If DATABASE_URL starts with "postgresql:" → use PostgreSQL (production)

SCHEMA="prisma/schema.prisma"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set, defaulting to SQLite"
  PROVIDER="sqlite"
elif [[ "$DATABASE_URL" == postgresql://* ]] || [[ "$DATABASE_URL" == postgres://* ]]; then
  echo "DATABASE_URL is PostgreSQL, switching provider"
  PROVIDER="postgresql"
else
  echo "DATABASE_URL is not PostgreSQL, using SQLite"
  PROVIDER="sqlite"
fi

# Always reset to a clean state first, then set the correct provider
sed -i 's/provider = "sqlite"/provider = "postgresql"/g' "$SCHEMA"
sed -i "s/provider = \"postgresql\"/provider = \"$PROVIDER\"/g" "$SCHEMA"

echo "Prisma provider set to: $PROVIDER"

# Generate the client directly (not via bun run to avoid circular calls)
npx prisma generate

# If PostgreSQL, push the schema
if [ "$PROVIDER" = "postgresql" ]; then
  echo "Pushing schema to PostgreSQL..."
  npx prisma db push --accept-data-loss
fi
