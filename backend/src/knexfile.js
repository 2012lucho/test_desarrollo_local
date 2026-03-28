const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
const envDevPath = path.resolve(__dirname, '../.env.dev');

dotenv.config({ path: envPath });
// Fallback si se desea usar el ejemplo
dotenv.config({ path: envDevPath });

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'test'
    },
    pool: { min: 1, max: 5 },
    migrations: {
      tableName: 'knex_migrations',
      directory: `${__dirname}/../migrations`
    }
  }
};
