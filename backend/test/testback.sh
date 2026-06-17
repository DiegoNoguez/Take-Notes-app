#!/bin/bash

# Configuración
BASE_URL="http://localhost:8000/api"
USER_EMAIL="test@test.com"
USER_PASS="123456"
USER_NAME="Test"
TOKEN=""
NOTE_ID=""
FAILED_TESTS=()

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

# Verificar jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq no está instalado. Instálalo con: sudo apt install jq (Linux) o brew install jq (Mac)${NC}"
    exit 1
fi

sleep 2

# Función para ejecutar un test
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_codes=$3
    local description=$4
    local data=$5
    local extra_headers=$6

    local full_url="${BASE_URL}${endpoint}"
    local curl_cmd="curl -s -w '%{http_code}' -X $method $full_url"

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi

    if [ -n "$extra_headers" ]; then
        curl_cmd="$curl_cmd $extra_headers"
    fi

    local response
    local http_code
    response=$(eval $curl_cmd 2>/dev/null)
    http_code="${response: -3}"
    body="${response:0:${#response}-3}"

    local success=false
    IFS=',' read -ra codes <<< "$expected_codes"
    for code in "${codes[@]}"; do
        if [ "$http_code" == "$code" ]; then
            success=true
            break
        fi
    done

    if [ "$success" = true ]; then
        echo -e "${GREEN}✅ $description (HTTP $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ $description (HTTP $http_code esperado: $expected_codes)${NC}"
        echo "Respuesta: $body"
        FAILED_TESTS+=("$description → HTTP $http_code")
    fi
    echo ""
}

# 1. Registrar usuario
echo -e "${YELLOW}📝 Registrando usuario...${NC}"
test_endpoint "POST" "/auth/register" "201,400" "Registro de usuario" '{"nombre":"'$USER_NAME'","email":"'$USER_EMAIL'","password":"'$USER_PASS'"}'

# 2. Login
echo -e "${YELLOW}🔐 Iniciando sesión...${NC}"
response=$(curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d '{"email":"'$USER_EMAIL'","password":"'$USER_PASS'"}')
http_code=$(echo "$response" | jq -r '.code' 2>/dev/null || echo "200")
if [ -z "$http_code" ] || [ "$http_code" = "null" ]; then
    http_code=200
fi
if [ "$http_code" = "200" ] || [ "$http_code" = "null" ]; then
    TOKEN=$(echo "$response" | jq -r '.token')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}✅ Login exitoso (HTTP 200)${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}❌ Login fallido: no se pudo extraer token${NC}"
        echo "Respuesta: $response"
        FAILED_TESTS+=("Login → sin token")
    fi
else
    echo -e "${RED}❌ Login fallido (HTTP $http_code)${NC}"
    echo "Respuesta: $response"
    FAILED_TESTS+=("Login → HTTP $http_code")
fi
echo ""

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ No se pudo obtener token. Deteniendo pruebas.${NC}"
    exit 1
fi

HEADER_AUTH="-H 'Authorization: Bearer $TOKEN'"

# 3. Obtener perfil
test_endpoint "GET" "/user/profile" "200" "Obtener perfil" "" "$HEADER_AUTH"

# 4. Actualizar perfil
test_endpoint "PUT" "/user/profile" "200" "Actualizar perfil" '{"nombre":"Test Actualizado","email":"'$USER_EMAIL'","notificaciones_activas":false}' "$HEADER_AUTH"

# 5. Cambiar contraseña (la dejamos igual)
test_endpoint "PUT" "/user/password" "200" "Cambiar contraseña" '{"old_password":"'$USER_PASS'","new_password":"'$USER_PASS'"}' "$HEADER_AUTH"

# 6. Crear nota (guardamos ID)
echo -e "${YELLOW}📝 Creando nota...${NC}"
response=$(curl -s -X POST "$BASE_URL/notes" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"titulo":"Nota de prueba","contenido":"Contenido en **Markdown**"}')
# Intentar extraer id_nota directamente
NOTE_ID=$(echo "$response" | jq -r '.id_nota' 2>/dev/null)
if [ -n "$NOTE_ID" ] && [ "$NOTE_ID" != "null" ]; then
    echo -e "${GREEN}✅ Nota creada (HTTP 201, ID: $NOTE_ID)${NC}"
    echo "$response" | jq '.'
