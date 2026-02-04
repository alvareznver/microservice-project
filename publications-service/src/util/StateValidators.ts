import { Publication, PublicationStatus } from '../entity/Publication';

/**
 * PATRÓN: Strategy Pattern
 * PRINCIPIO SOLID: Open/Closed Principle (OCP)
 * Define diferentes estrategias de validación según el estado
 */

export interface StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void;
}

/**
 * Validador para transición a REVIEW
 */
export class ToReviewValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.IN_REVIEW) return;

    if (!publication.title || publication.title.trim().length === 0) {
      throw new Error('Title is required for review');
    }

    if (!publication.content || publication.content.trim().length === 0) {
      throw new Error('Content is required for review');
    }

    if (
      publication.status !== PublicationStatus.DRAFT &&
      publication.status !== PublicationStatus.REJECTED
    ) {
      throw new Error('Only DRAFT or REJECTED publications can go to REVIEW');
    }
  }
}

/**
 * Validador para transición a APPROVED
 */
export class ToApprovedValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.APPROVED) return;

    if (publication.status !== PublicationStatus.IN_REVIEW) {
      throw new Error('Only IN_REVIEW publications can be APPROVED');
    }

    if (!publication.reviewNotes || publication.reviewNotes.trim().length === 0) {
      throw new Error('Review notes are required for approval');
    }
  }
}

/**
 * Validador para transición a PUBLISHED
 */
export class ToPublishedValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.PUBLISHED) return;

    if (publication.status !== PublicationStatus.APPROVED) {
      throw new Error('Only APPROVED publications can be PUBLISHED');
    }
  }
}

/**
 * Validador para transición a REJECTED
 */
export class ToRejectedValidator implements StateValidator {
  validate(publication: Publication, newStatus: PublicationStatus): void {
    if (newStatus !== PublicationStatus.REJECTED) return;

    if (publication.status === PublicationStatus.PUBLISHED) {
      throw new Error('Published publications cannot be REJECTED');
    }

    if (!publication.reviewNotes || publication.reviewNotes.trim().length === 0) {
      throw new Error('Review notes are required for rejection');
    }
  }
}

/**
 * PATRÓN: Facade Pattern
 * Coordina el uso de múltiples validadores
 */
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

  /**
   * Ejecutar todas las validaciones
   * PRINCIPIO SOLID: Single Responsibility
   */
  validateTransition(
    publication: Publication,
    newStatus: PublicationStatus
  ): void {
    for (const validator of this.validators) {
      validator.validate(publication, newStatus);
    }
  }
}
