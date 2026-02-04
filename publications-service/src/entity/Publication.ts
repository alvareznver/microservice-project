import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ENUMERACIÓN: Estados editoriales
 * Define los posibles estados de una publicación
 */
export enum PublicationStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

/**
 * CLASE ABSTRACTA BASE - Trabajo editorial
 * Define propiedades comunes para todas las obras editables
 * PRINCIPIO SOLID: Liskov Substitution Principle (LSP)
 */
@Entity()
export abstract class BaseWork {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50 })
  status: PublicationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Método abstracto que define si el trabajo puede ser editado
   */
  abstract canBeEdited(): boolean;

  /**
   * Método abstracto para obtener el tipo de trabajo
   */
  abstract getWorkType(): string;
}

/**
 * CLASE DERIVADA - Publicación
 * Extiende BaseWork con propiedades específicas de una publicación
 * PATRÓN: Template Method, Polymorphism
 */
@Entity('publications')
export class Publication extends BaseWork {
  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorEmail?: string;

  @Column({ type: 'text', nullable: true })
  abstract_text: string;

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  /**
   * Implementación: puede editarse si está en DRAFT o IN_REVIEW
   */
  canBeEdited(): boolean {
    return (
      this.status === PublicationStatus.DRAFT ||
      this.status === PublicationStatus.IN_REVIEW
    );
  }

  /**
   * Implementación: retorna el tipo de trabajo
   */
  getWorkType(): string {
    return 'ACADEMIC_PUBLICATION';
  }

  /**
   * Método de negocio específico
   */
  canTransitionToStatus(newStatus: PublicationStatus): boolean {
    const validTransitions: { [key in PublicationStatus]: PublicationStatus[] } =
      {
        [PublicationStatus.DRAFT]: [
          PublicationStatus.IN_REVIEW,
          PublicationStatus.REJECTED,
        ],
        [PublicationStatus.IN_REVIEW]: [
          PublicationStatus.APPROVED,
          PublicationStatus.REJECTED,
          PublicationStatus.DRAFT,
        ],
        [PublicationStatus.APPROVED]: [PublicationStatus.PUBLISHED],
        [PublicationStatus.PUBLISHED]: [],
        [PublicationStatus.REJECTED]: [PublicationStatus.DRAFT],
      };

    return validTransitions[this.status as PublicationStatus]?.includes(
      newStatus
    ) ?? false;
  }
}

/**
 * CLASE DERIVADA - Libro (extensión futura)
 * Extiende BaseWork para libros
 */
@Entity('books')
export class Book extends BaseWork {
  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  isbn: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  publisher: string;

  @Column({ type: 'int', nullable: true })
  pageCount: number;

  canBeEdited(): boolean {
    return (
      this.status === PublicationStatus.DRAFT ||
      this.status === PublicationStatus.IN_REVIEW
    );
  }

  getWorkType(): string {
    return 'BOOK';
  }
}
