#!/usr/bin/env bash
set -euo pipefail
umask 077

remote_host="${REMOTE_HOST:-piave}"
remote_dir="${REMOTE_DIR:-~/stage-platform/backups/condo-sb-db}"
local_dir="${LOCAL_DIR:-$HOME/Backups/condo-sb-db}"
retention_days="${RETENTION_DAYS:-30}"
log_prefix="[sync-backup-offhost]"

mkdir -p "$local_dir"

remote_home=$(ssh "$remote_host" 'echo $HOME')
remote_dir_abs=${remote_dir/#\~/$remote_home}
latest=$(ssh "$remote_host" "ls -t '$remote_dir_abs'/condo-sb-db-*.dump 2>/dev/null | head -1" || true)
if [ -z "$latest" ]; then
  echo "$log_prefix ERROR: no dump found on $remote_host" >&2
  exit 1
fi
name=$(basename "$latest")

scp -q "$remote_host:$latest" "$remote_host:$latest.sha256" "$local_dir/"

expected=$(cut -d' ' -f1 "$local_dir/$name.sha256")
actual=$(shasum -a 256 "$local_dir/$name" | cut -d' ' -f1)
if [ "$expected" != "$actual" ]; then
  rm -f "$local_dir/$name" "$local_dir/$name.sha256"
  echo "$log_prefix ERROR: checksum mismatch for $name, files removed" >&2
  exit 1
fi

find "$local_dir" -maxdepth 1 -type f -name 'condo-sb-db-*.dump*' -mtime +"$retention_days" -delete

echo "$log_prefix OK: $name copied and verified (sha256 $expected)"
