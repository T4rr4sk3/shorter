import Env from '@ioc:Adonis/Core/Env'
import basicLog from 'App/Logger/BasicLogger'
import fs from 'fs'
import { ConnectionConfig as ConnectionConfigMySQL } from 'mysql'
import { ConnectionConfig as ConnectionConfigSQLServer } from 'tedious'
import DatabaseConnectionContract, { SQLTypes } from './IDatabaseConnection'
import { MSSQLConnection } from './MSSQLConnection'
import MySQLConnection from './MySQLConnection'
/** Representa um conector ao banco de dados utilizando uma conexão {@link DatabaseConnectionContract}. */
class DatabaseConnector {
  private _connection: DatabaseConnectionContract
  public SQLTypeInUse: SQLTypes
  public SQLTable: string

  /** Executa uma query na conexão do banco de dados.
   * @see DatabaseConnectionContract.executeQuery
   * {@link DatabaseConnectionContract.executeQuery}
   */
  public executeQuery(
    sql: string,
    params?: any[],
    callback?: (erro?: Error, results?: any) => void
  ) {
    this._connection.executeQuery(sql, params, callback)
  }

  constructor() {
    let tipoSQL = Env.get('SQLTYPE')
    switch (tipoSQL) {
      case 'mysql':
        this._connection = new MySQLConnection()
        this.SQLTypeInUse = SQLTypes.MySQL
        this.SQLTable = Env.get('MYSQLTABLE', '')
        break

      case 'sqlserver':
      case 'mssql':
        this._connection = new MSSQLConnection()
        this.SQLTypeInUse = SQLTypes.SQLServer
        this.SQLTable = Env.get('MSSQLTABLE', '')
        break

      default:
        throw new Error(
          'Tipo do SQL inválido, verifique as variáveis de ambiente ou acesse os logs para verificar o que está acontecendo!'
        )
    }

    if (this.SQLTable === '')
      throw new Error('Tabela SQL não definida para o tipo de SQL selecionado!')
  }

  /** Função para configurar a conexão de acordo com o SQLTypes. */
  private configuraBanco() {
    let config
    switch (this.SQLTypeInUse) {
      case SQLTypes.MySQL:
        {
          //isso é apenas feito para ajudar no desenvolvimento.
          if (!this.validaConfigMySQL())
            throw new Error(
              'Configuração MySQL não definida, favor verificar variáveis do ambiente (environment)'
            )

          config = {
            host: Env.get('MYSQLHOST'),
            user: Env.get('MYSQLUSER'),
            port: Env.get('MYSQLPORT'),
            database: Env.get('MYSQLDATABASE'),
            password: Env.get('MYSQLPASS'),
          } as ConnectionConfigMySQL
        }
        break

      case SQLTypes.SQLServer:
        {
          //exato, Daniel de alguns dias atrás...
          if (!this.validaConfigMSSQL())
            throw new Error(
              'Configuração MSSQL não definida, favor verificar variáveis do ambiente (environment)'
            )

          config = {
            authentication: {
              type: 'default',
              options: { userName: Env.get('MSSQLUSER'), password: Env.get('MSSQLPASS') },
            },
            server: Env.get('MSSQLHOST'),
            options: {
              trustServerCertificate: true,
              database: Env.get('MSSQLDATABASE'),
              rowCollectionOnRequestCompletion: true,
            },
          } as ConnectionConfigSQLServer
        }
        break
    }

    this._connection.config<typeof config>(config) //seta a configuração da conexão.
  }

  /** Valida variáveis de ambiente do MySQL */
  private validaConfigMySQL(): boolean {
    return Boolean(
      Env.get('MYSQLHOST') &&
        Env.get('MYSQLUSER') &&
        Env.get('MYSQLPORT') &&
        Env.get('MYSQLDATABASE')
    ).valueOf()
  }

  /** Valida variáveis de ambiente do MSSQL */
  private validaConfigMSSQL(): boolean {
    return Boolean(
      Env.get('MSSQLUSER') &&
        Env.get('MSSQLPASS') &&
        Env.get('MSSQLHOST') &&
        Env.get('MSSQLDATABASE')
    ).valueOf()
  }

  /** Inicia a conexão com o banco de dados selecionado. */
  public iniciaConexao() {
    try {
      this.configuraBanco()
      this._connection.start(Env.get('SQL_LOGS', true))

      if (Env.get('SQLCREATE', false)) {
        let SCRIPT_PATH: string

        switch (this.SQLTypeInUse) {
          case SQLTypes.MySQL:
            SCRIPT_PATH = Env.get('MYSQLCREATE_SCRIPT', undefined)
            break

          case SQLTypes.SQLServer:
            SCRIPT_PATH = Env.get('MSSQLCREATE_SCRIPT', undefined)
            break
        }

        if (!SCRIPT_PATH)
          throw new Error(
            'Caminho não definido para o script de criação do banco para o sql desejado.\nCreate abortado'
          )

        let script = fs.readFileSync(SCRIPT_PATH).toString('utf8')

        basicLog.geraLog('Script de CREATE lido no caminho: ' + SCRIPT_PATH)
        this._connection.executeQuery(script, [], (err) => {
          if (err) console.log(err)
        })
      }
    } catch (e) {
      console.log('Erro: ' + e.errors ?? e.message) //printa erro
    }
  }

  /** Tenta terminar a conexão com o banco de dados. */
  public terminaConexao() {
    this._connection.stop(false, (e) => {
      if (e) console.log(e.message)
    })
  }
}

const dbConnector = new DatabaseConnector()
export default dbConnector
