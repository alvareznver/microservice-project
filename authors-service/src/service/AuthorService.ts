import { AuthorRepository } from '../repository/AuthorRepository';
import { Author } from '../entity/Author';
import { CreateAuthorDTO, UpdateAuthorDTO, AuthorResponseDTO } from '../dto/AuthorDTO';
import { AuthorMapper } from '../util/AuthorMapper';

/**
 * PATRÓN: Service (Business Logic Layer)
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Encapsula la lógica de negocio, separada de la presentación y persistencia
 */
export class AuthorService {
  private authorRepository: AuthorRepository;

  constructor() {
    this.authorRepository = new AuthorRepository();
  }

  /**
   * Crear un nuevo autor con validación
   * PRINCIPIO SOLID: Single Responsibility - validar y persistir
   */
  async createAuthor(dto: CreateAuthorDTO): Promise<AuthorResponseDTO> {
    // Validar que el email no exista
    const existingAuthor = await this.authorRepository.findByEmail(dto.email);
    if (existingAuthor) {
      throw new Error(`Email ${dto.email} already exists`);
    }

    // Validar datos requeridos
    if (!dto.firstName || !dto.lastName || !dto.email) {
      throw new Error('firstName, lastName, and email are required');
    }

    const author = new Author();
    author.firstName = dto.firstName;
    author.lastName = dto.lastName;
    author.email = dto.email;
    author.biography = dto.biography || '';
    author.specialization = dto.specialization || '';
    author.isActive = true;

    const savedAuthor = await this.authorRepository.create(author);
    return AuthorMapper.toDTO(savedAuthor);
  }

  /**
   * Obtener autor por ID
   */
  async getAuthorById(id: string): Promise<AuthorResponseDTO> {
    const author = await this.authorRepository.findById(id);
    if (!author) {
      throw new Error(`Author with id ${id} not found`);
    }
    return AuthorMapper.toDTO(author);
  }

  /**
   * Validar existencia de autor (método usado por Publications Service)
   */
  async authorExists(id: string): Promise<boolean> {
    return await this.authorRepository.exists(id);
  }

  /**
   * Obtener datos internos del autor (sin DTO - solo para microservicio)
   */
  async getAuthorDataInternal(id: string): Promise<Author | null> {
    return await this.authorRepository.findById(id);
  }

  /**
   * Listar todos los autores con paginación
   */
  async listAuthors(
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: AuthorResponseDTO[]; total: number; page: number }> {
    const skip = (page - 1) * limit;
    const [authors, total] = await this.authorRepository.findAll(skip, limit);

    return {
      data: authors.map((author) => AuthorMapper.toDTO(author)),
      total,
      page,
    };
  }

  /**
   * Actualizar autor
   */
  async updateAuthor(
    id: string,
    dto: UpdateAuthorDTO
  ): Promise<AuthorResponseDTO> {
    const author = await this.authorRepository.findById(id);
    if (!author) {
      throw new Error(`Author with id ${id} not found`);
    }

    // Validar email único si se intenta cambiar
    if (dto.email && dto.email !== author.email) {
      const existing = await this.authorRepository.findByEmail(dto.email);
      if (existing) {
        throw new Error(`Email ${dto.email} already exists`);
      }
    }

    const updated = await this.authorRepository.update(id, dto);
    if (!updated) {
      throw new Error('Failed to update author');
    }

    return AuthorMapper.toDTO(updated);
  }

  /**
   * Eliminar autor
   */
  async deleteAuthor(id: string): Promise<void> {
    const author = await this.authorRepository.findById(id);
    if (!author) {
      throw new Error(`Author with id ${id} not found`);
    }

    const deleted = await this.authorRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete author');
    }
  }
}
