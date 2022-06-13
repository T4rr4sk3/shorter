import fs from 'fs'
import Env from '@ioc:Adonis/Core/Env'

interface ILogger { 
    pathLogFile: string,
    geraLog: (log: string) => void, 
    inicializaLog(fileName: string): void 
}

/** Classe base para gerar arquivos de log e escrever sobre eles. */
export class BasicLogger implements ILogger {
    pathLogFile: string
    
    constructor(nomeArquivo: string) { this.inicializaLog(nomeArquivo) }

    inicializaLog(fileName: string){
        //let caminhoLogs = path.relative(__dirname, Env.get('LOGS_PATH')) //caso eu bote um caminho já existente
        let pathToLogs = Env.get('LOGS_PATH')
        this.pathLogFile = pathToLogs + '/' + fileName

        if(!fs.existsSync(pathToLogs)) fs.mkdirSync(pathToLogs)

        fs.open(this.pathLogFile, 'a', (err) => { if(err) throw err }) //tenta criar e ver no arquivo para escrever (modo append).
    }

    geraLog(log: string) {
        let line = `[ ${new Date().toLocaleString()} ] - ${log}\n`

        fs.appendFile(this.pathLogFile, line, (err) => { if(err) throw err });
    }

}

const basicLog = new BasicLogger('access.log')

export default basicLog