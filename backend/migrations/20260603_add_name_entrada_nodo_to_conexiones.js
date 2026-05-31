exports.up = function (knex) {
  return knex.schema.hasColumn('agentes_nodo_flujo_coneccion', 'name_entrada_nodo').then((exists) => {
    if (!exists) {
      return knex.schema.table('agentes_nodo_flujo_coneccion', (table) => {
        table.string('name_entrada_nodo', 255).nullable();
      });
    }
    return null;
  });
};

exports.down = function (knex) {
  return knex.schema.hasColumn('agentes_nodo_flujo_coneccion', 'name_entrada_nodo').then((exists) => {
    if (exists) {
      return knex.schema.table('agentes_nodo_flujo_coneccion', (table) => {
        table.dropColumn('name_entrada_nodo');
      });
    }
    return null;
  });
};