else
    echo -e "${RED}❌ Error al crear nota: no se obtuvo ID${NC}"
    echo "Respuesta: $response"
    FAILED_TESTS+=("Crear nota → sin ID")
    NOTE_ID=1 # fallback para continuar
fi
echo ""

# 7. Listar notas
test_endpoint "GET" "/notes" "200" "Listar notas" "" "$HEADER_AUTH"

# 8. Obtener nota específica
test_endpoint "GET" "/notes/$NOTE_ID" "200" "Obtener nota" "" "$HEADER_AUTH"

# 9. Actualizar nota
test_endpoint "PUT" "/notes/$NOTE_ID" "200" "Actualizar nota" '{"titulo":"Nota editada","contenido":"Contenido actualizado"}' "$HEADER_AUTH"

# 10. Mover a papelera
test_endpoint "PUT" "/notes/$NOTE_ID" "200" "Mover a papelera" '{"papelera":true}' "$HEADER_AUTH"

# 11. Listar papelera
test_endpoint "GET" "/notes?trash=1" "200" "Listar papelera" "" "$HEADER_AUTH"

# 12. Restaurar nota
test_endpoint "PUT" "/notes/$NOTE_ID" "200" "Restaurar nota" '{"papelera":false}' "$HEADER_AUTH"

# ========== RECORDATORIOS (AHORA ANTES DE ELIMINAR) ==========
# 13. Recordatorio: crear/actualizar
test_endpoint "POST" "/notes/$NOTE_ID/reminder" "200" "Crear recordatorio" '{"fecha":"2025-12-31","hora":"23:59","mensaje":"Fin de año"}' "$HEADER_AUTH"

# 14. Obtener recordatorio
test_endpoint "GET" "/notes/$NOTE_ID/reminder" "200" "Obtener recordatorio" "" "$HEADER_AUTH"

# 15. Eliminar recordatorio
test_endpoint "DELETE" "/notes/$NOTE_ID/reminder" "204" "Eliminar recordatorio" "" "$HEADER_AUTH"

# ========== ELIMINACIÓN DE NOTA (AHORA AL FINAL) ==========
# 16. Eliminar nota definitivamente
test_endpoint "DELETE" "/notes/$NOTE_ID" "204" "Eliminar nota definitivamente" "" "$HEADER_AUTH"

# 17. Listar planes
test_endpoint "GET" "/plans" "200" "Listar planes" "" "$HEADER_AUTH"

# 18. Obtener suscripción activa
test_endpoint "GET" "/subscription/active" "200,404" "Obtener suscripción activa" "" "$HEADER_AUTH"

# 19. Crear sesión Stripe (puede dar 400 si no hay API key)
test_endpoint "POST" "/subscription/checkout" "200,400" "Crear sesión Stripe" '{"plan_id":2,"success_url":"http://localhost:5173/success","cancel_url":"http://localhost:5173/cancel"}' "$HEADER_AUTH"

# 20. Cancelar suscripción (puede dar 404 si no hay)
test_endpoint "DELETE" "/subscription/cancel" "200,404" "Cancelar suscripción" "" "$HEADER_AUTH"

# 21. Logs: listar
test_endpoint "GET" "/logs" "200" "Listar logs" "" "$HEADER_AUTH"

# 22. Logs: crear
test_endpoint "POST" "/logs" "201" "Crear log" '{"nombre":"Test de log"}' "$HEADER_AUTH"

# 23. Eliminar cuenta (peligroso, comentado)
# test_endpoint "DELETE" "/user/account" "204" "Eliminar cuenta" "" "$HEADER_AUTH"

# Resumen final
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}📊 RESUMEN DE PRUEBAS${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ ¡Todas las pruebas pasaron exitosamente!${NC}"
else
    echo -e "${RED}❌ Fallaron ${#FAILED_TESTS[@]} pruebas:${NC}"
    for fail in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}  - $fail${NC}"
    done
fi

unset TOKEN