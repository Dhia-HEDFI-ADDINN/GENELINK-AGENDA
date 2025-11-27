import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'user_db',
  ssl: process.env.DATABASE_SSL === 'true',
  poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  logging: process.env.DATABASE_LOGGING === 'true',
}));
