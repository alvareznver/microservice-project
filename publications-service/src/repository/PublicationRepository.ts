import { Repository } from 'typeorm';
import { Publication, PublicationStatus } from '../entity/Publication';
import { AppDataSource } from '../config/database';

/**
 * PATRÓN: Repository Pattern
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Abstrae la lógica de acceso a datos de publicaciones
 */
export class PublicationRepository {
  private repository: Repository<Publication>;

  constructor() {
    this.repository = AppDataSource.getRepository(Publication);
  }

  async create(publication: Partial<Publication>): Promise<Publication> {
    const newPublication = this.repository.create(publication);
    return await this.repository.save(newPublication);
  }

  async findById(id: string): Promise<Publication | null> {
    return await this.repository.findOneBy({ id });
  }

  async findByAuthorId(
    authorId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<[Publication[], number]> {
    return await this.repository.findAndCount({
      where: { authorId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(
    skip: number = 0,
    take: number = 10,
    status?: PublicationStatus
  ): Promise<[Publication[], number]> {
    const query = this.repository.createQueryBuilder('publication');

    if (status) {
      query.where('publication.status = :status', { status });
    }

    return await query
      .skip(skip)
      .take(take)
      .orderBy('publication.createdAt', 'DESC')
      .getManyAndCount();
  }

  async update(
    id: string,
    data: Partial<Publication>
  ): Promise<Publication | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async updateStatus(
    id: string,
    status: PublicationStatus,
    reviewNotes?: string
  ): Promise<Publication | null> {
    const updateData: any = { status };
    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }
    return await this.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.countBy({ id });
    return count > 0;
  }

  async countByStatus(status: PublicationStatus): Promise<number> {
    return await this.repository.countBy({ status });
  }
}
