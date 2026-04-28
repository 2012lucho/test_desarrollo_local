/**
 * Migración: agregar columna `color` a `tecnologias`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }
    return knex.schema.hasColumn('tecnologias', 'color').then((hasColumn) => {
      if (hasColumn) {
        return Promise.resolve();
      }
      return knex.schema.table('tecnologias', (table) => {
        table.string('color', 30).nullable();
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('tecnologias').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }
    return knex.schema.hasColumn('tecnologias', 'color').then((hasColumn) => {
      if (!hasColumn) {
        return Promise.resolve();
      }
      return knex.schema.table('tecnologias', (table) => {
        table.dropColumn('color');
      });
    });
  });
};
