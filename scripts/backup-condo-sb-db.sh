#!/usr/bin/env bash
set -euo pipefail
umask 077

backup_dir="${BACKUP_DIR:-$HOME/stage-platform/backups/condo-sb-db}"
retention_days="${RETENTION_DAYS:-7}"
timestamp="$(date +%Y%m%d-%H%M%S)"
out="$backup_dir/condo-sb-db-$timestamp.dump"
tmp="$out.tmp"

mkdir -p "$backup_dir"
exec 9>"$backup_dir/.lock"
flock -n 9
trap 'rm -f "$tmp"' EXIT

podman exec condo-sb-db pg_dump -U postgres -d postgres -Fc > "$tmp"
mv "$tmp" "$out"
sha256sum "$out" > "$out.sha256"
sha256sum -c "$out.sha256" >/dev/null
find "$backup_dir" -maxdepth 1 -type f -name 'condo-sb-db-*.dump*' -mtime +"$retention_days" -delete
trap - EXIT
