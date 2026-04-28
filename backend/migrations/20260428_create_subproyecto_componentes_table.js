/**
 * Migración: crear tabla `subproyecto_componentes` para la relación n-n entre subproyectos y componentes
 */
exports.up = function(knex) {
  return knex.schema.hasTable('subproyecto_componentes').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('subproyecto_componentes', (table) => {
      table.increments('id').primary();
      table.integer('componente_id').unsigned().notNullable().references('id').inTable('componentes').onDelete('CASCADE');
      table.integer('subproyecto_id').unsigned().notNullable().references('id').inTable('subproyectos').onDelete('CASCADE');
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.unique(['componente_id', 'subproyecto_id']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subproyecto_componentes');
};
