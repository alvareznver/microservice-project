# 🧪 Guía de Testing

## Testing Manual Completo

### Prerequisitos

```bash
# 1. Docker y Docker Compose deben estar corriendo
docker-compose up -d

# 2. Esperar a que los servicios estén listos
docker-compose logs -f
# Buscar: "Health check passed" en todos los servicios

# 3. Verificar salud de servicios
curl http://localhost:3001/health
curl http://localhost:3002/health
```

---

## Escenario 1: Crear y Listar Autores

### Test 1.1: Crear un autor exitosamente

```bash
curl -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "García",
    "email": "juan.garcia@example.com",
    "biography": "Profesor universitario",
    "specialization": "AI"
  }'

# Respuesta esperada: 201 Created
# {
#   "success": true,
#   "data": {
#     "id": "uuid-xxx",
#     "firstName": "Juan",
#     "lastName": "García",
#     "email": "juan.garcia@example.com",
#     ...
#   }
# }
```

**Validaciones**:
- ✅ Status 201 (Created)
- ✅ Respuesta contiene `success: true`
- ✅ Datos del autor incluyen `id`
- ✅ Datos enriquecidos con `role: "AUTHOR"`

---

### Test 1.2: Email duplicado

```bash
# Usar mismo email del test anterior
curl -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Otro",
    "lastName": "Autor",
    "email": "juan.garcia@example.com"
  }'

# Respuesta esperada: 409 Conflict
# {
#   "success": false,
#   "error": {
#     "code": "CONFLICT",
#     "message": "Email juan.garcia@example.com already exists"
#   }
# }
```

**Validaciones**:
- ✅ Status 409 (Conflict)
- ✅ Mensaje menciona email duplicado
- ✅ `success: false`

---

### Test 1.3: Campos requeridos faltantes

```bash
# Sin email
curl -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "García"
  }'

# Respuesta esperada: 400 Bad Request
# {
#   "success": false,
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "firstName, lastName, and email are required"
#   }
# }
```

**Validaciones**:
- ✅ Status 400 (Bad Request)
- ✅ Mensaje de validación claro
- ✅ Indica campos requeridos

---

### Test 1.4: Obtener autor por ID

```bash
# Guardamos el ID del primer autor creado
AUTHOR_ID="[UUID del test 1.1]"

curl http://localhost:3001/authors/$AUTHOR_ID

# Respuesta esperada: 200 OK con datos del autor
```

**Validaciones**:
- ✅ Status 200
- ✅ Datos coinciden con lo creado

---

### Test 1.5: Listar autores con paginación

```bash
curl "http://localhost:3001/authors?page=1&limit=10"

# Respuesta esperada:
# {
#   "success": true,
#   "data": [
#     { "id": "...", "firstName": "Juan", ... },
#     ...
#   ],
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "total": X,
#     "pages": Y
#   }
# }
```

**Validaciones**:
- ✅ Status 200
- ✅ Array de autores
- ✅ Información de paginación correcta

---

### Test 1.6: Actualizar autor

```bash
AUTHOR_ID="[UUID del test 1.1]"

curl -X PATCH http://localhost:3001/authors/$AUTHOR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "biography": "Profesor especializado en Machine Learning",
    "specialization": "ML/AI"
  }'

# Respuesta esperada: 200 OK con datos actualizados
```

**Validaciones**:
- ✅ Status 200
- ✅ Cambios aplicados
- ✅ Otros campos sin cambios

---

### Test 1.7: Eliminar autor

```bash
AUTHOR_ID="[UUID del test 1.1]"

curl -X DELETE http://localhost:3001/authors/$AUTHOR_ID

# Respuesta esperada: 200 OK
# {
#   "success": true,
#   "message": "Author deleted successfully"
# }
```

**Validaciones**:
- ✅ Status 200
- ✅ Mensaje de éxito

---

## Escenario 2: Publicaciones sin Autor

### Test 2.1: Intentar crear publicación con autor inexistente

