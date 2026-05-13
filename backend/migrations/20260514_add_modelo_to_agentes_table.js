exports.up = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (!exists) return Promise.resolve();

    return knex.schema.hasColumn('agentes', 'modelo').then((hasColumn) => {
      if (hasColumn) return Promise.resolve();
      return knex.schema.alterTable('agentes', (table) => {
        table.string('modelo', 255).nullable();
      });
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes').then((exists) => {
    if (!exists) return Promise.resolve();
    return knex.schema.alterTable('agentes', (table) => {
      table.dropColumn('modelo');
    });
  });
};
