import { BasicLogger } from 'App/Logger/BasicLogger'

export enum SQLTypes {
  MySQL,
  SQLServer,
}

/** Representa uma conexão com um database específico. Possui ações principais de uma conexão como
 * o início/fim de uma conexão e a execução de uma query no banco de dados final.
 */
export default interface DatabaseConnectionContract {
  /** Tipo do SQL da classe. */
  sqlType: SQLTypes

  /** Dialeto da classe em string (para caso precise exibir em algum lugar). */
  sqlDialet: string

  /** Logger assimilado a esta classe para a escrita de logs de auxílio. */
  logger: BasicLogger

  /** Configura a classe para conectar-se ao banco de dados usando as configurações passadas para este objeto. */
  config<T>(configurations: T): void

  /** Inicia uma conexão com o banco de dados usando a configuração do objeto.
   * @param exibeLog Indica se deve exibir alguma informação em um log qualquer, definido pelo objeto.
   */
  start(exibeLog?: boolean): void

  /** Para a conexão com o banco de dados.
   * @param imediato Indica se deve para a conexão imediatamente, caso possível.
   * @param callback Callback invocado pelo término da conexão, caso possível.
   */
  stop(imediato?: boolean, callback?: (erro?: Error) => void)

  /** Executa uma query no banco de dados de acordo com a conexão deste objeto e retorna os dados no callback, caso tenham.
   * @param sql String da query sql a ser executado.
   * @param params Parâmetros a serem passados em forma de array para a query.
   * @param callback Callback para ser executado caso dê um erro ou retorne alguma coisa da ação.
   * @example dbConnector.executeQuery('SELECT * FROM tabela WHERE id = ?', [42], meuCallback);
   */
  executeQuery(sql: string, params?: any[], callback?: (erro?: Error, result?: any) => void)
}
