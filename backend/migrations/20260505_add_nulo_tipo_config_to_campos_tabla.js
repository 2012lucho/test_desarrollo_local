/*
 * Migración: agregar columnas `nulo`, `tipo` y `config` a `campos_tabla`
 */
exports.up = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) {
      return Promise.resolve();
    }

    return knex.schema.hasColumn('campos_tabla', 'nulo').then((hasNulo) => {
      const ops = [];

      if (!hasNulo) {
        ops.push(
          knex.schema.alterTable('campos_tabla', (table) => {
            table.boolean('nulo').notNullable().defaultTo(false);
          })
        );
      }

      return Promise.resolve()
        .then(() => (ops.length ? ops[0] : Promise.resolve()))
        .then(() =>
          knex.schema.hasColumn('campos_tabla', 'tipo').then((hasTipo) => {
            if (hasTipo) return Promise.resolve();
            return knex.schema.alterTable('campos_tabla', (table) => {
              table.string('tipo', 100).notNullable().defaultTo('');
            });
          })
        )
        .then(() =>
          knex.schema.hasColumn('campos_tabla', 'config').then((hasConfig) => {
            if (hasConfig) return Promise.resolve();
            return knex.schema.alterTable('campos_tabla', (table) => {
              table.json('config').notNullable().defaultTo('{}');
            });
          })
        );
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('campos_tabla').then((exists) => {
    if (!exists) return Promise.resolve();

    const dropIfExists = (col) =>
      knex.schema.hasColumn('campos_tabla', col).then((has) => {
        if (!has) return Promise.resolve();
        return knex.schema.alterTable('campos_tabla', (table) => {
          table.dropColumn(col);
        });
      });

    return dropIfExists('nulo')
      .then(() => dropIfExists('tipo'))
      .then(() => dropIfExists('config'));
  });
};
