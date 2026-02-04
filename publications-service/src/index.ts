import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { PublicationController } from './controller/PublicationController';

const app: Express = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Controladores
const publicationController = new PublicationController();

// Rutas de Publicaciones
app.post('/publications', (req, res) =>
  publicationController.createPublication(req, res)
);
app.get('/publications/:id', (req, res) =>
  publicationController.getPublication(req, res)
);
app.get('/publications/author/:authorId', (req, res) =>
  publicationController.listPublicationsByAuthor(req, res)
);
app.get('/publications', (req, res) =>
  publicationController.listPublications(req, res)
);
app.patch('/publications/:id', (req, res) =>
  publicationController.updatePublication(req, res)
);
app.patch('/publications/:id/status', (req, res) =>
  publicationController.changePublicationStatus(req, res)
);
app.delete('/publications/:id', (req, res) =>
  publicationController.deletePublication(req, res)
);

// Estadísticas
app.get('/stats/overview', (req, res) =>
  publicationController.getStatistics(req, res)
);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Publications Service is running' });
});

// Error 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Inicializar base de datos y servidor
AppDataSource.initialize()
  .then(() => {
    console.log('Publications Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Publications Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

export default app;
