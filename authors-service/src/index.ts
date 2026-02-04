import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { AuthorController } from './controller/AuthorController';

const app: Express = express();
const PORT = process.env.PORT || 3001;

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
const authorController = new AuthorController();

// Rutas de Autores
app.post('/authors', (req, res) => authorController.createAuthor(req, res));
app.get('/authors/:id', (req, res) => authorController.getAuthor(req, res));
app.get('/authors', (req, res) => authorController.listAuthors(req, res));
app.patch('/authors/:id', (req, res) =>
  authorController.updateAuthor(req, res)
);
app.delete('/authors/:id', (req, res) =>
  authorController.deleteAuthor(req, res)
);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Authors Service is running' });
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
    console.log('Authors Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Authors Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });

export default app;
