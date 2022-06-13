import dbConnector from "App/DatabaseConnections/DatabaseConnector"
import { SQLTypes } from "App/DatabaseConnections/IDatabaseConnection"
import IServiceBase from "App/Service/IServiceBase"

interface NovoLink { codigo: string, url: string, nome: string }

export interface Link extends NovoLink { id: number, visitas: number }

class LinkService implements IServiceBase<Link>{
    private table: string
    constructor() { this.table = dbConnector.SQLTypeInUse === SQLTypes.MySQL ? 'link':'dbo.link' }
    
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
            dbConnector.executeQuery(`SELECT * FROM ${this.table}`, undefined, (err, results) => {
                if(err) reject(err.message);
                else resolve(results);
            })
        })
    }
}

const linkService = new LinkService();
export default linkService