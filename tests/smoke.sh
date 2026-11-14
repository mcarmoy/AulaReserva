#!/usr/bin/env bash
# Pruebas de humo de la API de AulaReserva.
# Adaptado a nuestra API: /api/aulas y /api/reservas devuelven directamente una lista JSON.
set -euo pipefail

BASE="${BASE_URL:-http://127.0.0.1:8000}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1. La API funciona
curl -fsS "$BASE/api/health" | php -r '$j=json_decode(stream_get_contents(STDIN),true);exit(($j["ok"]??false)?0:1);'

# 2. Hay al menos 3 aulas
curl -fsS "$BASE/api/aulas" | php -r '$j=json_decode(stream_get_contents(STDIN),true);exit(count($j)>=3?0:1);'

# 3. Crear una reserva -> 201
DATE="2030-06-15"
CODE=$(curl -sS -o "$TMP/creada.json" -w '%{http_code}' -X POST "$BASE/api/reservas" -H 'Content-Type: application/json' -d '{"aula_id":1,"fecha":"'"$DATE"'","hora":"10:00","responsable":"Prueba CI"}')
test "$CODE" = 201
ID=$(php -r '$j=json_decode(file_get_contents($argv[1]),true);echo $j["id"]??"";' "$TMP/creada.json")
test -n "$ID"

# 4. Reserva duplicada -> 409
CODE=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/api/reservas" -H 'Content-Type: application/json' -d '{"aula_id":1,"fecha":"'"$DATE"'","hora":"10:00","responsable":"Otra persona"}')
test "$CODE" = 409

# 5. La reserva aparece en el listado
curl -fsS "$BASE/api/reservas" | php -r '$j=json_decode(stream_get_contents(STDIN),true);exit(count($j)===1?0:1);'

# 6. Cancelar la reserva y comprobar que el listado queda vacío
curl -fsS -X DELETE "$BASE/api/reservas/$ID" | php -r '$j=json_decode(stream_get_contents(STDIN),true);exit(($j["mensaje"]??"")!==""?0:1);'
curl -fsS "$BASE/api/reservas" | php -r '$j=json_decode(stream_get_contents(STDIN),true);exit(count($j)===0?0:1);'

echo 'OK: aulas, alta, conflicto, consulta y cancelación'