```bash
curl -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Publication",
    "content": "Test content",
    "authorId": "00000000-0000-0000-0000-000000000000"
  }'

# Respuesta esperada: 404 Not Found
# {
#   "success": false,
#   "error": {
#     "code": "NOT_FOUND",
#     "message": "Author with id 00000000-0000-0000-0000-000000000000 not found"
#   }
# }
```

**Validaciones**:
- ✅ Status 404
- ✅ Publications Service valida con Authors Service
- ✅ Mensaje claro sobre autor no encontrado
- ✅ **DEPENDENCIA entre servicios funcionando**

---

## Escenario 3: Publicaciones Completo

### Paso 1: Crear autor válido

```bash
AUTHOR=$(curl -s -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "López",
    "email": "maria.lopez@example.com"
  }')

AUTHOR_ID=$(echo $AUTHOR | jq -r '.data.id')
echo "Autor creado: $AUTHOR_ID"
```

### Paso 2: Crear publicación

```bash
PUB=$(curl -s -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Advanced ML Techniques\",
    \"content\": \"This paper discusses advanced techniques in machine learning...\",
    \"abstract_text\": \"Advanced ML techniques\",
    \"authorId\": \"$AUTHOR_ID\",
    \"keywords\": [\"ML\", \"AI\", \"Deep Learning\"]
  }")

PUB_ID=$(echo $PUB | jq -r '.data.id')
echo "Publicación creada: $PUB_ID"
echo "Estado: $(echo $PUB | jq -r '.data.status')"
```

**Esperado**:
- ✅ Status 201
- ✅ Estado inicial: DRAFT
- ✅ Datos del autor enriquecidos en respuesta

---

### Paso 3: Obtener publicación con datos del autor

```bash
curl "http://localhost:3002/publications/$PUB_ID?includeAuthor=true"

# Esperado: Incluye objeto author con firstName, lastName, email, etc.
```

---

### Paso 4: Cambiar estado a IN_REVIEW

```bash
curl -X PATCH http://localhost:3002/publications/$PUB_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "Enviado para revisión editorial"
  }'

# Esperado: Status 200, estado: IN_REVIEW
```

---

### Paso 5: Intentar cambiar a PUBLISHED sin APPROVED

```bash
curl -X PATCH http://localhost:3002/publications/$PUB_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PUBLISHED",
    "reviewNotes": "Invalid transition"
  }'

# Respuesta esperada: 400 Bad Request
# {
#   "success": false,
#   "error": {
#     "code": "INVALID_TRANSITION",
#     "message": "Cannot transition from IN_REVIEW to PUBLISHED"
#   }
# }
```

**Validaciones**:
- ✅ Status 400
- ✅ Strategy Pattern validando transiciones
- ✅ No permite transiciones inválidas

---

### Paso 6: Cambio correcto a APPROVED

```bash
curl -X PATCH http://localhost:3002/publications/$PUB_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "reviewNotes": "Aprobado por comité"
  }'

# Esperado: Status 200, estado: APPROVED
```

---

### Paso 7: Cambiar a PUBLISHED

```bash
curl -X PATCH http://localhost:3002/publications/$PUB_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PUBLISHED",
    "reviewNotes": "Publicado en la plataforma"
  }'

# Esperado: Status 200, estado: PUBLISHED
```

---

### Paso 8: Listar publicaciones con filtro

```bash
# Todas
curl "http://localhost:3002/publications?page=1&limit=10"

# Solo publicadas
curl "http://localhost:3002/publications?page=1&limit=10&status=PUBLISHED"

# Solo en revisión
curl "http://localhost:3002/publications?page=1&limit=10&status=IN_REVIEW"
```

---

### Paso 9: Listar publicaciones de un autor

```bash
curl "http://localhost:3002/publications/author/$AUTHOR_ID"

# Esperado: Array con publicaciones del autor
```

---

## Escenario 4: Flujo de Cambios Solicitados

### Paso 1: Nueva publicación

