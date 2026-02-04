import { DataSource } from 'typeorm';
import { Author, Editor } from '../entity/Author';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'db-authors',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'author_user',
  password: process.env.DB_PASSWORD || 'author_password',
  database: process.env.DB_NAME || 'authors_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [Author, Editor],
  migrations: [],
  subscribers: [],
});
