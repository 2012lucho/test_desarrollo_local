/**
 * Migración: agregar campo `id_subproyecto` en `componentes`, vaciar la tabla y eliminar `subproyecto_componentes`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('componentes').then((exists) => {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('componentes', 'id_subproyecto').then((hasColumn) => {
      if (!hasColumn) {
        return knex.schema.table('componentes', (table) => {
          table.integer('id_subproyecto').unsigned().notNullable().references('id').inTable('subproyectos').onDelete('CASCADE');
        });
      }
      return Promise.resolve();
    });
  }).then(() => knex('componentes').del()).then(() => knex.schema.dropTableIfExists('subproyecto_componentes'));
};

exports.down = function(knex) {
  return knex.schema.hasTable('subproyecto_componentes').then((exists) => {
    if (!exists) {
      return knex.schema.createTable('subproyecto_componentes', (table) => {
        table.increments('id').primary();
        table.integer('componente_id').unsigned().notNullable().references('id').inTable('componentes').onDelete('CASCADE');
        table.integer('subproyecto_id').unsigned().notNullable().references('id').inTable('subproyectos').onDelete('CASCADE');
        table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
        table.unique(['componente_id', 'subproyecto_id']);
      });
    }
    return Promise.resolve();
  }).then(() => knex.schema.hasTable('componentes').then((exists) => {
    if (!exists) return Promise.resolve();
    return knex.schema.hasColumn('componentes', 'id_subproyecto').then((hasColumn) => {
      if (hasColumn) {
        return knex.schema.table('componentes', (table) => {
          table.dropColumn('id_subproyecto');
        });
      }
      return Promise.resolve();
    });
  }));
};
