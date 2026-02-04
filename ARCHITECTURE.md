# 🏗️ Arquitectura y Patrones de Diseño

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Patrones de Diseño](#patrones-de-diseño)
3. [Principios SOLID](#principios-solid)
4. [Dependencias entre Servicios](#dependencias-entre-servicios)
5. [Manejo de Errores](#manejo-de-errores)
6. [Ejemplos de Código](#ejemplos-de-código)

---

## Arquitectura General

### Modelo en Capas

Cada microservicio sigue una arquitectura de capas clara y bien definida:

```
┌─────────────────────────────────────────┐
│      PRESENTACIÓN (Controller)          │
│   Manejo de requests/responses HTTP     │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      LÓGICA DE NEGOCIO (Service)        │
│   Reglas de negocio y orquestación      │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      PERSISTENCIA (Repository)          │
│   Acceso a base de datos                │
└──────────────────┬──────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────┐
│      BASE DE DATOS (PostgreSQL)         │
│   Almacenamiento permanente             │
└─────────────────────────────────────────┘
```

### Flujo de Datos

```
HTTP Request
    ↓
Controller (Validación HTTP)
    ↓
Service (Lógica de negocio)
    ↓
Repository (Acceso a datos)
    ↓
Entity (ORM - TypeORM)
    ↓
PostgreSQL Database
    ↓
Entity (ORM)
    ↓
Repository
    ↓
Mapper (Entity → DTO)
    ↓
Controller (HTTP Response)
    ↓
HTTP Response
```

---

## Patrones de Diseño

### 1. Repository Pattern

**Propósito**: Abstrae la lógica de acceso a datos

**Ubicación**: `repository/AuthorRepository.ts`, `repository/PublicationRepository.ts`

**Implementación**:

```typescript
export class AuthorRepository {
  private repository: Repository<Author>;

  constructor() {
    this.repository = AppDataSource.getRepository(Author);
  }

  async create(author: Partial<Author>): Promise<Author> {
    const newAuthor = this.repository.create(author);
    return await this.repository.save(newAuthor);
  }

  async findById(id: string): Promise<Author | null> {
    return await this.repository.findOneBy({ id });
  }

  // Más métodos...
}
```

**Ventajas**:
- ✅ Desacoplamiento de la BD
- ✅ Facilita testing
- ✅ Cambiar BD sin afectar servicios

---

### 2. Data Transfer Object (DTO)

**Propósito**: Desacoplar entidades del API REST

**Ubicación**: `dto/*.ts`

**Implementación**:

```typescript
// DTO - Solo lo que se expone
export class AuthorResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  fullName: string;
  // Sin contraseñas, datos internos, etc.
}

// Vs. Entity - Puede tener más datos
@Entity()
export class Author extends BasePerson {
  @Column()
  internalNotes: string; // NO se expone en DTO
}
```

**Ventajas**:
- ✅ Control sobre datos expuestos
- ✅ Validación de entrada
- ✅ Versionamiento de API

---

### 3. Adapter Pattern

**Propósito**: Abstrae comunicación HTTP entre servicios

**Ubicación**: `client/AuthorsServiceClient.ts`

**Implementación**:

```typescript
export class AuthorsServiceClient {
  private axiosInstance: AxiosInstance;

  async authorExists(authorId: string): Promise<boolean> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.axiosInstance.get(`/authors/${authorId}`);
      });
      return response.status === 200;
    } catch (error) {
      console.error(`Error checking author: ${error}`);
      return false;
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    // Implementación con reintentos y backoff exponencial
  }
}
```

**Ventajas**:
- ✅ Manejo centralizado de HTTP
- ✅ Reintentos y timeouts
- ✅ Fácil cambiar cliente HTTP

---

### 4. Mapper Pattern

**Propósito**: Convierte entidades a DTOs

**Ubicación**: `util/AuthorMapper.ts`, `util/PublicationMapper.ts`

**Implementación**:

```typescript
export class AuthorMapper {
  static toDTO(author: Author): AuthorResponseDTO {
    return {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      role: author.getRole(),
      fullName: author.getFullName(),
      // Más propiedades...
    };
  }

  static toDTOList(authors: Author[]): AuthorResponseDTO[] {
    return authors.map((author) => this.toDTO(author));
  }
}
```

**Ventajas**:
- ✅ Lógica de conversión centralizada
- ✅ Fácil de testear
- ✅ Reutilizable

---

### 5. Strategy Pattern

**Propósito**: Define diferentes estrategias de validación

**Ubicación**: `util/StateValidators.ts`

**Implementación**:

```typescript
interface StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void;
}

export class ToReviewValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.IN_REVIEW) return;
    if (!publication.title) throw new Error("Title required");
    if (publication.status !== PublicationStatus.DRAFT) {
      throw new Error("Only DRAFT can go to REVIEW");
    }
  }
}

export class ToApprovedValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.APPROVED) return;
    if (publication.status !== PublicationStatus.IN_REVIEW) {
      throw new Error("Only IN_REVIEW can be APPROVED");
    }
  }
}
```

**Ventajas**:
- ✅ Open/Closed Principle - Fácil agregar validaciones
- ✅ Cada validación es una clase
- ✅ No hay if/else anidados

---

### 6. Facade Pattern

**Propósito**: Coordina múltiples validadores

**Ubicación**: `util/StateValidators.ts`

**Implementación**:

```typescript
export class StateValidationFacade {
  private validators: StateValidator[];

  constructor() {
    this.validators = [
      new ToReviewValidator(),
      new ToApprovedValidator(),
      new ToPublishedValidator(),
      new ToRejectedValidator(),
    ];
  }

  validateTransition(
    publication: Publication,
    newStatus: PublicationStatus
  ): void {
    for (const validator of this.validators) {
      validator.validate(publication, newStatus);
    }
  }
}
```

**Ventajas**:
- ✅ Simplifica operaciones complejas
- ✅ Coordina múltiples objetos
- ✅ Punto único de entrada

---

### 7. Service Layer Pattern

**Propósito**: Encapsula toda la lógica de negocio

**Ubicación**: `service/AuthorService.ts`, `service/PublicationService.ts`

**Implementación**:

```typescript
export class PublicationService {
  private publicationRepository: PublicationRepository;
  private stateValidationFacade: StateValidationFacade;
  private authorsServiceClient: AuthorsServiceClient;

  // Orquesta repositorio, validación y cliente HTTP
  async createPublication(dto: CreatePublicationDTO): Promise<PublicationResponseDTO> {
    // 1. Validar entrada
    if (!dto.title || !dto.content) {
      throw new Error("Required fields");
    }

    // 2. Validar dependencia (llamar a otro servicio)
    const authorExists = await this.authorsServiceClient.authorExists(dto.authorId);
    if (!authorExists) {
      throw new Error("Author not found");
    }

    // 3. Crear entidad y persistir
    const publication = new Publication();
    // ... llenar propiedades ...
    const saved = await this.publicationRepository.create(publication);

    // 4. Retornar DTO
    return PublicationMapper.toDTO(saved);
  }

  async changePublicationStatus(
    id: string,
    dto: ChangePublicationStatusDTO
  ): Promise<PublicationResponseDTO> {
    // 1. Obtener publicación
    const publication = await this.publicationRepository.findById(id);
    if (!publication) throw new Error("Not found");

    // 2. Validar transición
    this.stateValidationFacade.validateTransition(publication, dto.status);

    // 3. Actualizar
    const updated = await this.publicationRepository.updateStatus(
      id,
      dto.status,
      dto.reviewNotes
    );

    // 4. Retornar DTO
    return PublicationMapper.toDTO(updated);
  }
}
```

**Ventajas**:
- ✅ Lógica de negocio centralizada
- ✅ Fácil de testear
- ✅ Reutilizable desde múltiples controllers

---

### 8. Singleton Pattern

**Propósito**: Una única instancia del cliente HTTP

**Ubicación**: `client/AuthorsServiceClient.ts`

**Implementación**:

```typescript
let instance: AuthorsServiceClient | null = null;

export function getAuthorsServiceClient(): AuthorsServiceClient {
  if (!instance) {
    instance = new AuthorsServiceClient();
  }
  return instance;
}

// En service:
const authorsServiceClient = getAuthorsServiceClient();
```

**Ventajas**:
- ✅ Eficiencia de recursos
- ✅ Una conexión reutilizada
- ✅ Estado compartido seguro

---

## Principios SOLID

### S - Single Responsibility Principle (SRP)

Cada clase tiene una ÚNICA responsabilidad:

**CORRECTO** ✅:
```typescript
// Author.ts - Entidad
export class Author extends BasePerson {
  // Solo datos y lógica de dominio
}

// AuthorRepository.ts - Acceso a datos
export class AuthorRepository {
  // Solo persistencia
}

// AuthorService.ts - Lógica de negocio
export class AuthorService {
  // Solo reglas de negocio
}

// AuthorController.ts - HTTP
export class AuthorController {
  // Solo manejo HTTP
}

// AuthorMapper.ts - Conversión
export class AuthorMapper {
  // Solo mapeo
}
```

**INCORRECTO** ❌:
```typescript
// MegaClass.ts - ¡MALO!
export class MegaClass {
  // Manejo HTTP
  // Lógica de negocio
  // Acceso a datos
  // Mapeo de datos
  // TODO MEZCLADO!
}
```

---

### O - Open/Closed Principle (OCP)

Abierto a extensión, cerrado a modificación:

**CORRECTO** ✅:
```typescript
// Para agregar nueva validación, extendemos
export class NewValidator implements StateValidator {
  validate(publication, newStatus) {
    // Nueva lógica
  }
}

// Sin modificar código existente
export class StateValidationFacade {
  private validators: StateValidator[] = [
    // Simplemente agregar a la lista
    new ToReviewValidator(),
    new NewValidator(), // ← Nuevo
  ];
}
```

**INCORRECTO** ❌:
```typescript
// Validación monolítica
function validateTransition(pub, newStatus) {
  if (newStatus === 'REVIEW') {
    // Validar para REVIEW
  } else if (newStatus === 'APPROVED') {
    // Validar para APPROVED
  } else if (newStatus === 'PUBLISHED') {
    // Validar para PUBLISHED
  } else if (newStatus === 'NEW_STATUS') {
    // ← Hay que modificar esta función CADA VEZ
  }
}
```

---

### L - Liskov Substitution Principle (LSP)

Subtipos deben ser sustituibles por supertipo:

**CORRECTO** ✅:
```typescript
// Toda clase derivada puede usarse donde BasePerson es esperado
abstract class BasePerson {
  abstract getFullName(): string;
  abstract getRole(): string;
}

class Author extends BasePerson {
  getFullName(): string { return `${this.firstName} ${this.lastName}`; }
  getRole(): string { return 'AUTHOR'; }
}

class Editor extends BasePerson {
  getFullName(): string { return `${this.firstName} ${this.lastName}`; }
  getRole(): string { return 'EDITOR'; }
}

// Ambas se pueden usar igual:
function printPerson(person: BasePerson) {
  console.log(person.getFullName());
  console.log(person.getRole());
}

printPerson(new Author()); // ✅ Funciona
printPerson(new Editor()); // ✅ Funciona
```

---

### I - Interface Segregation Principle (ISP)

Interfaces específicas, no genéricas:

**CORRECTO** ✅:
```typescript
interface StateValidator {
  validate(pub: Publication, status: PublicationStatus): void;
}

interface Saveable {
  save(): Promise<void>;
}

interface Deletable {
  delete(): Promise<void>;
}

// Implementar solo lo necesario
class PublicationService implements StateValidator, Saveable {
  validate() { /* ... */ }
  save() { /* ... */ }
}
```

**INCORRECTO** ❌:
```typescript
interface AllThings {
  validate();
  save();
  delete();
  update();
  create();
  find();
  // 100 métodos más...
}

// Clase pequeña obligada a implementar TODO
class SmallClass implements AllThings {
  // Tiene que implementar 100+ métodos
}
```

---

### D - Dependency Inversion Principle (DIP)

Depender de abstracciones, NO de implementaciones:

**CORRECTO** ✅:
```typescript
// Service depende de abstracción (Repository interface)
export class PublicationService {
  constructor(private repo: PublicationRepository) {}
  
  async create(dto) {
    const publication = new Publication();
    // ... configurar ...
    return await this.repo.create(publication); // ← Abstracción
  }
}

// Controller depende de abstracción (Service)
export class PublicationController {
  constructor(private service: PublicationService) {}
  
  async create(req, res) {
    const result = await this.service.create(req.body); // ← Abstracción
    res.json(result);
  }
}
```

**INCORRECTO** ❌:
```typescript
// Service depende directamente de implementación (PostgreSQL)
export class PublicationService {
  async create(dto) {
    // Conectar a PostgreSQL directamente
    const client = new PostgresClient();
    const result = client.query("INSERT INTO...");
    return result;
  }
}

// Controller depende de implementación específica
export class PublicationController {
  private service = new PublicationService(); // ← Tight coupling
}
```

---

## Dependencias entre Servicios

### Arquitectura

```
┌─────────────────────┐
│  Publications       │
│    Service          │
│    (Puerto 3002)    │
└──────────┬──────────┘
           │
    HTTP Request
    GET /authors/{id}
           │
           ▼
┌─────────────────────┐
│  Authors Service    │
│  (Puerto 3001)      │
└─────────────────────┘
```

### Implementación de Dependencia

```typescript
// En PublicationService
export class PublicationService {
  private authorsServiceClient: AuthorsServiceClient;

  constructor() {
    this.authorsServiceClient = getAuthorsServiceClient();
  }

  async createPublication(dto: CreatePublicationDTO): Promise<...> {
    // VALIDAR QUE AUTOR EXISTE (dependencia)
    const authorExists = await this.authorsServiceClient.authorExists(
      dto.authorId
    );
    if (!authorExists) {
      throw new Error(`Author with id ${dto.authorId} not found`);
    }

    // OBTENER DATOS DEL AUTOR (enriquecimiento)
    const authorData = await this.authorsServiceClient.getAuthor(
      dto.authorId
    );

    // Crear publicación con datos enriquecidos
    const publication = new Publication();
    publication.title = dto.title;
    publication.authorId = dto.authorId;
    if (authorData) {
      publication.authorName = 
        `${authorData.firstName} ${authorData.lastName}`;
      publication.authorEmail = authorData.email;
    }

    return await this.publicationRepository.create(publication);
  }
}
```

### Manejo de Fallos

```typescript
// En AuthorsServiceClient
async authorExists(authorId: string): Promise<boolean> {
  try {
    // Intentar 3 veces con backoff exponencial
    const response = await this.retryRequest(async () => {
      return await this.axiosInstance.get(`/authors/${authorId}`);
    });
    return response.status === 200;
  } catch (error) {
    console.error(`Error checking author: ${error}`);
    // En caso de error, retornar false (validación falla)
    return false;
  }
}

private async retryRequest<T>(
  requestFn: () => Promise<T>,
  attempt: number = 1
): Promise<T> {
  try {
    return await requestFn();
  } catch (error: any) {
    if (attempt < 3) { // Máximo 3 intentos
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.warn(`Retry attempt ${attempt}/3 after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, attempt + 1);
    }
    throw error;
  }
}
```

---

## Manejo de Errores

### Errores Personalizados

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}
```

### Manejo en Controller

```typescript
async createAuthor(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email } = req.body;

    // Validación de entrada
    if (!firstName || !lastName || !email) {
      throw new ValidationError("firstName, lastName, and email required");
    }

    const author = await this.authorService.createAuthor({
      firstName,
      lastName,
      email,
    });

    res.status(201).json({
      success: true,
      data: author,
    });
  } catch (error) {
    this.handleError(res, error);
  }
}

private handleError(res: Response, error: any): void {
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  } else if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
}
```

---

## Ejemplos de Código

### Crear un Autor (Flujo Completo)

```bash
# 1. Frontend realiza request
POST /authors
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com"
}

# 2. Controller recibe y valida
AuthorController.createAuthor()
  └─ Validar: firstName, lastName, email required
  
# 3. Service ejecuta lógica
AuthorService.createAuthor()
  ├─ Validar email único (query DB)
  ├─ Crear entidad Author
  └─ Persistir en DB
  
# 4. Repository persiste
AuthorRepository.create()
  └─ INSERT INTO authors (...) VALUES (...)
  
# 5. Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan@example.com",
    "role": "AUTHOR",
    "fullName": "Juan Pérez"
  }
}
```

### Crear una Publicación con Validación de Autor

```bash
# 1. Frontend realiza request
POST /publications
{
  "title": "ML paper",
  "content": "...",
  "authorId": "[UUID]"
}

# 2. Controller recibe
PublicationController.createPublication()
  └─ Validar: title, content, authorId required
  
# 3. Service ejecuta lógica
PublicationService.createPublication()
  ├─ Llamar a Authors Service (HTTP)
  │  └─ GET http://authors-service:3001/authors/[UUID]
  │     └─ Validar: ¿Autor existe?
  ├─ Si NO existe → Error 404
  ├─ Si existe → Enriquecer datos
  ├─ Crear entidad Publication
  ├─ Configurar status = DRAFT
  └─ Persistir en DB
  
# 4. Repository persiste
PublicationRepository.create()
  └─ INSERT INTO publications (...) VALUES (...)
  
# 5. Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "ML paper",
    "status": "DRAFT",
    "authorId": "[UUID]",
    "authorName": "Juan Pérez",
    "authorEmail": "juan@example.com"
  }
}
```

### Cambiar Estado de Publicación

```bash
# 1. Request
PATCH /publications/[UUID]/status
{
  "status": "IN_REVIEW",
  "reviewNotes": "Enviado a revisión"
}

# 2. Controller
PublicationController.changePublicationStatus()
  └─ Validar: status es válido, reviewNotes existe

# 3. Service
PublicationService.changePublicationStatus()
  ├─ Obtener publicación de DB
  ├─ Ejecutar validación (Strategy)
  │  ├─ ToReviewValidator: ¿Puede ir a REVIEW?
  │  ├─ ToApprovedValidator: ¿Puede ir a APPROVED?
  │  ├─ ToPublishedValidator: ¿Puede ir a PUBLISHED?
  │  └─ ToRejectedValidator: ¿Puede ir a REJECTED?
  ├─ Validar transición de estado
  ├─ Actualizar DB
  └─ Retornar DTO

# 4. Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "IN_REVIEW",
    "reviewNotes": "Enviado a revisión"
  },
  "message": "Publication status changed to IN_REVIEW"
}
```

---

**Fin de Documentación de Arquitectura**
