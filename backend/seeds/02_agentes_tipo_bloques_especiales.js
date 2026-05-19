exports.seed = async function (knex) {
  await knex('agentes_tipo_bloques_especiales').del();
  await knex('agentes_tipo_bloques_especiales').insert([
    {
      nombre: 'IF',
      descripcion: '',
      config_entrada: {},
      config_general: {},
      config_salida: {}
    },
    {
      nombre: 'SWITCH',
      descripcion: '',
      config_entrada: {},
      config_general: {},
      config_salida: {}
    },
    {
      nombre: 'GET_DIRECTORIOS',
      descripcion: 'Obtencion de directorios',
      config_entrada: {},
      config_general: {},
      config_salida: {}
    },
    {
      nombre: 'CHAT_OUT',
      descripcion: 'Salida de texto que imprime mensaje en chat y guarda registro en base de datos',
      config_entrada: {},
      config_general: {},
      config_salida: {}
    },
    {
      nombre: 'CHAT_IN',
      descripcion: 'Entrada de texto que recibe mensaje del chat y guarda registro en base de datos',
      config_entrada: {},
      config_general: {},
      config_salida: {}
    }
  ]);
};
