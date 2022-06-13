import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import dbConnector from 'App/DatabaseConnections/DatabaseConnector'
import { generateKeys } from 'App/../utils';
//import basicLog from 'App/Logger/BasicLogger';

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
    generateKeys() //tenta criar as chaves da api, no caminho do certificado, se não existirem.
  }

  public async ready() {    
    dbConnector.iniciaConexao();
    //process.on('uncaughtException', err => { basicLog.geraLog(err.message), process.exit()})
  }

  public async shutdown() {
    dbConnector.terminaConexao();
  }
}
