import dbConnector from "App/DatabaseConnections/DatabaseConnector"
import { SQLTypes } from "App/DatabaseConnections/IDatabaseConnection"
import IServiceBase from "App/Service/IServiceBase"

interface NovoLink { codigo: string, url: string, nome: string, expira_em?: Date }
/** Interface de um objeto `link` do banco de dados(DBO). */
export interface Link extends NovoLink { id: number, visitas: number }
/** Service que trabalha com o CRUD de objetos do tipo `Link` e se comunica com o banco.
 * @see Link */
class LinkService implements IServiceBase<Link>{
    private table: string
    constructor() { this.table = dbConnector.SQLTable }
    
    public async pegaPorId(id: number): Promise<Link | null> {
        return new Promise( (resolve, reject) => {
            dbConnector.executeQuery(`SELECT * FROM ${this.table} WHERE id = ?`, [id], (err, results) => { 
                if(err) reject(err.message)
                    
                else resolve(results[0])
            })
        })
    }

    public async insereNoBanco(link: NovoLink): Promise<number> {
        let isMSSQL = dbConnector.SQLTypeInUse === SQLTypes.SQLServer
        let insertSQL = `INSERT INTO ${this.table} (codigo, url, nome, expira_em) values (?, ?, ?, ?)`

        if(isMSSQL) //se for mssql, dá um select do ultimo id da tabela, que será o valor inserido no comando anterior
            insertSQL += `; SELECT TOP(1) id FROM ${this.table} ORDER BY id DESC`

        return new Promise( (resolve, reject) => { 
            dbConnector.executeQuery(insertSQL, [link.codigo, link.url, link.nome, link.expira_em], (err, result) => {
                if(err) reject(err.message)

                else resolve(isMSSQL ? result[0].id : result.insertId ?? result)
            })
        })
    }

    /** Incrementa a coluna `visitas` em 1 pelo próprio banco, evitando o update que em ordem errada pode perder informações importantes. */
    public async incrementVisitaEm1(id: number): Promise<void> {
        let incrementSQL = `update ${this.table} set visitas = (SELECT visitas + 1 FROM ${this.table} where id = ?) where id = ?`

        return new Promise((resolve, reject) => {
            dbConnector.executeQuery(incrementSQL, [id, id], (err) => {
                if(err) reject(err.message)

                else resolve();
            })
        })
    }

    /** Pega um link pelo codigo no banco de dados. */
    public async pegaPorCodigo(codigo: string): Promise<Link>{
        return new Promise((resolve, reject) => {
            let query = `SELECT * FROM ${this.table} `
            
            let where = dbConnector.SQLTypeInUse === SQLTypes.MySQL ? 
                'WHERE binary codigo like ?' : //mysql
                'WHERE codigo like ? collate SQL_Latin1_General_CP1_CS_AS'; //sql server
            
            dbConnector.executeQuery(query.concat(where), [codigo], (err, results) => {
                if(err) reject(err.message);
                
                if(results.length === 0) reject('Nenhum objeto encontrado.')

                resolve(results[0])
            })
        })
    }

    public async updateNoBanco(link: Link): Promise<void | Link> {
        return new Promise( (resolve, reject) => {
            dbConnector.executeQuery(`UPDATE ${this.table} set codigo = ?, url = ?, nome = ?, visitas = ? where id = ?`, [link.codigo, link.url, link.nome, link.visitas, link.id],
                (err) => {
                    if(err) reject(err.message);

                    else resolve(link);
                })
            }
        )
    }

    public async retornaLista(): Promise<Link[]>{
        return new Promise( (resolve, reject) => { 
            dbConnector.executeQuery(`SELECT * FROM ${this.table} ORDER BY id DESC`, undefined, (err, results) => {
                if(err) reject(err.message); else resolve(results);
            })
        })
    }

    public async deletePorId(id: number): Promise<Link>{
        let deleteSQL = `DELETE FROM ${this.table} WHERE id = ?`

        let erro;
        let link = await this.pegaPorId(id).catch((reason) => erro = reason)

        return new Promise((resolve, reject) => {                        
            if(!link || erro) reject('Link não encontrado.')

            dbConnector.executeQuery(deleteSQL, [id], (err) => {
                if(err) reject(err.message)

                else resolve(link);
            })
        })
    }

    /** Deleta todos os links que tem data de expiração e que já passou desta data.
     * Utilitário que talvez será utilizado no futuro em alguma rota.
     */
    public async deletaTodosExpirados(): Promise<void> {
        return new Promise( (resolve, reject) => {
            let today = (dbConnector.SQLTypeInUse === SQLTypes.SQLServer) ? 'CAST(GETDATE() AS DATE)': 'CURRENT_DATE'
            
            dbConnector.executeQuery(`DELETE FROM ${this.table} WHERE expira_em < ${today}`, undefined, (err) => {
                if(err) reject(err.message); else resolve();
            })
        })
    }
}

const linkService = new LinkService();
export default linkService