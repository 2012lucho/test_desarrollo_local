const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
// Fallback si se desea usar el ejemplo
dotenv.config({ path: '.env.dev' });

module.exports = {
  development: {
    client: 'mariadb',
    connection: {
      host: '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'test'
    },
    pool: { min: 1, max: 5 }
  }
};
