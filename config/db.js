import config from '../config.js';
const { DATABASE_URL, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_PORT, DATABASE_USER } = config;

export default {
  username: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  host: DATABASE_URL,
  port: DATABASE_PORT || 3306,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
};