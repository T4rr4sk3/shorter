import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { JwtPayload, verify } from 'jsonwebtoken';
import { readFileSync } from 'fs'
import basicLog from 'App/Logger/BasicLogger';
import { objectToString, privateKeyPath } from 'App/../utils';

export default class Auth {
    private log(log: string) { basicLog.geraLog(log) }

    public async handle({ request, response, view }: HttpContextContract, next: () => Promise<void>) {
        const reqAuth = request.headers().authorization

        if(!reqAuth) { 
            this.log(objectToString({ path: request.url(), erro: 'tentativa de acesso sem o header authorization', host: request.host(), hostname: request.hostname(), ip: request.ip(), method: request.method() }, 0))
            response.unauthorized(view.renderSync('errors/unauthorized'));
            return //depois tentar algum método para evitar logar informações repetidas //não precisa. 
        }
        
        verify(reqAuth, readFileSync(privateKeyPath), (err, decoded) => { 
            if(err) {
                this.log(objectToString({ path: request.url(), erro: 'tentativa de acesso sem token', description: err, hostname: request.hostname(), ip: request.ip(), method: request.method(), reqAuth }, 0))
                response.abort(view.renderSync('errors/unauthorized'))
                //response.finish()
                return
            }

            else{ 
                let agora = new Date()
                let dataHora = agora.toLocaleDateString() + ' - ' + agora.toLocaleTimeString()
                
                let msg = objectToString({ 'path': request.url(), 'user': (decoded as JwtPayload).userBody, dataHora }, 0)
                console.log(msg)
                this.log('Auth: ' + msg)
                
            }
        })
        
        await next()
    }
}