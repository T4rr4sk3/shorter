import IDatabaseConnection, { SQLTypes } from "./IDatabaseConnection";
import Env from '@ioc:Adonis/Core/Env'
import MySQLConnection from "./MySQLConnection";
import { ConnectionConfig as ConnectionConfigMySQL } from "mysql";
import { ConnectionConfig as ConnectionConfigSQLServer } from "tedious";
import { MSSQLConnection } from "./MSSQLConnection";
import fs from 'fs'
import basicLog from "App/Logger/BasicLogger";

class DatabaseConnector {
    private _connection: IDatabaseConnection;
    SQLTypeInUse: SQLTypes;
    SQLTable: string;

    /** Executa uma query na conexão do banco de dados.
     * @see IDatabaseConnection.executeQuery
     * {@link IDatabaseConnection.executeQuery} */
    executeQuery(sql: string, params?: any[], callback?: (erro?: Error, results?: any) => void) {
        this._connection.executeQuery(sql, params, callback);
    };

    constructor() {
        let tipoSQL = Env.get('SQLTYPE');        
        switch(tipoSQL){
            case 'mysql':
                this._connection = new MySQLConnection();
                this.SQLTypeInUse = SQLTypes.MySQL;
                this.SQLTable = Env.get('MYSQLTABLE', 'link')
                break;

            case 'sqlserver':
            case 'mssql':
                this._connection = new MSSQLConnection();
                this.SQLTypeInUse = SQLTypes.SQLServer;
                this.SQLTable = Env.get('MSSQLTABLE','dbo.link')
                break;

            default:
                throw new Error('Tipo do SQL inválido, verifique as variáveis de ambiente ou acesse os logs para verificar o que está acontecendo!')
        }        
    }
    
    /** Função para configurar a conexão de acordo com o SQLTypes. */
    private configuraBanco(){
        let config;
        switch(this.SQLTypeInUse){
            case SQLTypes.MySQL: { //isso é apenas feito para ajudar no desenvolvimento.
                config = { 
                    host: Env.get('MYSQLHOST'), user: Env.get('MYSQLUSERDB'), port: Env.get('MYSQLPORT'), database: Env.get('MYSQLDATABASE') 
                } as ConnectionConfigMySQL 
            } break;

            case SQLTypes.SQLServer: { //exato, Daniel de alguns dias atrás...
                config = { 
                    authentication: { type: 'default', options: { userName: Env.get('MSSQLUSER'), password: Env.get('MSSQLPASS') } },
                    server: Env.get('MSSQLHOST'),
                    options: { trustServerCertificate: true, database: Env.get('MSSQLDATABASE'), rowCollectionOnRequestCompletion: true }
                } as ConnectionConfigSQLServer
            } break;

        }

        this._connection.config<typeof config>(config); //seta a configuração da conexão.
    }

    /** Inicia a conexão com o banco de dados selecionado. */
    iniciaConexao(){
        try{
            this.configuraBanco()
            this._connection.start(Env.get('SQL_LOGS', true));

            if(Env.get('SQLCREATE', false)){
                let script_path: string;

                switch(this.SQLTypeInUse) {
                    case SQLTypes.MySQL: 
                        script_path = Env.get('MYSQLCREATE_SCRIPT', undefined); break;
                    
                    case SQLTypes.SQLServer:
                        script_path = Env.get('MSSQLCREATE_SCRIPT', undefined); break;
                }

                if(!script_path) throw new Error('Caminho não definido para o script de criação do banco para o sql desejado.\nCreate abortado')

                let script = fs.readFileSync(script_path).toString('utf8')

                basicLog.geraLog('Script de CREATE lido no caminho: ' + script_path)
                this._connection.executeQuery(script, [], (err) => { if(err) console.log(err) })
            }
        }catch(e){
            console.log('Erro: ' + e.message) //printa erro
        }
    }

    /** Tenta terminar a conexão com o banco de dados. */
    terminaConexao(){
        this._connection.stop(false, (e) => { if(e) console.log(e.message) })
    }
}

const dbConnector = new DatabaseConnector();
export default dbConnector