/*
 * Migración: ampliar columna `descripcion` de `componentes` a 1024 caracteres
 */
exports.up = function(knex) {
  return knex.schema.hasTable('componentes').then((exists) => {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('componentes', 'descripcion').then((hasDescripcion) => {
      if (!hasDescripcion) return Promise.resolve();
      return knex.schema.alterTable('componentes', (table) => {
        table.string('descripcion', 1024).notNullable().alter();
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('componentes').then((exists) => {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('componentes', 'descripcion').then((hasDescripcion) => {
      if (!hasDescripcion) return Promise.resolve();
      return knex.schema.alterTable('componentes', (table) => {
        table.string('descripcion', 255).notNullable().alter();
      });
    });
  });
};
