import Env from '@ioc:Adonis/Core/Env'
import fs from 'fs'
/** Interface de um Logger. */
interface LoggerContract {
  pathLogFile: string
  geraLog: (log: string) => void
  inicializaLog(fileName: string): void
}

/** Classe base para gerar arquivos de log e escrever sobre eles. */
export class BasicLogger implements LoggerContract {
  public pathLogFile: string

  constructor(nomeArquivo: string) {
    this.inicializaLog(nomeArquivo)
  }

  public inicializaLog(fileName: string) {
    //let caminhoLogs = path.relative(__dirname, Env.get('LOGS_PATH')) //caso eu bote um caminho já existente
    let pathToLogs = Env.get('LOGS_PATH')
    let now = new Date()
    let data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}-${now.getDate()}`
    this.pathLogFile = `${pathToLogs}/${data}_${fileName}`

    if (!fs.existsSync(pathToLogs)) fs.mkdirSync(pathToLogs)

    fs.open(this.pathLogFile, 'a', (err) => {
      if (err) throw err
    }) //tenta criar e ver no arquivo para escrever (modo append).
  }

  public geraLog(log: string) {
    let line = `[ ${new Date().toLocaleString()} ] - ${log}\n`

    fs.appendFile(this.pathLogFile, line, (err) => {
      if (err) throw err
    })
  }
}

const basicLog = new BasicLogger('access.log')

export default basicLog
