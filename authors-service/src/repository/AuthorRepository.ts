import { Repository } from 'typeorm';
import { Author } from '../entity/Author';
import { AppDataSource } from '../config/database';

/**
 * PATRÓN: Repository Pattern
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Abstrae la lógica de acceso a datos
 */
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

  async findByEmail(email: string): Promise<Author | null> {
    return await this.repository.findOneBy({ email });
  }

  async findAll(
    skip: number = 0,
    take: number = 10
  ): Promise<[Author[], number]> {
    return await this.repository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, data: Partial<Author>): Promise<Author | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.countBy({ id });
    return count > 0;
  }
}
