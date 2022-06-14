import IDatabaseConnection, { SQLTypes } from "./IDatabaseConnection";
import Env from '@ioc:Adonis/Core/Env'
import MySQLConnection from "./MySQLConnection";
import { ConnectionConfig as ConnectionConfigMySQL } from "mysql";
import { ConnectionConfig as ConnectionConfigSQLServer } from "tedious";
import { MSSQLConnection } from "./MSSQLConnection";

class DatabaseConnector {
    private _connection: IDatabaseConnection;
    SQLTypeInUse: SQLTypes;

    executeQuery(sql: string, params?: any[], callback?: (erro?: Error, results?: any) => void) {
        this._connection.executeQuery(sql, params, callback);
    };

    constructor() {
        let tipoSQL = Env.get('SQLTYPE');        
        switch(tipoSQL){
            case 'mysql':
                this._connection = new MySQLConnection();
                this.SQLTypeInUse = SQLTypes.MySQL;                
                break;

            case 'sqlserver':
            case 'mssql':
                this._connection = new MSSQLConnection();
                this.SQLTypeInUse = SQLTypes.SQLServer;
                break;

            default:
                throw new Error('Tipo do SQL inválido, verifique as variáveis de ambiente ou acesse os logs para verificar o que está acontecendo!')
        }        
    }
    
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

    iniciaConexao(){
        try{
            this.configuraBanco()
            this._connection.start(Env.get('SQL_LOGS', true));
        }catch(e){
            console.log(e) //printa erro
        }
    }

    terminaConexao(){
        this._connection.stop(false, (e) => { if(e) console.log(e.message) })
    }
}

const dbConnector = new DatabaseConnector();
export default dbConnector