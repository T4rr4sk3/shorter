import dbConnector from "App/DatabaseConnections/DatabaseConnector"
import { SQLTypes } from "App/DatabaseConnections/IDatabaseConnection"
import IServiceBase from "App/Service/IServiceBase"

interface NovoLink { codigo: string, url: string, nome: string }

export interface Link extends NovoLink { id: number, visitas: number }

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

    public async insereNoBanco(link: NovoLink): Promise<number | void> {
        let insertSQL = `INSERT INTO ${this.table} (codigo, url, nome) values (?, ?, ?)`

        return new Promise( (resolve, reject) => { 
            dbConnector.executeQuery(insertSQL, [link.codigo, link.url, link.nome], (err, result) => {                
                if(err) reject(err.message)

                else resolve(result.insertId ?? result)
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
            dbConnector.executeQuery(`SELECT * FROM ${this.table} ORDER BY id ASC`, undefined, (err, results) => {
                if(err) reject(err.message);
                else resolve(results);
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
}

const linkService = new LinkService();
export default linkService