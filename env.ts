/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  /** Host onde esta aplicação roda. */
  HOST: Env.schema.string({ format: 'host' }),
  /** Porta da aplicação. */
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  APP_MASTER_USER: Env.schema.string(),
  APP_MASTER_PASS: Env.schema.string(),
  APP_SALT: Env.schema.string(),
  APP_CERT_PATH: Env.schema.string.optional(),
  CACHE_VIEWS: Env.schema.boolean(),
  SESSION_DRIVER: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  ORIGIN: Env.schema.string(),
  DOMAIN: Env.schema.string(),
  SQLTYPE: Env.schema.enum(['mysql', 'sqlserver']),
  SQLCREATE: Env.schema.boolean.optional(),
  //MYSQL
  MYSQLHOST: Env.schema.string.optional({ format: 'host' }),
  MYSQLPORT: Env.schema.number.optional(),
  MYSQLUSER: Env.schema.string.optional(),
  MYSQLPASS: Env.schema.string.optional(),
  MYSQLDATABASE: Env.schema.string.optional(),
  MYSQLTABLE: Env.schema.string.optional(),
  MYSQLCREATE_SCRIPT: Env.schema.string.optional(),
  //SQLSERVER
  MSSQLHOST: Env.schema.string.optional({ format: 'host' }),
  MSSQLUSER: Env.schema.string.optional(),
  MSSQLPASS: Env.schema.string.optional(),
  MSSQLDATABASE: Env.schema.string.optional(),
  MSSQLTABLE: Env.schema.string.optional(),
  MSSQLCREATE_SCRIPT: Env.schema.string.optional(),
  //UTILS
  CODE_LENGHT: Env.schema.number(),
  TOKEN_EXPIRES_IN: Env.schema.number(),
  LOGS_PATH: Env.schema.string(),
  SQL_LOGS: Env.schema.boolean.optional(),
  EXIBE_CONFIG: Env.schema.boolean(),
})
