# Definiciones relacionadas a configuración de base de datos

## Flujo de migraciones Knex
- Se usa `knex` para migrar esquema
- Archivo de migración: `backend/migrations/20260328_create_proyectos_table.js`
- Ejecutar: `npm run migrate`
- Reversar: `npm run migrate:rollback`

# Tablas
## proyectos
- id integer pk autoincremental
- nombre varchar (50) notnull
- descripcion varchar (255) notnull
- repositorio varchar (255) null
- directorio_base varchar (512) notnull
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## subproyectos
- id integer pk autoincremental
- proyecto_id integer fk referencias proyectos(id) notnull
- nombre varchar (100) notnull
- descripcion varchar (512) notnull default ''
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## componentes
- id integer pk autoincremental
- proyecto_id integer fk referencias proyectos(id) notnull
- nombre varchar (100) notnull
- descripcion varchar (1024) notnull
- config json notnull
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## agentes
- id varchar (255) pk
- nombre varchar (255) null
- descripcion text null
- promt_sistema text null
- modelo varchar (255) null

## agentes_nodo_flujo
- id integer pk autoincremental
- nombre varchar (255) notnull
- pos_canvas_x integer null
- pos_canvas_y integer null
- id_agente varchar (255) null
- id_tipo_bloque integer notnull
- id_flujo integer notnull

## agentes_nodo_flujo_coneccion
- id integer pk autoincremental
- id_nodo_origen integer fk referencias agentes_nodo_flujo(id) notnull
- id_nodo_destino integer fk referencias agentes_nodo_flujo(id) notnull
- id_flujo integer fk referencias agentes_flujos(id) notnull
- name_salida_nodo varchar (255) null

## agentes_flujos
- id integer pk autoincremental
- nombre varchar (255) notnull

## ejecucion_flujo
- id integer pk autoincremental
- fecha_hora_inicio datetime notnull
- fecha_hora_fin datetime null
- id_flujo integer notnull

## registro_ejecucion_flujo
- id integer pk autoincremental
- id_flujo integer notnull
- id_ejecucion integer notnull
- fecha_hora_ini datetime notnull
- fecha_hora_fin datetime null
- data_entrada json null
- data_salida json null

## agentes_tipo_bloques_especiales
- id integer pk autoincremental
- nombre varchar (255) notnull
- descripcion text null
- config_entrada json null
- config_general json null
- config_salida json null

## tecnologias
- id integer pk autoincremental
- nombre varchar (100) notnull
- color varchar (30) null
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## subproyecto_componentes
- id integer pk autoincremental
- componente_id integer fk referencias componentes(id) notnull
- subproyecto_id integer fk referencias subproyectos(id) notnull
- creado_el datetime notnull (default now)
- unique (componente_id, subproyecto_id)

## tablas_db_proyectos
- id integer pk autoincremental
- nombre varchar (100) notnull
- proyecto_id integer fk referencias proyectos(id) notnull
- pos_canvas_x integer null
- pos_canvas_y integer null

## campos_tabla
- id integer pk autoincremental
- nombre varchar (100) notnull
- tipo varchar (100) notnull default ''
- longitud integer null
- descripcion text null
- proyecto_id integer fk referencias proyectos(id) notnull
- id_tabla integer fk referencias tablas_db_proyectos(id) notnull
- orden integer notnull default 0
- nulo boolean notnull default false
- clave_primaria boolean notnull default false
- autoincremental boolean notnull default false

## relacion_tabla
- id integer pk autoincremental
- id_campo_1 integer fk referencias campos_tabla(id) notnull
- id_campo_2 integer fk referencias campos_tabla(id) notnull
- tipo_relacion varchar(10) notnull default '1-1'
