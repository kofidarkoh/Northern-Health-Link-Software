#!/bin/bash
# NHLS database backup — dated mysqldump, prunes backups older than 14 days.
# Usage: ./backup.sh  (run from backend/ or repo root; mariadb-client required)
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then ENV_FILE=.env; else ENV_FILE=../.env; fi
get_var() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2-; }

HOST=$(get_var MYSQL_HOST); HOST=${HOST:-localhost}
PORT=$(get_var MYSQL_PORT); PORT=${PORT:-3306}
DB=$(get_var MYSQL_DATABASE); DB=${DB:-nhls_dev}
USER=$(get_var MYSQL_USER); USER=${USER:-root}
PASS=$(get_var MYSQL_PASSWORD)

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/${DB}_${STAMP}.sql.gz"

MYSQL_PWD="$PASS" mysqldump -h "$HOST" -P "$PORT" -u "$USER" \
  --single-transaction --routines --triggers "$DB" 2>/dev/null | gzip > "$OUT" \
  || MYSQL_PWD="$PASS" mariadb-dump -h "$HOST" -P "$PORT" -u "$USER" \
  --single-transaction --routines --triggers "$DB" 2>/dev/null | gzip > "$OUT"

echo "Backup written: $OUT ($(du -h "$OUT" | cut -f1))"
find "$BACKUP_DIR" -name "${DB}_*.sql.gz" -mtime +14 -delete
echo "Pruned backups older than 14 days."