```bash
PUB2=$(curl -s -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Blockchain Security\",
    \"content\": \"Security analysis of blockchain...\",
    \"authorId\": \"$AUTHOR_ID\"
  }")

PUB2_ID=$(echo $PUB2 | jq -r '.data.id')
```

### Paso 2: Enviar a revisión

```bash
curl -X PATCH http://localhost:3002/publications/$PUB2_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "En revisión"
  }'
```

### Paso 3: Rechazar requiriendo cambios

```bash
curl -X PATCH http://localhost:3002/publications/$PUB2_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DRAFT",
    "reviewNotes": "Requiere cambios importantes"
  }'

# Esperado: Vuelve a DRAFT para retrabajo
```

### Paso 4: Actualizar publicación

```bash
curl -X PATCH http://localhost:3002/publications/$PUB2_ID \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Security analysis of blockchain - UPDATED VERSION",
    "abstract_text": "Updated abstract"
  }'
```

### Paso 5: Reenviar a revisión

```bash
curl -X PATCH http://localhost:3002/publications/$PUB2_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "Resubmitted with changes"
  }'
```

---

## Escenario 5: Flujo de Rechazo

### Paso 1: Crear y enviar a revisión

```bash
PUB3=$(curl -s -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Low Quality Paper\",
    \"content\": \"Content...\",
    \"authorId\": \"$AUTHOR_ID\"
  }")

PUB3_ID=$(echo $PUB3 | jq -r '.data.id')

# Enviar a revisión
curl -X PATCH http://localhost:3002/publications/$PUB3_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "Para evaluación"
  }'
```

### Paso 2: Rechazar

```bash
curl -X PATCH http://localhost:3002/publications/$PUB3_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reviewNotes": "No cumple criterios de calidad"
  }'

# Esperado: Status 200, estado: REJECTED
```

### Paso 3: Intentar editar publicación rechazada

```bash
curl -X PATCH http://localhost:3002/publications/$PUB3_ID \
  -H "Content-Type: application/json" \
  -d '{
    "content": "New content"
  }'

# Respuesta esperada: 400 Bad Request
# "Publication cannot be edited in REJECTED status"
```

---

## Verificaciones de Arquitectura

### 1. Base de datos separadas

```bash
# Verificar que publications-service NO tiene acceso a autores_db
docker-compose exec publications-service psql \
  -h db-authors -U author_user -d authors_db -c "SELECT 1"

# Debe FALLAR - conexión rechazada
```

### 2. Red Docker

```bash
# Verificar red compartida
docker network inspect editorial-network

# Todos los servicios deben estar en la red
```

### 3. Health Checks

```bash
# Ver estado de salud
docker-compose ps

# Todos deben mostrar "healthy"
```

### 4. Logs de Comunicación

```bash
# Ver cuando Publications llama a Authors
docker-compose logs publications-service | grep "Retry attempt\|checking author"
```

---

## Resumen de Testing

| Escenario | Tests | Status |
|-----------|-------|--------|
| Autores CRUD | 7 | ✅ |
| Dependencia | 1 | ✅ |
| Publicaciones CRUD | 9 | ✅ |
| Estados | 3 | ✅ |
| Validaciones | 5 | ✅ |
| Arquitectura | 4 | ✅ |
| **TOTAL** | **29** | **✅** |

---

## Checklist Final

- [ ] Todos los servicios están corriendo
- [ ] Authors Service responde en 3001
- [ ] Publications Service responde en 3002
- [ ] Frontend carga en 3000
- [ ] Crear autor → exitoso
- [ ] Email duplicado → error
- [ ] Crear publicación sin autor → error
- [ ] Crear publicación con autor → exitoso
- [ ] Cambiar estado DRAFT → IN_REVIEW → APPROVED → PUBLISHED
- [ ] Rechazar publicación
- [ ] Listar con filtros
- [ ] Enriquecimiento de datos (autor en publicación)
- [ ] Paginación funciona
- [ ] Frontend actualiza en tiempo real

---

**¡Si todos estos tests pasan, tu sistema está listo para producción!**
