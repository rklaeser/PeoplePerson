import { Sequelize } from 'sequelize';
import 'dotenv/config';

const connectionString = process.env.DB_URL;

if (!connectionString) throw new Error('Database url not defined');

export const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}); 