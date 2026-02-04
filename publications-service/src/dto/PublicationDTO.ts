import { PublicationStatus } from '../entity/Publication';

/**
 * PATRÓN: Data Transfer Object (DTO)
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Desacopla las entidades de la presentación HTTP
 */

export class CreatePublicationDTO {
  title: string;
  content: string;
  abstract_text?: string;
  authorId: string;
  keywords?: string[];
}

export class UpdatePublicationDTO {
  title?: string;
  content?: string;
  abstract_text?: string;
  keywords?: string[];
  reviewNotes?: string;
}

export class ChangePublicationStatusDTO {
  status: PublicationStatus;
  reviewNotes?: string;
}

export class PublicationResponseDTO {
  id: string;
  title: string;
  content: string;
  status: PublicationStatus;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  abstract_text: string;
  keywords: string[];
  reviewCount: number;
  reviewNotes?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PublicationWithAuthorDTO extends PublicationResponseDTO {
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  };
}

export class ListPublicationDTO {
  id: string;
  title: string;
  status: PublicationStatus;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
}
