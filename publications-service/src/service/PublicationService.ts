import { PublicationRepository } from '../repository/PublicationRepository';
import {
  Publication,
  PublicationStatus,
} from '../entity/Publication';
import {
  CreatePublicationDTO,
  UpdatePublicationDTO,
  ChangePublicationStatusDTO,
  PublicationResponseDTO,
  PublicationWithAuthorDTO,
} from '../dto/PublicationDTO';
import { PublicationMapper } from '../util/PublicationMapper';
import { StateValidationFacade } from '../util/StateValidators';
import {
  getAuthorsServiceClient,
  AuthorData,
} from '../client/AuthorsServiceClient';

/**
 * PATRÓN: Service (Business Logic Layer)
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Coordina la lógica de negocio, validaciones y persistencia
 */
export class PublicationService {
  private publicationRepository: PublicationRepository;
  private stateValidationFacade: StateValidationFacade;
  private authorsServiceClient: ReturnType<
    typeof getAuthorsServiceClient
  >;

  constructor() {
    this.publicationRepository = new PublicationRepository();
    this.stateValidationFacade = new StateValidationFacade();
    this.authorsServiceClient = getAuthorsServiceClient();
  }

  /**
   * Crear nueva publicación
   * DEPENDENCIA ENTRE MICROSERVICIOS: Valida que el autor exista
   */
  async createPublication(
    dto: CreatePublicationDTO
  ): Promise<PublicationResponseDTO> {
    // Validar datos requeridos
    if (!dto.title || !dto.content || !dto.authorId) {
      throw new Error('title, content, and authorId are required');
    }

    // PATRÓN: Adapter - Llamar al Authors Service
    // PRINCIPIO SOLID: Dependency Inversion Principle
    const authorExists = await this.authorsServiceClient.authorExists(
      dto.authorId
    );
    if (!authorExists) {
      throw new Error(`Author with id ${dto.authorId} not found`);
    }

    // Obtener datos del autor para enriquecer la publicación
    const authorData = await this.authorsServiceClient.getAuthor(
      dto.authorId
    );

    const publication = new Publication();
    publication.title = dto.title;
    publication.content = dto.content;
    publication.authorId = dto.authorId;
    publication.abstract_text = dto.abstract_text || '';
    publication.keywords = dto.keywords || [];
    publication.status = PublicationStatus.DRAFT;

    // Enriquecer con datos del autor
    if (authorData) {
      publication.authorName = `${authorData.firstName} ${authorData.lastName}`;
      publication.authorEmail = authorData.email;
    }

    const savedPublication = await this.publicationRepository.create(
      publication
    );
    return PublicationMapper.toDTO(savedPublication);
  }

  /**
   * Obtener publicación por ID con datos del autor
   */
  async getPublicationById(
    id: string,
    includeAuthor: boolean = true
  ): Promise<PublicationResponseDTO | PublicationWithAuthorDTO> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new Error(`Publication with id ${id} not found`);
    }

    if (includeAuthor && publication.authorId) {
      const author = await this.authorsServiceClient.getAuthor(
        publication.authorId
      );
      if (author) {
        return PublicationMapper.toDTOWithAuthor(publication, author);
      }
    }

    return PublicationMapper.toDTO(publication);
  }

  /**
   * Listar publicaciones con filtros opcionales
   */
  async listPublications(
    page: number = 1,
    limit: number = 10,
    status?: PublicationStatus
  ): Promise<{
    data: PublicationResponseDTO[];
    total: number;
    page: number;
  }> {
    const skip = (page - 1) * limit;
    const [publications, total] = await this.publicationRepository.findAll(
      skip,
      limit,
      status
    );

    return {
      data: PublicationMapper.toDTOList(publications),
      total,
      page,
    };
  }

  /**
   * Listar publicaciones de un autor
   */
  async listPublicationsByAuthor(
    authorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: PublicationResponseDTO[];
    total: number;
    page: number;
  }> {
    // Verificar que el autor existe
    const authorExists = await this.authorsServiceClient.authorExists(
      authorId
    );
    if (!authorExists) {
      throw new Error(`Author with id ${authorId} not found`);
    }

    const skip = (page - 1) * limit;
    const [publications, total] =
      await this.publicationRepository.findByAuthorId(authorId, skip, limit);

    return {
      data: PublicationMapper.toDTOList(publications),
      total,
      page,
    };
  }

  /**
   * Actualizar publicación
   */
  async updatePublication(
    id: string,
    dto: UpdatePublicationDTO
  ): Promise<PublicationResponseDTO> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new Error(`Publication with id ${id} not found`);
    }

    if (!publication.canBeEdited()) {
      throw new Error(
        `Publication cannot be edited in ${publication.status} status`
      );
    }

    const updated = await this.publicationRepository.update(id, dto);
    if (!updated) {
      throw new Error('Failed to update publication');
    }

    return PublicationMapper.toDTO(updated);
  }

  /**
   * Cambiar estado editorial de una publicación
   * PATRÓN: Strategy Pattern para validación de estados
   */
  async changePublicationStatus(
    id: string,
    dto: ChangePublicationStatusDTO
  ): Promise<PublicationResponseDTO> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new Error(`Publication with id ${id} not found`);
    }

    // Validar transición de estado usando Strategy Pattern
    this.stateValidationFacade.validateTransition(publication, dto.status);

    // Validar que puede hacer la transición
    if (!publication.canTransitionToStatus(dto.status)) {
      throw new Error(
        `Cannot transition from ${publication.status} to ${dto.status}`
      );
    }

    // Actualizar review count si va a review
    if (dto.status === PublicationStatus.IN_REVIEW) {
      publication.reviewCount++;
    }

    const updated = await this.publicationRepository.updateStatus(
      id,
      dto.status,
      dto.reviewNotes
    );
    if (!updated) {
      throw new Error('Failed to update publication status');
    }

    return PublicationMapper.toDTO(updated);
  }

  /**
   * Eliminar publicación
   */
  async deletePublication(id: string): Promise<void> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new Error(`Publication with id ${id} not found`);
    }

    if (publication.status === PublicationStatus.PUBLISHED) {
      throw new Error('Cannot delete published publications');
    }

    const deleted = await this.publicationRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete publication');
    }
  }

  /**
   * Obtener estadísticas
   */
  async getStatistics(): Promise<{
    [key in PublicationStatus]: number;
  }> {
    const stats = {
      [PublicationStatus.DRAFT]: await this.publicationRepository.countByStatus(
        PublicationStatus.DRAFT
      ),
      [PublicationStatus.IN_REVIEW]:
        await this.publicationRepository.countByStatus(
          PublicationStatus.IN_REVIEW
        ),
      [PublicationStatus.APPROVED]:
        await this.publicationRepository.countByStatus(
          PublicationStatus.APPROVED
        ),
      [PublicationStatus.PUBLISHED]:
        await this.publicationRepository.countByStatus(
          PublicationStatus.PUBLISHED
        ),
      [PublicationStatus.REJECTED]:
        await this.publicationRepository.countByStatus(
          PublicationStatus.REJECTED
        ),
    };
    return stats;
  }
}
