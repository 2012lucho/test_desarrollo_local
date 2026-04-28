/**
 * Migración: crear tabla `subproyecto_tecnologias` para la relación n-n entre subproyectos y tecnologías
 */
exports.up = function(knex) {
  return knex.schema.hasTable('subproyecto_tecnologias').then((exists) => {
    if (exists) {
      return Promise.resolve();
    }
    return knex.schema.createTable('subproyecto_tecnologias', (table) => {
      table.increments('id').primary();
      table.integer('subproyecto_id').unsigned().notNullable().references('id').inTable('subproyectos').onDelete('CASCADE');
      table.integer('tecnologia_id').unsigned().notNullable().references('id').inTable('tecnologias').onDelete('CASCADE');
      table.dateTime('creado_el').notNullable().defaultTo(knex.fn.now());
      table.unique(['subproyecto_id', 'tecnologia_id']);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subproyecto_tecnologias');
};
