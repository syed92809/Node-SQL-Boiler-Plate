/**
 * Created by hassan.raza on 05/09/2024.
 */

/*--------------------INCLUDE PACKAGES--------------------*/
import { Sequelize } from 'sequelize';
import dbConfig from '../config/db.js';

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    pool: dbConfig.pool,
    logging: dbConfig.logging
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Handle connection events
sequelize.connectionManager.on('disconnect', () => {
  console.log('Database connection disconnected');
});

// Handle process termination
process.on('SIGINT', () => {
  sequelize.close().then(() => {
    console.log('Database connection closed through app termination');
    process.exit(0);
  });
});

export default sequelize;