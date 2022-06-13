import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { JwtPayload, verify } from 'jsonwebtoken';
import { readFileSync } from 'fs'
import basicLog from 'App/Logger/BasicLogger';
import { objectToString, privateKeyPath } from 'App/../utils';

export default class Auth {
    private log(log: string) { basicLog.geraLog(log) }

    public async handle({ request, response, view }: HttpContextContract, next: () => Promise<void>) {
        const reqAuth = request.headers().authorization

        if(!reqAuth) { response.unauthorized(view.renderSync('errors/unauthorized')); return }
    
        verify(reqAuth, readFileSync(privateKeyPath), (err, decoded) => { 
            if(err) 
                response.abort({ erro: 'token inválido.', description: err })

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