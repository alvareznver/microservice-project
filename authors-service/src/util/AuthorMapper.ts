import { Author } from '../entity/Author';
import { AuthorResponseDTO } from '../dto/AuthorDTO';

/**
 * PATRÓN: Mapper (Object Mapper)
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Responsable de convertir entidades a DTOs y viceversa
 */
export class AuthorMapper {
  static toDTO(author: Author): AuthorResponseDTO {
    return {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      biography: author.biography,
      specialization: author.specialization,
      isActive: author.isActive,
      role: author.getRole(),
      fullName: author.getFullName(),
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
    };
  }

  static toDTOList(authors: Author[]): AuthorResponseDTO[] {
    return authors.map((author) => this.toDTO(author));
  }
}
