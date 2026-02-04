import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * CLASE ABSTRACTA BASE - Patrón Template Method
 * Define propiedades comunes para todas las personas en el sistema
 */
@Entity()
export abstract class BasePerson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Método abstracto que debe implementarse en las clases derivadas
   */
  abstract getFullName(): string;

  abstract getRole(): string;
}

/**
 * CLASE DERIVADA - Autor
 * Extiende BasePerson con propiedades específicas de un autor
 * Patrón: Herencia y Polimorfismo (SOLID - Liskov Substitution Principle)
 */
@Entity('authors')
export class Author extends BasePerson {
  @Column({ type: 'text', nullable: true })
  biography: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Implementación del método abstracto
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Implementación específica del rol
   */
  getRole(): string {
    return 'AUTHOR';
  }

  /**
   * Método de negocio específico del dominio
   */
  canPublish(): boolean {
    return this.isActive;
  }
}

/**
 * CLASE DERIVADA - Editor
 * Extiende BasePerson con propiedades de un editor del sistema
 * Puede ser usado en futuras extensiones del sistema
 */
@Entity('editors')
export class Editor extends BasePerson {
  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  getFullName(): string {
    return `${this.firstName} ${this.lastName} (Editor)`;
  }

  getRole(): string {
    return 'EDITOR';
  }
}
