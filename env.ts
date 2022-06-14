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
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  APP_MASTER_USER: Env.schema.string(),
  APP_MASTER_PASS: Env.schema.string(),
  APP_SALT: Env.schema.string(),
  APP_CERT_PATH: Env.schema.string(),
  CACHE_VIEWS: Env.schema.boolean(),
  SESSION_DRIVER: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum(['local'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  ORIGIN: Env.schema.string(),
  DOMAIN: Env.schema.string(),
  SQLTYPE: Env.schema.enum(['mysql', 'sqlserver']),
  MYSQLHOST: Env.schema.string({ format: 'host' }),
  MYSQLPORT: Env.schema.number(),
  MYSQLUSERDB: Env.schema.string(),
  MYSQLPASSDB: Env.schema.string(),
  MYSQLDATABASE: Env.schema.string(),
  MSSQLHOST: Env.schema.string({ format: 'host' }),
  MSSQLUSER: Env.schema.string(),
  MSSQLPASS: Env.schema.string(),
  MSSQLDATABASE: Env.schema.string(),
  CODE_LENGHT: Env.schema.number(),
  CREATE: Env.schema.boolean(),
  TOKEN_EXPIRES_IN: Env.schema.number(),
  LOGS_PATH: Env.schema.string(),
  SQL_LOGS: Env.schema.boolean(),
  EXIBE_CONFIG: Env.schema.boolean(),
})
