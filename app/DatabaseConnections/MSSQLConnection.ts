import { Connection, TYPES, Request, ColumnMetaData } from 'tedious'
import IDatabaseConnection, { SQLTypes } from "./IDatabaseConnection";
import { BasicLogger } from "App/Logger/BasicLogger";
import Env from '@ioc:Adonis/Core/Env'
import { objectToString } from 'App/../utils';

export class MSSQLConnection implements IDatabaseConnection{    
    sqlType: SQLTypes;
    sqlDialet: string;
    private _sqlCon: Connection; 
    private _config: any;
    logger: BasicLogger;

    constructor(){
        this.sqlDialet = 'SQLServer'
        this.sqlType = SQLTypes.SQLServer
        this.logger = new BasicLogger('sqlserver.log')
    }

    private log(log: string) { this.logger.geraLog(log) }

    getConnection() {
        return this._sqlCon;
    }

    config<ConnectionConfig>(configuracao: ConnectionConfig): void {
        this._config = configuracao
    }

    start(exibeLog?: boolean): void {
        try{
            this._sqlCon = new Connection(this._config);

            if(exibeLog) this.log('Iniciando conexão com o banco...')

            this._sqlCon.connect((err) => {
                if(exibeLog){
                    if(err) {
                        console.log(err.message);
                        this.log(err.message)

                    } else {
                        console.log('Conexão estabelecida. Dialeto: ' + this.sqlDialet);
                        this.log('Conexão estabelecida com sucesso.')
                        if(Env.get('EXIBE_CONFIG', false)) this.log('Configurações:\n' + objectToString(this._config))
                        //this._sqlCon.on('debug', (message) => { this.log(message) })
                    }
                }
            })
        } catch(err){
            if(exibeLog) { console.log(err.message); this.log(err.message) }
            throw err
        }
    }

    stop(imediato?: boolean, callback?: (erro?: Error) => void) {
        if(!imediato) //se não for imediato, bota o callback antes de fechar
            this._sqlCon.on('end', () => { callback && callback() } )

        this._sqlCon.close();
    }

    private getSQLType(param: any) { 
        switch(typeof param){
            case 'number':
                return TYPES.Int

            case 'string':
                return TYPES.NVarChar

            case 'object': 
                if(param instanceof Date)
                    return TYPES.DateTime
            

            default:
                return TYPES.VarBinary
        }
    }

    /** Pega uma string sql que possua o caractere `?` e o substitui por `@param` + o numero do parametro. 
     * @example normalizeSQL('... WHERE id = ?') => '... WHERE id = \@param1'
    */
    private normalizeSQL(sql: string) {
        let count = 1
        
        do{
            let i = sql.indexOf('?');

            if(i !== -1){
                let nextParam = '\@param' + count++
                sql = sql.substring(0, i) + nextParam + sql.substring(i + 1)                
            }

        }while(sql.indexOf('?') !== -1)
        
        this.log(sql)
        return sql
    }

    executeQuery(sql: string, params?: any[], callback?: ((erro?: Error, result?: any) => void)) {
    
        let request = new Request(this.normalizeSQL(sql), (err, rowCount, results) => { callback && callback(err, this.normalizeResults(results)); rowCount; })

        if(params && params.length > 0)
            params.forEach((param, i) => { request.addParameter('param' + (i + 1), this.getSQLType(param), param) })

        request.once('error', (err) => { this.log('Erro: '+ err.errors ?? err.message); callback && callback(err, []) })

        request.once('done', (rowCount) => { this.log('Last statement done. Rows: ' + rowCount) } )

        request.once('requestCompleted', () => { this.log('Request complete.') } )

        request.once('prepared', () => this._sqlCon.execute(request, this.paramsToObj(params)) )

        this._sqlCon.prepare(request); this.log('Request prepared')
    }

    /** Pega o resultado, na qual vem como um array que contem rows que por sua vez 
     * tem columns, e transforma em um array de objetos. */
    private normalizeResults(results: any[]): any {
        let objects: {}[] = []

        results.forEach((row: {value: any, metadata: ColumnMetaData}[]) => {
            let obj = {}
            row.forEach( (column) => { obj[column.metadata.colName] = column.value } )
            objects.push(obj)
        })

        return objects
    }

    private paramsToObj(params?: any[]): {} {
        const obj = {};

        if(!params) return obj

        let i = 1
        params.forEach((param) => { obj['param' + i.toString()] = param; i++; })

        this.log('Parameters: ' + objectToString(obj))
        return obj
    }
}