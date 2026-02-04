# 📚 Editorial Management System - Microservicios

Sistema de gestión editorial basado en arquitectura de microservicios con dos servicios independientes: **Authors Service** y **Publications Service**. Incluye frontend web, modelado BPMN del proceso editorial y orquestación con Docker Compose.

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Arquitectura](#arquitectura)
3. [Requisitos Previos](#requisitos-previos)
4. [Instalación y Ejecución](#instalación-y-ejecución)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Microservicios](#microservicios)
7. [Frontend](#frontend)
8. [Modelado BPMN](#modelado-bpmn)
9. [Patrones de Diseño](#patrones-de-diseño)
10. [Principios SOLID](#principios-solid)
11. [Testing](#testing)
12. [Documentación API](#documentación-api)

## 🎯 Descripción del Proyecto

Este proyecto implementa una solución de gestión editorial moderna que permite:

- ✅ Administrar autores (crear, leer, actualizar, eliminar)
- ✅ Administrar publicaciones con estados editoriales
- ✅ Validación de dependencias entre servicios (Publications → Authors)
- ✅ Gestión de flujo editorial completo
- ✅ Interfaz web intuitiva con React
- ✅ Modelado y simulación del proceso en BPMN

### Criterios de Ingeniería de Software Implementados

- **Principios SOLID**: Separación de responsabilidades, inversión de dependencias
- **Patrones de Diseño**: Repository, Factory, Strategy, Adapter, Facade, Mapper
- **Arquitectura por Capas**: Controller → Service → Repository → Entity
- **DTOs**: Desacoplamiento entre entidades y presentación
- **Manejo de Errores**: Validación centralizada y consistente
- **Pruebas**: Health checks y validación de endpoints
- **Despliegue**: Docker Compose con múltiples contenedores

## 🏗️ Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              (React + Vite + Axios)                 │
│                  Puerto: 3000                       │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼──────────┐       ┌──────▼──────┐
    │   Authors    │       │ Publications│
    │   Service    │       │   Service   │
    │ Puerto: 3001 │       │ Puerto: 3002│
    └───┬──────────┘       └──────┬──────┘
        │                         │
        │    Dependencia →────────┘
        │
    ┌───┴──────────┐       ┌──────────────┐
    │ PostgreSQL   │       │  PostgreSQL  │
    │  Authors DB  │       │ Publications │
    │ Puerto: 5432 │       │   DB         │
    └──────────────┘       │ Puerto: 5433 │
                           └──────────────┘
```

### Flujo de Datos

1. **Frontend**: Usuario interactúa con React UI
2. **API REST**: Requests HTTP a microservicios
3. **Authors Service**: Gestiona datos de autores en PostgreSQL
4. **Publications Service**: 
   - Gestiona publicaciones
   - Valida existencia de autor (llamada HTTP a Authors Service)
   - Enriquece datos con información del autor
5. **Persistencia**: Dos bases de datos separadas

## 🔧 Requisitos Previos

- **Docker**: v20.10+
- **Docker Compose**: v1.29+
- **Windows/Linux/macOS**: Sistema operativo compatible con Docker
- **Puerto disponibles**: 3000, 3001, 3002, 5432, 5433

### Verificar instalación

```bash
docker --version
docker-compose --version
```

## 🚀 Instalación y Ejecución

### Opción 1: Con Docker Compose (Recomendado)

#### Paso 1: Clonar/Descargar el proyecto

```bash
cd microservices-project
```

#### Paso 2: Configurar variables de entorno (Opcional)

Las configuraciones por defecto están en `.env`. Para cambiar:

```bash
# Windows (PowerShell)
$env:NODE_ENV = "production"

# Linux/macOS
export NODE_ENV=production
```

#### Paso 3: Construir y ejecutar

```bash
# Construir imágenes Docker
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver estado de servicios
docker-compose ps
```

#### Paso 4: Verificar servicios

```bash
# Authors Service
curl http://localhost:3001/health

# Publications Service
curl http://localhost:3002/health

# Frontend
http://localhost:3000 (en navegador)
```

#### Paso 5: Detener servicios

```bash
docker-compose down

# Con limpieza completa
docker-compose down -v
```

### Opción 2: Ejecución Local (Sin Docker)

Requiere Node.js 18+ y PostgreSQL instalados localmente.

```bash
# Authors Service
cd authors-service
npm install
npm run build
npm start

# Publications Service (en otra terminal)
cd publications-service
npm install
npm run build
npm start

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## 📁 Estructura del Proyecto

```
microservices-project/
├── authors-service/
│   ├── src/
│   │   ├── entity/
│   │   │   └── Author.ts          # Entidades (abstracta + derivada)
│   │   ├── repository/
│   │   │   └── AuthorRepository.ts  # Patrón Repository
│   │   ├── service/
│   │   │   └── AuthorService.ts     # Lógica de negocio
│   │   ├── controller/
│   │   │   └── AuthorController.ts  # Presentación HTTP
│   │   ├── dto/
│   │   │   └── AuthorDTO.ts         # Data Transfer Objects
│   │   ├── util/
│   │   │   ├── AuthorMapper.ts      # Patrón Mapper
│   │   │   └── errors.ts            # Manejo de errores
│   │   ├── config/
│   │   │   └── database.ts          # Configuración BD
│   │   └── index.ts                 # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── publications-service/
│   ├── src/
│   │   ├── entity/
│   │   │   └── Publication.ts       # Entidades (abstracta + derivada)
│   │   ├── repository/
│   │   │   └── PublicationRepository.ts
│   │   ├── service/
│   │   │   └── PublicationService.ts
│   │   ├── controller/
│   │   │   └── PublicationController.ts
│   │   ├── dto/
│   │   │   └── PublicationDTO.ts
│   │   ├── client/
│   │   │   └── AuthorsServiceClient.ts # Comunicación HTTP
│   │   ├── util/
│   │   │   ├── StateValidators.ts  # Patrón Strategy
│   │   │   ├── PublicationMapper.ts
│   │   │   └── errors.ts
│   │   ├── config/
│   │   │   └── database.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Alert.jsx
│   │   ├── pages/
│   │   │   ├── AuthorsList.jsx
│   │   │   └── PublicationsList.jsx
│   │   ├── services/
│   │   │   └── api.js              # Cliente API
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
│
├── bpmn-models/
│   ├── publication-process.bpmn    # Modelo BPMN
│   └── README_BPMN.md              # Documentación BPMN
│
├── docker-compose.yml              # Orquestación
├── .env                            # Variables de entorno
└── README.md                       # Este archivo
```

## 🔌 Microservicios

### 1. Authors Service

**Puerto**: 3001  
**Base de datos**: PostgreSQL (puerto 5432)

#### Endpoints

```
POST   /authors                    Crear autor
GET    /authors/:id                Obtener autor por ID
GET    /authors                    Listar autores (con paginación)
PATCH  /authors/:id                Actualizar autor
DELETE /authors/:id                Eliminar autor
GET    /health                     Health check
```

#### Ejemplo de Requests

```bash
# Crear autor
curl -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "biography": "Docente universitario",
    "specialization": "Inteligencia Artificial"
  }'

# Obtener autor
curl http://localhost:3001/authors/[ID]

# Listar autores
curl http://localhost:3001/authors?page=1&limit=10
```

#### Estructura de Respuesta

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "biography": "Docente universitario",
    "specialization": "Inteligencia Artificial",
    "isActive": true,
    "role": "AUTHOR",
    "fullName": "Juan Pérez",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Publications Service

**Puerto**: 3002  
**Base de datos**: PostgreSQL (puerto 5433)  
**Dependencia**: Authors Service (http://authors-service:3001)

#### Endpoints

```
POST   /publications                      Crear publicación
GET    /publications/:id                  Obtener publicación
GET    /publications                      Listar publicaciones (con filtros)
GET    /publications/author/:authorId     Listar por autor
PATCH  /publications/:id                  Actualizar publicación
PATCH  /publications/:id/status           Cambiar estado editorial
DELETE /publications/:id                  Eliminar publicación
GET    /stats/overview                    Estadísticas
GET    /health                            Health check
```

#### Estados Editoriales

```
DRAFT       → IN_REVIEW      → APPROVED → PUBLISHED
         ↘          ↗      ↘         ↗
          REJECTED  DRAFT (retrabajo)
```

#### Ejemplo de Requests

```bash
# Crear publicación
curl -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Machine Learning Fundamentals",
    "content": "Contenido de la publicación...",
    "abstract_text": "Resumen breve...",
    "authorId": "[AUTHOR_ID]",
    "keywords": ["AI", "Machine Learning"]
  }'

# Cambiar estado
curl -X PATCH http://localhost:3002/publications/[ID]/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "reviewNotes": "Enviado para revisión académica"
  }'

# Obtener con datos del autor
curl "http://localhost:3002/publications/[ID]?includeAuthor=true"
```

#### Manejo de Errores

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Publication with id xxx not found"
  }
}
```

## 🎨 Frontend

**Tecnología**: React 18 + Vite  
**Puerto**: 3000

### Características

- ✅ Gestión de Autores (CRUD)
- ✅ Gestión de Publicaciones (CRUD)
- ✅ Cambio de estado editorial
- ✅ Filtrado por estado
- ✅ Paginación
- ✅ Alertas de éxito/error
- ✅ Diseño responsivo
- ✅ Interfaz intuitiva

### Componentes Principales

- **App.jsx**: Componente raíz con navegación
- **AuthorsList.jsx**: Página de gestión de autores
- **PublicationsList.jsx**: Página de gestión de publicaciones
- **Alert.jsx**: Componente reutilizable de alertas

### Acceso

```
http://localhost:3000
```

## 📊 Modelado BPMN

**Herramienta**: Camunda Modeler  
**Formato**: BPMN 2.0 XML

### Proceso Modelado: Editorial Publication Process

#### Participantes

- 👤 **Autor**: Crea y modifica borradores
- 📋 **Editor**: Revisa editorialmente y publica
- 👨‍⚖️ **Comité de Revisión**: Aprueba académicamente

#### Flujo Principal

```
Inicio
  ↓
[Crear Borrador] (Autor)
  ↓
[Enviar a Revisión] (Autor)
  ↓
[Revisión Editorial] (Editor)
  ↓
[Revisión de Comité] (Comité)
  ↓
[DECISIÓN] (Gateway XOR)
├─→ APROBADO
│    ├─ [Preparar para publicación]
│    ├─ [Publicar]
│    └─ FIN: Publicado ✅
│
├─→ REQUIERE CAMBIOS
│    ├─ [Solicitar cambios]
│    ├─ [Realizar cambios] (Autor)
│    └─ [Revisión Editorial] (retorna)
│
└─→ RECHAZADO
     ├─ [Notificar rechazo]
     └─ FIN: Rechazado ❌
```

### Simulación con Token Simulation

#### Escenario 1: Aprobación Directa

Esperar: ~5-7 días  
Ruta: Aprobado → Publicado

#### Escenario 2: Requiere Cambios

Esperar: ~10-14 días  
Ruta: Requiere Cambios → Resubmitir → Aprobado → Publicado

#### Escenario 3: Rechazo

Esperar: ~3-5 días  
Ruta: Rechazado → Fin

**Documentación completa**: Ver `bpmn-models/README_BPMN.md`

## 🎯 Patrones de Diseño Implementados

### 1. **Repository Pattern**
- **Ubicación**: `AuthorRepository.ts`, `PublicationRepository.ts`
- **Propósito**: Abstrae la lógica de acceso a datos
- **Beneficio**: Facilita testing y cambio de BD

### 2. **Data Transfer Object (DTO)**
- **Ubicación**: `*DTO.ts` en ambos servicios
- **Propósito**: Desacopla entidades de la presentación HTTP
- **Beneficio**: Control sobre qué datos se exponen

### 3. **Service Layer**
- **Ubicación**: `AuthorService.ts`, `PublicationService.ts`
- **Propósito**: Encapsula lógica de negocio
- **Beneficio**: Separación de responsabilidades

### 4. **Adapter Pattern**
- **Ubicación**: `AuthorsServiceClient.ts`
- **Propósito**: Abstrae comunicación HTTP entre servicios
- **Beneficio**: Desacoplamiento de tecnología HTTP

### 5. **Factory/Builder**
- **Ubicación**: Creación de instancias en Controllers
- **Propósito**: Crea objetos complejos de forma controlada
- **Beneficio**: Encapsulación de lógica de creación

### 6. **Strategy Pattern**
- **Ubicación**: `StateValidators.ts`
- **Propósito**: Define estrategias de validación por estado
- **Beneficio**: Flexibilidad y extensibilidad

### 7. **Facade Pattern**
- **Ubicación**: `StateValidationFacade.ts`
- **Propósito**: Coordina múltiples validadores
- **Beneficio**: Simplifica operaciones complejas

### 8. **Mapper Pattern**
- **Ubicación**: `AuthorMapper.ts`, `PublicationMapper.ts`
- **Propósito**: Convierte entre entidades y DTOs
- **Beneficio**: Responsabilidad única

### 9. **Singleton Pattern**
- **Ubicación**: `getAuthorsServiceClient()` en client
- **Propósito**: Una única instancia del cliente HTTP
- **Beneficio**: Eficiencia de recursos

## ✅ Principios SOLID

### S - Single Responsibility Principle (SRP)

Cada clase tiene una única responsabilidad:

```typescript
// ✅ CORRECTO - Clases especializadas
- AuthorController: Maneja HTTP
- AuthorService: Lógica de negocio
- AuthorRepository: Acceso a datos
- AuthorMapper: Conversión de datos

// ❌ EVITADO - Clases con múltiples responsabilidades
class AuthorManager {
  // Manejo HTTP, lógica, BD, mapeo...
}
```

### O - Open/Closed Principle (OCP)

Código abierto a extensión, cerrado a modificación:

```typescript
// Strategy Pattern en StateValidators
// Agregar nuevas validaciones sin modificar código existente
```

### L - Liskov Substitution Principle (LSP)

Subtipos sustituibles por supertipo:

```typescript
// Todas las clases derivadas pueden usarse donde Author es esperado
public abstract class BasePerson {
  abstract getFullName(): string;
}

export class Author extends BasePerson { }
export class Editor extends BasePerson { }
```

### I - Interface Segregation Principle (ISP)

Interfaces específicas, no genéricas:

```typescript
// ✅ Interfaces pequeñas y específicas
interface StateValidator {
  validate(publication, newStatus): void;
}

// ❌ Evitar interfaces grandes
interface EverythingValidator { }
```

### D - Dependency Inversion Principle (DIP)

Depender de abstracciones, no implementaciones:

```typescript
// AuthorsServiceClient actúa como abstracción
private authorsServiceClient: AuthorsServiceClient;

// Service depende de la abstracción, no de HTTP directo
async createPublication(dto) {
  const authorExists = await this.authorsServiceClient.authorExists();
}
```

## 🧪 Testing

### Validación Manual de Endpoints

```bash
# 1. Crear autor
AUTHOR_ID=$(curl -s -X POST http://localhost:3001/authors \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"Author","email":"test@example.com"}' \
  | jq -r '.data.id')

echo "Autor creado: $AUTHOR_ID"

# 2. Crear publicación con autor válido
curl -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test\",\"content\":\"Test\",\"authorId\":\"$AUTHOR_ID\"}"

# 3. Cambiar estado
curl -X PATCH http://localhost:3002/publications/[ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_REVIEW","reviewNotes":"Test"}'

# 4. Validar dependencia (autor inexistente)
curl -X POST http://localhost:3002/publications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test","authorId":"invalid-id"}'
# Respuesta: 404 Not Found
```

### Health Checks

```bash
# Verificar todos los servicios
docker-compose exec authors-service curl http://localhost:3001/health
docker-compose exec publications-service curl http://localhost:3002/health
```

## 📚 Documentación API

### Especificación OpenAPI (Swagger)

#### Authors Service

**Base URL**: `http://localhost:3001`

```yaml
/authors:
  POST:
    summary: Crear autor
    parameters:
      - firstName (string, required)
      - lastName (string, required)
      - email (string, required)
      - biography (string, optional)
      - specialization (string, optional)
    responses:
      201: { id, firstName, lastName, email, ... }
      400: Validation error
      409: Email already exists
  
  GET:
    summary: Listar autores
    parameters:
      - page (integer, default: 1)
      - limit (integer, default: 10)
    responses:
      200: { data: [Author], pagination: {...} }

/authors/{id}:
  GET:
    summary: Obtener autor
    responses:
      200: { id, firstName, lastName, ... }
      404: Author not found
  
  PATCH:
    summary: Actualizar autor
    responses:
      200: Updated author
      404: Not found
  
  DELETE:
    summary: Eliminar autor
    responses:
      200: Success
      404: Not found
```

#### Publications Service

**Base URL**: `http://localhost:3002`

```yaml
/publications:
  POST:
    summary: Crear publicación
    parameters:
      - title (string, required)
      - content (string, required)
      - authorId (uuid, required) → Validado en Authors Service
      - abstract_text (string, optional)
      - keywords (string[], optional)
    responses:
      201: { id, title, status: DRAFT, ... }
      400: Validation error
      404: Author not found

  GET:
    summary: Listar publicaciones
    parameters:
      - page (integer, default: 1)
      - limit (integer, default: 10)
      - status (enum, optional) → DRAFT|IN_REVIEW|APPROVED|PUBLISHED|REJECTED
    responses:
      200: { data: [Publication], pagination: {...} }

/publications/{id}:
  GET:
    summary: Obtener publicación
    parameters:
      - includeAuthor (boolean, default: true)
    responses:
      200: { Publication con datos del autor enriquecidos }
      404: Not found

  PATCH:
    summary: Actualizar publicación
    responses:
      200: Updated publication
      400: Cannot edit in current status

  DELETE:
    summary: Eliminar publicación
    responses:
      200: Success
      400: Cannot delete published
      404: Not found

/publications/{id}/status:
  PATCH:
    summary: Cambiar estado editorial
    parameters:
      - status (enum, required): DRAFT|IN_REVIEW|APPROVED|PUBLISHED|REJECTED
      - reviewNotes (string, required)
    responses:
      200: Publication with new status
      400: Invalid transition or validation error

/publications/author/{authorId}:
  GET:
    summary: Publicaciones de un autor
    responses:
      200: { data: [Publication], pagination: {...} }
      404: Author not found

/stats/overview:
  GET:
    summary: Estadísticas
    responses:
      200: { DRAFT: 5, IN_REVIEW: 2, APPROVED: 1, PUBLISHED: 10, REJECTED: 3 }
```

## 🐛 Troubleshooting

### Los contenedores no inician

```bash
# Ver logs detallados
docker-compose logs authors-service
docker-compose logs publications-service

# Reconstruir sin caché
docker-compose build --no-cache
```

### Errores de conexión entre servicios

```bash
# Verificar red Docker
docker network ls
docker network inspect editorial-network

# Verificar conectividad
docker-compose exec publications-service curl http://authors-service:3001/health
```

### Puertos en uso

```bash
# Linux/macOS
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Windows PowerShell
netstat -ano | findstr :3000
```

### Base de datos no inicializa

```bash
# Ver estado de BD
docker-compose logs db-authors
docker-compose logs db-publications

# Reiniciar desde cero
docker-compose down -v
docker-compose up -d
```

## 📝 Notas Importantes

1. **Dependencia de Servicios**: Publications Service SIEMPRE requiere que Authors Service esté disponible
2. **Validación**: La validación de autor ocurre en tiempo de creación de publicación
3. **Timeouts**: HTTP timeout configurado en 5000ms, reintentable con backoff exponencial
4. **CORS**: Frontend configurado para acceder a ambos servicios

## 🔐 Seguridad (Para Producción)

- [ ] Implementar autenticación (JWT)
- [ ] Implementar autorización por roles
- [ ] Usar HTTPS/TLS
- [ ] Validar y sanitizar inputs
- [ ] Rate limiting en APIs
- [ ] Logging y monitoring
- [ ] Secretos en variables de entorno (secrets management)
- [ ] API Gateway (Kong, Traefik)

## 📞 Contacto y Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2024  
**Estado**: Producción Ready (con mejoras de seguridad recomendadas)
