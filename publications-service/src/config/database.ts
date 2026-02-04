import { DataSource } from 'typeorm';
import { Publication, Book } from '../entity/Publication';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db-publications',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'publication_user',
  password: process.env.DB_PASSWORD || 'publication_password',
  database: process.env.DB_NAME || 'publications_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [Publication, Book],
  migrations: [],
  subscribers: [],
});
