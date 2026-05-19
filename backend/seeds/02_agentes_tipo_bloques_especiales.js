exports.seed = async function (knex) {
  await knex('agentes_tipo_bloques_especiales').del();
  await knex('agentes_tipo_bloques_especiales').insert([
    {
      nombre: 'IF',
      descripcion: '',
      modelo_config: {}
    },
    {
      nombre: 'SWITCH',
      descripcion: '',
      modelo_config: {}
    },
    {
      nombre: 'GET_DIRECTORIOS',
      descripcion: 'Obtencion de directorios',
      modelo_config: {}
    },
    {
      nombre: 'CHAT_OUT',
      descripcion: 'Salida de texto que imprime mensaje en chat y guarda registro en base de datos',
      modelo_config: {}
    },
    {
      nombre: 'CHAT_IN',
      descripcion: 'Entrada de texto que recibe mensaje del chat y guarda registro en base de datos',
      modelo_config: {}
    }
  ]);
};
