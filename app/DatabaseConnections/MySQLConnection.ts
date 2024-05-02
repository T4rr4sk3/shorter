import Env from '@ioc:Adonis/Core/Env'
import { arrayToString, objectToString } from 'App/../utils'
import { BasicLogger } from 'App/Logger/BasicLogger'
import { Connection, MysqlError } from 'mysql'
import DatabaseConnectionContract, { SQLTypes } from './IDatabaseConnection'
/** Conexão do mysql utilizando a interface {@link DatabaseConnectionContract}. */
export default class MySQLConnection implements DatabaseConnectionContract {
  public sqlType: SQLTypes
  public sqlDialet: string
  private _mySQLCon: Connection
  private _config: any
  public logger: BasicLogger

  constructor() {
    this.sqlDialet = 'MySQL'
    this.sqlType = SQLTypes.MySQL
    this.logger = new BasicLogger('mysql.log')
  }

  private log(log: string) {
    this.logger.geraLog(log)
  }

  public getConnection() {
    return this._mySQLCon
  }

  public config<ConnectionConfig>(configuracao: ConnectionConfig): void {
    this._config = configuracao
  }

  public start(exibeLog?: boolean): void {
    try {
      let mysql = require('mysql')

      if (exibeLog) this.log('Tentando iniciar a conexão MySQL...') //Configurações: ' + JSON.stringify(this._config, undefined, 2));

      this._mySQLCon = mysql.createConnection(this._config)

      let con = this._mySQLCon

      con.connect((erro) => {
        if (exibeLog) {
          if (erro) {
            let msg = erro.sqlMessage ?? erro.message
            console.log(msg)
            this.log(msg)
          } else {
            console.log(' Conexão feita com sucesso! Dialeto: ' + this.sqlDialet)
            this.log('Conexão feita com sucesso usando as configurações do servidor.')
            if (Env.get('EXIBE_CONFIG', false))
              this.log('Configurações:\n' + objectToString(this._config))
          }
        }
      })
    } catch (err) {
      if (exibeLog) {
        console.log(err.message)
        this.log(err.message)
      }
      throw err
    }
  }

  public stop(imediato?: boolean, callback?: (erro?: MysqlError) => void) {
    if (imediato) this._mySQLCon.destroy()
    else this._mySQLCon.end(callback)

    this.log(
      'Conexão desfeita. Imediato? ' + imediato ? 'sim' : 'não' + ' Dialeto: ' + this.sqlDialet
    )
  }

  public executeQuery(
    sql: string,
    params?: any[],
    callback?: ((erro?: Error, result?: any) => void) | undefined
  ) {
    this.log('Executando query: ' + sql)
    if (params) this.log('Parametrôs da query acima: ' + arrayToString(params))
    this._mySQLCon.query(sql, params, (err, results) => {
      callback && callback(err ?? undefined, results)
    })
  }
}
