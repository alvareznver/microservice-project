import { Publication } from '../entity/Publication';
import {
  PublicationResponseDTO,
  PublicationWithAuthorDTO,
} from '../dto/PublicationDTO';
import { AuthorData } from '../client/AuthorsServiceClient';

/**
 * PATRÓN: Object Mapper
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Convierte entidades a DTOs
 */
export class PublicationMapper {
  static toDTO(publication: Publication): PublicationResponseDTO {
    return {
      id: publication.id,
      title: publication.title,
      content: publication.content,
      status: publication.status,
      authorId: publication.authorId,
      authorName: publication.authorName,
      authorEmail: publication.authorEmail,
      abstract_text: publication.abstract_text,
      keywords: publication.keywords || [],
      reviewCount: publication.reviewCount,
      reviewNotes: publication.reviewNotes,
      isVisible: publication.isVisible,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }

  static toDTOWithAuthor(
    publication: Publication,
    author: AuthorData
  ): PublicationWithAuthorDTO {
    const dto = this.toDTO(publication) as PublicationWithAuthorDTO;
    dto.author = {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      specialization: author.specialization,
    };
    return dto;
  }

  static toDTOList(publications: Publication[]): PublicationResponseDTO[] {
    return publications.map((pub) => this.toDTO(pub));
  }
}
