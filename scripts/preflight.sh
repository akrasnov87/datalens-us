#!/bin/sh
set -e

if [ "${SKIP_INSTALL_DB_EXTENSIONS}" = "1" ]; then
  echo '{"level":"INFO","msg":"Skip extensions setting up"}'
else
  echo '{"level":"INFO","msg":"Start setting up extensions"}'
  node /opt/app/dist/server/db/scripts/extensions.js
  echo '{"level":"INFO","msg":"Finish setting up extensions"}'
fi

if [ "${USE_AUTH_DATA}" = "1" ]; then
  echo '{"level":"INFO","msg":"Start auth demo data"}'
  node /opt/app/dist/server/db/scripts/demo/auth.js
  echo '{"level":"INFO","msg":"Finish auth demo data"}'
else
  echo '{"level":"INFO","msg":"Skip auth demo data"}'
fi

echo '{"level":"INFO","msg":"Start migration"}'
npm run db:migrate
echo '{"level":"INFO","msg":"Finish migration"}'

exec 'node' 'dist/server'
