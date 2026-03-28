const knex = require('knex');
const config = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Ejecutar migraciones automáticamente al iniciar (para mantener esquema en db.md)
const runMigrations = async () => {
  try {
    const [batchNo, log] = await db.migrate.latest();
    console.log(`Migraciones aplicadas batch ${batchNo}:`, log);
  } catch (err) {
    console.error('Error al ejecutar migraciones:', err);
    process.exit(1);
  }
};

runMigrations();

module.exports = db;
