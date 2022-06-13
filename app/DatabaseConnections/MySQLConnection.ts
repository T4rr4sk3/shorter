import { Connection, MysqlError } from "mysql";
import IDatabaseConnection, { SQLTypes } from "./IDatabaseConnection";
import { BasicLogger } from "App/Logger/BasicLogger";
import Env from '@ioc:Adonis/Core/Env'
import { arrayToString, objectToString } from "App/../utils";

export default class MySQLConnection implements IDatabaseConnection {
    sqlType: SQLTypes;
    sqlDialet: string;
    private _mySQLCon: Connection;
    private _config: any;
    logger: BasicLogger;

    constructor() {
        this.sqlDialet = 'MySQL'
        this.sqlType = SQLTypes.MySQL
        this.logger = new BasicLogger('mysql.log')
    }

    private log(log: string) { this.logger.geraLog(log) }

    getConnection() {
        return this._mySQLCon;
    }

    config<ConnectionConfig>(configuracao: ConnectionConfig): void {
        this._config = configuracao;
    }

    start(exibeLog?: boolean): void {
        try{
            let mysql = require('mysql');

            if(exibeLog) this.log('Tentando iniciar a conexão MySQL...')//Configurações: ' + JSON.stringify(this._config, undefined, 2));

            this._mySQLCon = mysql.createConnection(this._config);

            let con = this._mySQLCon;

            con.connect((erro) => { 
                if(exibeLog) {
                    if(erro) {
                        let msg = erro.sqlMessage ?? erro.message;
                        console.log(msg);
                        this.log(msg);

                    } else{
                        console.log(' Conexão feita com sucesso! Dialeto: ' + this.sqlDialet);
                        this.log('Conexão feita com sucesso usando as configurações do servidor.');
                        if(Env.get('EXIBE_CONFIG', false)) this.log('Configurações:\n' + objectToString(this._config));
                    }
                }
            })

        } catch(err) {
            if(exibeLog) { console.log(err.message); this.log(err.message) }
            throw err;
        }
    }

    stop(imediato?: boolean, callback?: ((erro?: MysqlError) => void)) {
        if(imediato) this._mySQLCon.destroy();

        else this._mySQLCon.end(callback);

        this.log('Conexão desfeita. Imediato? ' + (imediato)? 'sim':'não' + ' Dialeto: ' + this.sqlDialet);
    }

    executeQuery(sql: string, params?: any[], callback?: ((erro?: Error, result?: any) => void) | undefined) {
        this.log('Executando query: ' + sql)
        if(params) this.log('Parametrôs da query acima: ' + arrayToString(params))
        this._mySQLCon.query(sql, params, (err, results) => { callback && callback(err ?? undefined, results) });
    }
}