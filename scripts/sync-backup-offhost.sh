#!/usr/bin/env bash
set -euo pipefail
umask 077

# Copia off-host de backups de piave a esta Mac.
# Sincroniza: condo-sb-db (dumps Postgres) y vaultwarden (bóveda sqlite).
remote_host="${REMOTE_HOST:-piave}"
db_remote_dir="${REMOTE_DIR:-~/stage-platform/backups/condo-sb-db}"
vw_remote_dir="${VW_REMOTE_DIR:-~/stage-platform/backups/vaultwarden}"
db_local_dir="${LOCAL_DIR:-$HOME/Backups/condo-sb-db}"
vw_local_dir="${VW_LOCAL_DIR:-$HOME/Backups/vaultwarden}"
retention_days="${RETENTION_DAYS:-30}"
log_prefix="[sync-backup-offhost]"

mkdir -p "$db_local_dir" "$vw_local_dir"

sync_latest() {
  # $1 remote_dir $2 remote_glob $3 local_dir $4 kind_label
  local remote_dir_abs remote_dir="$1" remote_glob="$2" local_dir="$3" kind="$4"
  remote_dir_abs=${remote_dir/#\~/$remote_home}
  local latest
  latest=$(ssh "$remote_host" "ls -t '$remote_dir_abs'/$remote_glob 2>/dev/null | head -1" || true)
  if [ -z "$latest" ]; then
    echo "$log_prefix ERROR: no $kind backup found on $remote_host" >&2
    exit 1
  fi
  local name
  name=$(basename "$latest")

  scp -q "$remote_host:$latest" "$remote_host:$latest.sha256" "$local_dir/"

  local expected actual
  expected=$(cut -d' ' -f1 "$local_dir/$name.sha256")
  actual=$(shasum -a 256 "$local_dir/$name" | cut -d' ' -f1)
  if [ "$expected" != "$actual" ]; then
    rm -f "$local_dir/$name" "$local_dir/$name.sha256"
    echo "$log_prefix ERROR: checksum mismatch for $name, files removed" >&2
    exit 1
  fi

  find "$local_dir" -maxdepth 1 -type f -name "${name%%-[0-9]*}-*" -mtime +"$retention_days" -delete

  echo "$log_prefix OK: $kind -> $name copied and verified (sha256 $expected)"
}

remote_home=$(ssh "$remote_host" 'echo $HOME')

# Vaultwarden (bóveda): primera, es el dato más crítico nuevo
sync_latest "$vw_remote_dir" 'vaultwarden-*.sqlite3' "$vw_local_dir" 'vaultwarden'

# DB del stack condominio
sync_latest "$db_remote_dir" 'condo-sb-db-*.dump' "$db_local_dir" 'condo-sb-db'
