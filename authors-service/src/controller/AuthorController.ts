import { Request, Response } from 'express';
import { AuthorService } from '../service/AuthorService';
import { CreateAuthorDTO, UpdateAuthorDTO } from '../dto/AuthorDTO';
import { ValidationError, NotFoundError, ConflictError } from '../util/errors';

/**
 * PATRÓN: Controller (Presentation Layer)
 * PRINCIPIO SOLID: Single Responsibility Principle
 * Responsable de procesar HTTP requests/responses
 */
export class AuthorController {
  private authorService: AuthorService;

  constructor() {
    this.authorService = new AuthorService();
  }

  /**
   * POST /authors - Crear un nuevo autor
   */
  async createAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { firstName, lastName, email, biography, specialization } =
        req.body;

      // Validar entrada
      if (!firstName || !lastName || !email) {
        throw new ValidationError(
          'firstName, lastName, and email are required'
        );
      }

      const dto: CreateAuthorDTO = {
        firstName,
        lastName,
        email,
        biography,
        specialization,
      };

      const author = await this.authorService.createAuthor(dto);
      res.status(201).json({
        success: true,
        data: author,
        message: 'Author created successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /authors/:id - Obtener autor por ID
   */
  async getAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Author ID is required');
      }

      const author = await this.authorService.getAuthorById(id);
      res.status(200).json({
        success: true,
        data: author,
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * GET /authors - Listar autores con paginación
   */
  async listAuthors(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1) {
        throw new ValidationError('Page and limit must be positive numbers');
      }

      const result = await this.authorService.listAuthors(page, limit);
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
   * PATCH /authors/:id - Actualizar autor
   */
  async updateAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Author ID is required');
      }

      const dto: UpdateAuthorDTO = req.body;
      const author = await this.authorService.updateAuthor(id, dto);

      res.status(200).json({
        success: true,
        data: author,
        message: 'Author updated successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * DELETE /authors/:id - Eliminar autor
   */
  async deleteAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Author ID is required');
      }

      await this.authorService.deleteAuthor(id);
      res.status(200).json({
        success: true,
        message: 'Author deleted successfully',
      });
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Manejo centralizado de errores
   * PRINCIPIO SOLID: Single Responsibility Principle
   */
  private handleError(res: Response, error: any): void {
    console.error('Error:', error);

    if (error instanceof ValidationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else if (error instanceof NotFoundError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else if (error instanceof ConflictError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    } else if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
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
