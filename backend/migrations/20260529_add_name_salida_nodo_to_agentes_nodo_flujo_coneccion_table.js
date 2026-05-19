exports.up = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo_coneccion').then((exists) => {
    if (!exists) return;

    return knex.schema.alterTable('agentes_nodo_flujo_coneccion', (table) => {
      table.string('name_salida_nodo').nullable();
      table.dropUnique(['id_nodo_origen', 'id_nodo_destino', 'id_flujo']);
      table.unique(['id_nodo_origen', 'id_nodo_destino', 'id_flujo', 'name_salida_nodo']);
    });
  });
};

exports.down = function (knex) {
  return knex.schema.hasTable('agentes_nodo_flujo_coneccion').then((exists) => {
    if (!exists) return;

    return knex.schema.alterTable('agentes_nodo_flujo_coneccion', (table) => {
      table.dropUnique(['id_nodo_origen', 'id_nodo_destino', 'id_flujo', 'name_salida_nodo']);
      table.dropColumn('name_salida_nodo');
      table.unique(['id_nodo_origen', 'id_nodo_destino', 'id_flujo']);
    });
  });
};
