import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import linkService from 'App/Service/LinkService';
import { sign } from 'jsonwebtoken';
import { privateKeyPath, geraCodigo, sha256 } from 'App/../utils';
import { readFileSync } from 'fs'
import basicLog from 'App/Logger/BasicLogger';

export default class LinkController{
    private tamanhoCod = Env.get('CODE_LENGHT');
    private dominio = Env.get('DOMAIN');
    private path = __dirname
    private log(log: string) { basicLog.geraLog(log) }

    //Index
    public async index({ view }: HttpContextContract) { return view.render('welcome'); }

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

                response.send({ token });
            }

        }catch(erro){ //se erro for o http exception, manda a página 404
            if(erro.message.startsWith('E_HTTP_EXCEPTION')) 
                response.status(401).send(view.renderSync('errors/unauthorized'));

            else console.log(erro)
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
            link.visitas++;
            linkService.updateNoBanco(link).catch((reason) => {
                let msg = reason + `\nErro ao dar update no Link. (${this.path}:43)`
                console.log(msg);
                this.log(msg);
            });

            this.log('/' + codigoUrl + ': Link encontrado e atualizado. Redirecionando para ' + link.url)
            response.header('cache-control', 'no-cache, no-store, max-age=3600, must-revalidate');    
            response.redirect(link.url);
        }
    }

    //New
    public async postNew({ request, response }: HttpContextContract){
        const urlEnviada: string = request.body()["url"]; //pega a url do body
        const nomeLinkEnviado: string = request.body()["nome"]; //pega o nome do link do body
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

        let novoLink = await linkService.insereNoBanco({ codigo: novoCodigo, url: urlEnviada, nome: nomeLinkEnviado }).catch((reason) => { erro = reason });
    
        if(erro){
            this.log('/new: ' + erro)
            response.send({ erro })
        }

        let msg = 'Novo link gerado. Código: ' + novoCodigo + (novoLink ? ' ID: ' + novoLink : '')
        console.log(msg);
        this.log('/new: ' + msg);
        response.send(resultado);
    }
}