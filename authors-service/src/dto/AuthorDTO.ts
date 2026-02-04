/**
 * PATRÓN: Data Transfer Object (DTO)
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * Los DTOs definen la estructura de entrada/salida, desacoplando entidades del API
 */

export class CreateAuthorDTO {
  firstName: string;
  lastName: string;
  email: string;
  biography?: string;
  specialization?: string;
}

export class UpdateAuthorDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  biography?: string;
  specialization?: string;
  isActive?: boolean;
}

export class AuthorResponseDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  biography?: string;
  specialization?: string;
  isActive: boolean;
  role: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ListAuthorsDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  isActive: boolean;
}
