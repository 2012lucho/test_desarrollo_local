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
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## subproyectos
- id integer pk autoincremental
- proyecto_id integer fk referencias proyectos(id) notnull
- nombre varchar (100) notnull
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## componentes
- id integer pk autoincremental
- proyecto_id integer fk referencias proyectos(id) notnull
- nombre varchar (100) notnull
- descripcion varchar (255) notnull
- config json notnull
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)

## tecnologias
- id integer pk autoincremental
- nombre varchar (100) notnull
- creado_el datetime notnull (default now)
- actualizado_el datetime notnull (default now)