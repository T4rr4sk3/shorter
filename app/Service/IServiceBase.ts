/** Interface base para qualquer service futuro. Apto para modificações. 
 * @param T Tipo do objeto a ser manipulado pelo service. 
 * Deve ter pelo menos um id.
*/
export default interface IServiceBase<T>{

    /** Pega o objeto do service retornando o objeto encontrado ou `null`. 
     * @param id Id do objeto
     * @returns Uma `Promise` do objeto ou nulo caso não tenha sido encontrado.
    */
    pegaPorId(id: number): Promise<T|null>,

    /** Insere o objeto pelo service e pode retornar o id do objeto inserido, se o mesmo possuir um id. 
     * @param obj Objeto deste service que deve ser inserido. O objeto não precisa estar completo para ser incluído.
     * @returns Uma `Promise` do id do objeto ou vazio caso aconteça algum tipo de erro.
    */
    insereNoBanco(obj: Partial<T>): Promise<number|void>,

    /** Faz update no objeto do service pelo id. 
     * @param id Id do objeto
     * @param obj Objeto que irá substituir o anterior, tirando o id.
     * @returns Uma `Promise` do objeto após a alteração ou vazio caso aconteça algum tipo de erro.
    */
    updatePorId?(id: number, obj: Partial<T>): Promise<T|void>

    /** Faz um update no objeto do service no banco. 
     * @param obj Objeto que irá substituir o anterior, usando o id deste objeto para atualizá-lo.
     * @returns Uma `Promise` do objeto após a alteração ou vazio caso aconteça algum tipo de erro.
    */
    updateNoBanco(obj: T): Promise<T|void>,

    /** Deleta um objeto do service pelo id. 
     * @param id Id do objeto
     * @returns Uma `Promise` do objeto deletado ou vazio caso aconteça algum tipo de erro.
    */
    deletePorId?(id: number): Promise<T|void>,

    /** Retorna uma lista de objetos do banco. 
     * @returns Lista de objetos, vazia ou não.
    */
    retornaLista?(): Promise<T[]>
}