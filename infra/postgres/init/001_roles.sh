#!/bin/sh
set -eu

: "${API_DB_PASSWORD:?}"
: "${COLLECTOR_DB_PASSWORD:?}"
: "${ORCHESTRATOR_DB_PASSWORD:?}"

psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     --set api_pw="$API_DB_PASSWORD" \
     --set collector_pw="$COLLECTOR_DB_PASSWORD" \
     --set orchestrator_pw="$ORCHESTRATOR_DB_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', r.name, r.pw)
FROM (VALUES ('svc_api',          :'api_pw'),
             ('svc_collector',    :'collector_pw'),
             ('svc_orchestrator', :'orchestrator_pw')) AS r(name, pw)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.name)
\gexec
SQL
