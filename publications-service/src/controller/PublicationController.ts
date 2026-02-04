import { Request, Response } from 'express';
import { PublicationService } from '../service/PublicationService';
import {
  CreatePublicationDTO,
  UpdatePublicationDTO,
  ChangePublicationStatusDTO,
} from '../dto/PublicationDTO';
import { PublicationStatus } from '../entity/Publication';

/**
 * PATRÓN: Controller (Presentation Layer)
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Responsable de procesar requests/responses HTTP
 */
export class PublicationController {
  private publicationService: PublicationService;

  constructor() {
    this.publicationService = new PublicationService();
  }

  /**
   * POST /publications - Crear publicación
   */
  async createPublication(req: Request, res: Response): Promise<void> {
    try {
      const { title, content, abstract_text, authorId, keywords } = req.body;

      if (!title || !content || !authorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'title, content, and authorId are required',
          },
        });
        return;
      }

      const dto: CreatePublicationDTO = {
        title,
        content,
        abstract_text,
        authorId,
        keywords,
      };

      const publication =
        await this.publicationService.createPublication(dto);
      res.status(201).json({
        success: true,
        data: publication,
        message: 'Publication created successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /publications/:id - Obtener publicación
   */
  async getPublication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const includeAuthor = req.query.includeAuthor !== 'false';

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Publication ID is required',
          },
        });
        return;
      }

      const publication = await this.publicationService.getPublicationById(
        id,
        includeAuthor
      );
      res.status(200).json({
        success: true,
        data: publication,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /publications - Listar publicaciones
   */
  async listPublications(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as PublicationStatus | undefined;

      if (page < 1 || limit < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page and limit must be positive numbers',
          },
        });
        return;
      }

      const result = await this.publicationService.listPublications(
        page,
        limit,
        status
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /publications/author/:authorId - Listar publicaciones de un autor
   */
  async listPublicationsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!authorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Author ID is required',
          },
        });
        return;
      }

      const result =
        await this.publicationService.listPublicationsByAuthor(
          authorId,
          page,
          limit
        );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /publications/:id - Actualizar publicación
   */
  async updatePublication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Publication ID is required',
          },
        });
        return;
      }

      const dto: UpdatePublicationDTO = req.body;
      const publication = await this.publicationService.updatePublication(
        id,
        dto
      );

      res.status(200).json({
        success: true,
        data: publication,
        message: 'Publication updated successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * PATCH /publications/:id/status - Cambiar estado editorial
   */
  async changePublicationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Publication ID is required',
          },
        });
        return;
      }

      if (!status || !Object.values(PublicationStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `status must be one of: ${Object.values(
              PublicationStatus
            ).join(', ')}`,
          },
        });
        return;
      }

      const dto: ChangePublicationStatusDTO = { status, reviewNotes };
      const publication =
        await this.publicationService.changePublicationStatus(id, dto);

      res.status(200).json({
        success: true,
        data: publication,
        message: `Publication status changed to ${status}`,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * DELETE /publications/:id - Eliminar publicación
   */
  async deletePublication(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Publication ID is required',
          },
        });
        return;
      }

      await this.publicationService.deletePublication(id);
      res.status(200).json({
        success: true,
        message: 'Publication deleted successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /publications/stats/overview - Estadísticas
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.publicationService.getStatistics();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(res: Response, error: any): void {
    console.error('Error:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    } else if (error.message.includes('required')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    } else if (error.message.includes('cannot be edited')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: error.message,
        },
      });
    } else if (error.message.includes('Cannot transition')) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}
