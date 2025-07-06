import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Player } from './player/player.entity';
import { Party } from './party/party.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [Player, Party],
  migrations: ['dist/migrations/*.js'],
});
