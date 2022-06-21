import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import dbConnector from 'App/DatabaseConnections/DatabaseConnector'
import { generateKeys } from 'App/../utils';
import basicLog from 'App/Logger/BasicLogger';

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    let msg;
    if(generateKeys()) //tenta criar as chaves da api, no caminho do certificado, se não existirem.
      msg = 'Chaves da aplicação criadas no caminho especificado. A aplicação utilizará essas chaves.'

    else msg = 'Chaves da aplicação encontradas, utilizando chaves existentes.'

    basicLog.geraLog(msg + ' Inicializando...')
  }

  public async ready() {    
    dbConnector.iniciaConexao();
    //process.on('uncaughtException', err => { basicLog.geraLog(err.message), process.exit()})
    basicLog.geraLog('Aplicação inicializada e pronta para as requisições.')
  }

  public async shutdown() {
    dbConnector.terminaConexao();
  }
}
