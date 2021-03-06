import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import linkService from 'App/Service/LinkService';
import { sign } from 'jsonwebtoken';
import { privateKeyPath, geraCodigo, sha256, objectToString } from 'App/../utils';
import { readFileSync } from 'fs'
import basicLog from 'App/Logger/BasicLogger';
/** Controller na qual trabalha com objetos `Link` e requisições HTTP. */
export default class LinkController{
    private tamanhoCod = Env.get('CODE_LENGHT');
    private dominio = Env.get('DOMAIN');
    private path = __dirname
    private log(log: string) { basicLog.geraLog(log) }

    //Index                                                                     I'm a teapot!
    public async index({ response }: HttpContextContract) { return response.status(418) }

    //All
    public async getAll({ response, view }: HttpContextContract){        
        let erro;
        let links = await linkService.retornaLista().catch((reason) => { erro = reason });

        if(erro){
            let msg = erro + '\nErro em pegar todos os links. ('+ this.path +':21)';
            console.log(msg);
            this.log(msg);            
            response.status(500).send(view.renderSync('errors/server-error'));
        }

        this.log('/all: Todos os links retornados.')
        response.send(links);
    }

    //GetToken
    public async getToken({ request, response, view }: HttpContextContract){
        let hashBody = request.body()['hash'];
        let userBody = request.body()['user'];
        //console.log({ userBody, hashBody, body: request.body() })

        try{
            if(!userBody || !hashBody) response.abort({});

            let user = Env.get('APP_MASTER_USER')
            let password = Env.get('APP_MASTER_PASS')
            let salt = Env.get('APP_SALT')

            //decriptografa a mensagem do body e verifica se encaixa. com user do body + senha + salt
            const resultTest = sha256(userBody + password + salt)

            const resultSend = hashBody;

            const resultExpected = sha256(user + password + salt)

            if(resultTest !== resultSend || resultSend !== resultExpected) response.abort({})
            
            else{                                
                const token = sign({ userBody }, readFileSync(privateKeyPath), { expiresIn: Env.get('TOKEN_EXPIRES_IN') });
                this.log('Token gerado para ' + objectToString({ host: request.host(), hostname: request.hostname(), ip: request.ip(), }, 0))
                response.send({ token });
            }

        }catch(erro){ //se erro for o http exception, manda a página 401
            if(erro.message.startsWith('E_HTTP_EXCEPTION')) 
                response.status(401).send(view.renderSync('errors/unauthorized'));

            else { console.log(erro) } //; this.log(erro) } //talvez alguém tente um DDoS, inchando o log de erro. 
            // Depois tentar método de evitar inflar logs por causa de requisições repetidas
        }        
    }

    //:Codigo
    public async redirectToLink({ response, params, view }: HttpContextContract){
        let codigoUrl = params.codigo
        let erro;

        let link = await linkService.pegaPorCodigo(codigoUrl).catch((reason) => { erro = reason });  
        
        if(erro){ 
            let msg = erro + `\nErro em pegar o link pelo codigo: ${codigoUrl}. (${this.path}:37)`
            console.log(msg);
            this.log(msg);
            response.notFound(view.renderSync('errors/not-found'));
        }

        if(link) {
            //verifica se link expirou.
            if(link.expira_em) {                
                link.expira_em.setDate(link.expira_em.getDate() + 1) //no dia seguinte, o link está expirado.
                
                if(new Date().getTime() > link.expira_em.getTime()) { //se hoje > expires
                    let msg = `Link #${link.id}, ${link.nome} de código ${link.codigo} expirou!\nTentativa de redirecionamento falha.`
                    this.log(msg); console.log(msg)
                    response.notFound(view.renderSync('errors/not-found'));
                    return
                }
            }

            linkService.incrementVisitaEm1(link.id).catch((reason) => {
                let msg = reason + `\nErro ao dar update no Link. (${this.path}:43)`
                this.log(msg); console.log(msg);
            });

            //this.log('/' + codigoUrl + ': Link encontrado e atualizado. Redirecionando para ' + link.url)
            response.header('cache-control', 'no-cache, no-store, max-age=3600, must-revalidate');
            response.redirect(link.url, undefined, 302);
        }
    }

    //New
    public async postNew({ request, response }: HttpContextContract){
        const urlEnviada: string = request.body()["url"]; //pega a url do body
        const nomeLinkEnviado: string = request.body()["nome"]; //pega o nome do link do body
        let expiraEmEnviado: Date | undefined = request.body()["expira_em"]
        let novoCodigo = geraCodigo(this.tamanhoCod); // gera novo código
        let codigoExiste = true;
        
        do{ //enquanto código não é novo, ou seja, existe no banco, gera novo código.
            let erro;
            let link = await linkService.pegaPorCodigo(novoCodigo).catch(reason => erro = reason);
            
            if(!link || erro) codigoExiste = false; //meio redundante esse if, mas feito para utilizar ambas as variáveis.

            else //caso exista
                novoCodigo = geraCodigo(this.tamanhoCod);

        }while(codigoExiste);

        const resultado = { urlEnviada, urlCriada: this.dominio + novoCodigo, nome: nomeLinkEnviado } //resultado já pronto.
        let erro;

        if(urlEnviada.trim() === '') response.status(400).send({ "erro": "Tentou enviar um link vazio." })

        let novoLink = await linkService.insereNoBanco({ codigo: novoCodigo, url: urlEnviada, nome: nomeLinkEnviado, expira_em: expiraEmEnviado }).catch((reason) => erro = reason);
    
        if(erro){
            this.log('/new: ' + erro)
            response.send({ erro })
            return
        }

        let msg = 'Novo link gerado. Código: ' + novoCodigo + (novoLink ? ' ID: ' + novoLink : '')
        console.log(msg);
        this.log('/new: ' + msg);
        response.send(resultado);
    }

    //Del
    public async postDel({ request, response }: HttpContextContract){
        const idLinkEnviado = request.body()["id"] //pega o id do link da body
        let erro;

        let linkDeletado = await linkService.deletePorId(idLinkEnviado).catch((reason) => erro = reason)

        if(erro){
            this.log('/del: ' + erro)
            console.log('/del: ' + erro)
            response.send({ erro })
            return
        }

        let msg = 'Link deletado. Código: ' + linkDeletado.codigo + ' ID: ' + linkDeletado.id
        console.log(msg)
        this.log('/del: ' + msg);
        response.send({ linkDeletado })
    }
}