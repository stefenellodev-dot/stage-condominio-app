#!/usr/bin/env bash
# Ejecuta las pruebas RLS contra la base de datos de stage en piave.
# Uso: ./tests/rls/run.sh [archivo.sql]
set -euo pipefail

sql_file="${1:-tests/rls/rls-tests.sql}"
host="${HOST:-piave}"
container="${CONTAINER:-condo-sb-db}"

if [ ! -f "$sql_file" ]; then
  echo "ERROR: no existe $sql_file" >&2
  exit 1
fi

out=$(ssh "$host" "podman exec -i $container psql -U postgres -d postgres -v ON_ERROR_STOP=0 -At" < "$sql_file") || true
echo "$out"

pass=$(printf '%s\n' "$out" | grep -c '^PASS' || true)
fail=$(printf '%s\n' "$out" | grep -c '^FAIL' || true)
echo "----"
echo "TOTAL: pass=$pass fail=$fail"

if [ "$fail" -gt 0 ]; then
  exit 1
fi
