import axios, { AxiosInstance } from 'axios';

/**
 * PATRÓN: Adapter (Adaptador HTTP)
 * PRINCIPIO SOLID: Dependency Inversion Principle (DIP)
 * Abstrae la comunicación HTTP con el Authors Service
 * Maneja timeouts, reintentos y errores
 */
export interface AuthorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
}

export interface AuthorResponse {
  success: boolean;
  data: AuthorData;
}

export class AuthorsServiceClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.baseURL =
      process.env.AUTHORS_SERVICE_URL || 'http://authors-service:3001';
    this.timeout = parseInt(process.env.HTTP_TIMEOUT || '5000');
    this.maxRetries = 3;

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verificar que un autor existe
   * PRINCIPIO SOLID: Single Responsibility
   */
  async authorExists(authorId: string): Promise<boolean> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.axiosInstance.get<AuthorResponse>(
          `/authors/${authorId}`
        );
      });
      return response.status === 200;
    } catch (error) {
      console.error(`Error checking if author ${authorId} exists:`, error);
      return false;
    }
  }

  /**
   * Obtener datos del autor
   * PATRÓN: Retry Pattern para manejo de fallos
   */
  async getAuthor(authorId: string): Promise<AuthorData | null> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.axiosInstance.get<AuthorResponse>(
          `/authors/${authorId}`
        );
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching author ${authorId}:`, error);
      return null;
    }
  }

  /**
   * Implementación de reintentos con backoff exponencial
   * PATRÓN: Retry Pattern
   * PRINCIPIO SOLID: Single Responsibility
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(
          `Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Validar que el servicio está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Authors Service health check failed:', error);
      return false;
    }
  }
}

// Instancia singleton
let instance: AuthorsServiceClient | null = null;

export function getAuthorsServiceClient(): AuthorsServiceClient {
  if (!instance) {
    instance = new AuthorsServiceClient();
  }
  return instance;
}
