#!/bin/bash

# Script para poblar datos de ejemplo en los servicios
# Uso: ./init-data.sh

set -e

BASE_URL_AUTHORS="http://localhost:3001"
BASE_URL_PUBLICATIONS="http://localhost:3002"

echo "🚀 Iniciando poblado de datos de ejemplo..."

# Esperar que los servicios estén listos
echo "⏳ Esperando que los servicios estén disponibles..."
for i in {1..30}; do
  if curl -s "$BASE_URL_AUTHORS/health" > /dev/null 2>&1; then
    echo "✅ Authors Service disponible"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Authors Service no disponible"
    exit 1
  fi
  sleep 1
done

for i in {1..30}; do
  if curl -s "$BASE_URL_PUBLICATIONS/health" > /dev/null 2>&1; then
    echo "✅ Publications Service disponible"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Publications Service no disponible"
    exit 1
  fi
  sleep 1
done

echo ""
echo "📝 Creando autores de ejemplo..."

# Crear autor 1
AUTHOR1=$(curl -s -X POST "$BASE_URL_AUTHORS/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Martínez",
    "email": "juan.martinez@university.edu",
    "biography": "Profesor investigador en Inteligencia Artificial y Machine Learning",
    "specialization": "AI/ML"
  }' | jq -r '.data.id')

echo "✅ Autor 1 creado: $AUTHOR1 (Juan Martínez)"

# Crear autor 2
AUTHOR2=$(curl -s -X POST "$BASE_URL_AUTHORS/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "García",
    "email": "maria.garcia@university.edu",
    "biography": "Investigadora en Computación Científica y HPC",
    "specialization": "Scientific Computing"
  }' | jq -r '.data.id')

echo "✅ Autor 2 creado: $AUTHOR2 (María García)"

# Crear autor 3
AUTHOR3=$(curl -s -X POST "$BASE_URL_AUTHORS/authors" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Carlos",
    "lastName": "López",
    "email": "carlos.lopez@university.edu",
    "biography": "Especialista en Ciberseguridad y Redes",
    "specialization": "Cybersecurity"
  }' | jq -r '.data.id')

echo "✅ Autor 3 creado: $AUTHOR3 (Carlos López)"

echo ""
echo "📚 Creando publicaciones de ejemplo..."

# Publicación 1 - DRAFT
PUB1=$(curl -s -X POST "$BASE_URL_PUBLICATIONS/publications" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Deep Learning for Image Recognition\",
    \"content\": \"This paper presents a comprehensive study of deep learning techniques applied to image recognition tasks. We evaluate various CNN architectures and their performance metrics.\",
    \"abstract_text\": \"A study of deep learning applications in image recognition\",
    \"authorId\": \"$AUTHOR1\",
    \"keywords\": [\"deep learning\", \"CNN\", \"image recognition\", \"AI\"]
  }" | jq -r '.data.id')

echo "✅ Publicación 1 creada: $PUB1 (DRAFT)"

# Publicación 2 - IN_REVIEW
PUB2=$(curl -s -X POST "$BASE_URL_PUBLICATIONS/publications" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Parallel Computing for Scientific Applications\",
    \"content\": \"This research explores the use of parallel computing techniques to accelerate scientific simulations. We benchmark various HPC frameworks on distributed systems.\",
    \"abstract_text\": \"Parallel computing optimization for scientific computing\",
    \"authorId\": \"$AUTHOR2\",
    \"keywords\": [\"HPC\", \"parallel computing\", \"scientific computing\"]
  }" | jq -r '.data.id')

echo "✅ Publicación 2 creada: $PUB2 (DRAFT)"

# Cambiar a IN_REVIEW
curl -s -X PATCH "$BASE_URL_PUBLICATIONS/publications/$PUB2/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "Enviado para revisión editorial"
  }' > /dev/null

echo "   └─ Cambio de estado: DRAFT → IN_REVIEW"

# Publicación 3 - PUBLISHED
PUB3=$(curl -s -X POST "$BASE_URL_PUBLICATIONS/publications" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Blockchain Security: A Comprehensive Review\",
    \"content\": \"This comprehensive review examines the security implications of blockchain technology. We analyze common vulnerabilities and propose mitigation strategies.\",
    \"abstract_text\": \"Security analysis of blockchain systems\",
    \"authorId\": \"$AUTHOR3\",
    \"keywords\": [\"blockchain\", \"security\", \"cryptography\"]
  }" | jq -r '.data.id')

echo "✅ Publicación 3 creada: $PUB3 (DRAFT)"

# Cambiar a IN_REVIEW
curl -s -X PATCH "$BASE_URL_PUBLICATIONS/publications/$PUB3/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "En revisión del comité académico"
  }' > /dev/null

echo "   └─ Cambio de estado: DRAFT → IN_REVIEW"

# Cambiar a APPROVED
curl -s -X PATCH "$BASE_URL_PUBLICATIONS/publications/$PUB3/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "reviewNotes": "Aprobado por el comité de revisión"
  }' > /dev/null

echo "   └─ Cambio de estado: IN_REVIEW → APPROVED"

# Cambiar a PUBLISHED
curl -s -X PATCH "$BASE_URL_PUBLICATIONS/publications/$PUB3/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PUBLISHED",
    "reviewNotes": "Publicado en la plataforma"
  }' > /dev/null

echo "   └─ Cambio de estado: APPROVED → PUBLISHED"

echo ""
echo "📊 Resumen de datos creados:"
echo "────────────────────────────────────"
echo "✅ Autores creados: 3"
echo "✅ Publicaciones creadas: 3"
echo "   - DRAFT: 1 ($PUB1)"
echo "   - IN_REVIEW: 1 ($PUB2)"
echo "   - PUBLISHED: 1 ($PUB3)"
echo ""
echo "🎉 ¡Datos de ejemplo poblados exitosamente!"
echo ""
echo "📍 Accede a la aplicación:"
echo "   Frontend: http://localhost:3000"
echo "   Authors API: http://localhost:3001"
echo "   Publications API: http://localhost:3002"
