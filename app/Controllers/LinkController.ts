import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { geraCodigo, objectToString, privateKeyPath, sha256, verificaCodigo } from 'App/../utils'
import basicLog from 'App/Logger/BasicLogger'
import linkService from 'App/Service/LinkService'
import { createReadStream, readFileSync, rm } from 'fs'
import { sign } from 'jsonwebtoken'
import QR from 'qrcode'

/** Controller na qual trabalha com objetos `Link` e requisições HTTP. */
export default class LinkController {
  private tamanhoCod = Env.get('CODE_LENGHT')
  private dominio = Env.get('DOMAIN')
  private path = __dirname
  private log(log: string) {
    basicLog.geraLog(log)
  }

  //Index                                                                     I'm a teapot!
  public async index({ request: req, response }: HttpContextContract) {
    this.log(`Index reached by Host: ${req.hostname()} (${req.ip()})`)
    return response.status(418)
  }

  //All
  public async getAll({ response, view }: HttpContextContract) {
    let erro
    let links = await linkService.retornaLista().catch((reason) => {
      erro = reason
    })

    if (erro) {
      let msg = erro + '\nErro em pegar todos os links. (' + this.path + ':24)'
      console.log(msg)
      this.log(msg)
      response.status(500).send(view.renderSync('errors/server-error'))
    }

    this.log('/all: Todos os links retornados.')
    response.send(links)
  }

  //GetToken
  public async getToken({ request, response, view }: HttpContextContract) {
    let hashBody = request.body()['hash']
    let userBody = request.body()['user']
    //console.log({ userBody, hashBody, body: request.body() })

    try {
      if (!userBody || !hashBody) response.abort({})

      let user = Env.get('APP_MASTER_USER')
      let password = Env.get('APP_MASTER_PASS')
      let salt = Env.get('APP_SALT')

      //decriptografa a mensagem do body e verifica se encaixa. com user do body + senha + salt
      const resultTest = sha256(userBody + password + salt)

      const resultSend = hashBody

      const resultExpected = sha256(user + password + salt)

      if (resultTest !== resultSend || resultSend !== resultExpected) response.abort({})
      else {
        const token = sign({ userBody }, readFileSync(privateKeyPath), {
          expiresIn: Env.get('TOKEN_EXPIRES_IN'),
        })
        this.log(
          'Token gerado para ' +
            objectToString(
              { host: request.host(), hostname: request.hostname(), ip: request.ip() },
              0
            )
        )
        response.send({ token })
      }
    } catch (erro) {
      //se erro for o http exception, manda a página 401
      if (erro.message.startsWith('E_HTTP_EXCEPTION'))
        response.status(401).send(view.renderSync('errors/unauthorized'))
      else {
        response.forbidden()
        this.log(erro)
      } //talvez alguém tente um DDoS, inchando o log de erro.
      // Depois tentar método de evitar inflar logs por causa de requisições repetidas
    }
  }

  //:Codigo
  public async redirectToLink({ response, params, view }: HttpContextContract) {
    const codigoUrl = params.codigo

    if (!verificaCodigo(this.tamanhoCod, codigoUrl)) {
      let msg = `Código inválido. Tentativa: ${codigoUrl} (${this.path}:76)`
      console.log(msg)
      this.log(msg)
      response.notFound(view.renderSync('errors/not-found'))
      response.finish()
      return
    }

    let erro: any

    let link = await linkService.pegaPorCodigo(codigoUrl).catch((reason) => {
      erro = reason
    })

    if (erro) {
      let msg = erro + ` Erro em pegar o link pelo codigo: ${codigoUrl} (${this.path}:89)`
      console.log(msg)
      this.log(msg)
      response.notFound(view.renderSync('errors/not-found'))
      response.finish()
      return
    }

    if (link) {
      //verifica se link expirou.
      if (link.expira_em) {
        link.expira_em.setDate(link.expira_em.getDate() + 1) //no dia seguinte, o link está expirado.

        if (new Date().getTime() > link.expira_em.getTime()) {
          //se hoje > expires
          let msg = `Link #${link.id}, ${link.nome} de código ${link.codigo} expirou! Tentativa de redirecionamento falha.`
          this.log(msg)
          console.log(msg)
          response.notFound(view.renderSync('errors/not-found'))
          response.finish()
          return
        }
      }

      linkService.incrementVisitaEm1(link.id).catch((reason) => {
        let msg = reason + ` Erro ao dar update no Link. (${this.path}:43)`
        this.log(msg)
        console.log(msg)
      })

      //this.log('/' + codigoUrl + ': Link encontrado e atualizado. Redirecionando para ' + link.url)
      response.header('cache-control', 'no-cache, no-store, max-age=3600, must-revalidate')
      response.redirect(link.url, undefined, 302)
      response.finish()
    }
  }

  //New
  public async postNew({ request, response }: HttpContextContract) {
    const urlEnviada: string | undefined = request.body()['url'] //pega a url do body
    const nomeLinkEnviado: string | undefined = request.body()['nome'] //pega o nome do link do body
    let expiraEmEnviado: Date | undefined = request.body()['expira_em']
    let novoCodigo = geraCodigo(this.tamanhoCod) // gera novo código
    let codigoExiste = true

    do {
      //enquanto código não é novo, ou seja, existe no banco, gera novo código.
      let erro
      let link = await linkService.pegaPorCodigo(novoCodigo).catch((reason) => (erro = reason))

      if (!link || erro)
        codigoExiste = false //meio redundante esse if, mas feito para utilizar ambas as variáveis.
      //caso exista
      else novoCodigo = geraCodigo(this.tamanhoCod)
    } while (codigoExiste)

    if (!urlEnviada || !nomeLinkEnviado) {
      response.status(404).send({ erro: 'Informações inválidas' })
      return
    }

    let url = urlEnviada.trim()
    let nome = nomeLinkEnviado.trim()

    if (url === '' || nome === '') {
      response.status(400).send({ erro: 'Tentou enviar um link vazio.' })
      response.finish()
      return
    }

    const resultado = { urlEnviada: url, urlCriada: this.dominio + novoCodigo, nome } //resultado já pronto.

    let erro
    let novoLink = await linkService
      .insereNoBanco({ codigo: novoCodigo, url, nome, expira_em: expiraEmEnviado })
      .catch((reason) => (erro = reason))

    if (erro) {
      this.log('/new: ' + erro)
      response.send({ erro })
      response.finish()
      return
    }

    let msg = 'Novo link gerado. Código: ' + novoCodigo + (novoLink ? ' ID: ' + novoLink : '')
    console.log(msg)
    this.log('/new: ' + msg)
    response.send(resultado)
    response.finish()
  }

  //Del
  public async postDel({ request, response }: HttpContextContract) {
    const idLinkEnviado = request.body()['id'] //pega o id do link da body
    let erro

    let linkDeletado = await linkService
      .deletePorId(idLinkEnviado)
      .catch((reason) => (erro = reason))

    if (erro) {
      this.log('/del: ' + erro)
      console.log('/del: ' + erro)
      response.send({ erro })
      return
    }

    let msg = 'Link deletado. Código: ' + linkDeletado.codigo + ' ID: ' + linkDeletado.id
    console.log(msg)
    this.log('/del: ' + msg)
    response.send({ linkDeletado })
  }

  //:Codigo/qrcode
  public async getLinkQRcode({ response, params, view }: HttpContextContract) {
    const codigoUrl = params.codigo

    if (!verificaCodigo(this.tamanhoCod, codigoUrl)) {
      let msg = `Código inválido. Tentativa: ${codigoUrl} (${this.path}:76)`
      console.log(msg)
      this.log(msg)
      response.notFound(view.renderSync('errors/not-found'))
      response.finish()
      return
    }

    let erro: any

    let link = await linkService.pegaPorCodigo(codigoUrl).catch((reason) => {
      erro = reason
    })

    if (erro) {
      let msg = erro + ` Erro em pegar o link pelo codigo: ${codigoUrl} (${this.path}:89)`
      console.log(msg)
      this.log(msg)
      response.notFound(view.renderSync('errors/not-found'))
      response.finish()
      return
    }

    if (link) {
      //verifica se link expirou.
      if (link.expira_em) {
        link.expira_em.setDate(link.expira_em.getDate() + 1) //no dia seguinte, o link está expirado.

        if (new Date().getTime() > link.expira_em.getTime()) {
          //se hoje > expires
          let msg = `Link #${link.id}, ${link.nome} de código ${link.codigo} expirou! Tentativa de redirecionamento falha.`
          this.log(msg)
          console.log(msg)
          response.notFound(view.renderSync('errors/not-found'))
          response.finish()
          return
        }
      }

      const randomId = Math.random() * 10000
      const path = Application.tmpPath(randomId + '.png')
      const domain = Env.get('DOMAIN')
      response.header('content-disposition', 'attachment; filename="shortlink.png"')
      response.header('content-type', 'image/png')

      try {
        await QR.toFile(path, domain + link.codigo, { errorCorrectionLevel: 'H' })
        const stream = createReadStream(path)
        await response.stream(stream)

        rm(path, { force: true, recursive: true, maxRetries: 5 }, (err) => {
          if (err) {
            console.log(err.message)
            this.log(err.message)
          }
        })
      } catch (e) {
        console.log(e.message)
        this.log(e.message)
      }
    }
  }
}
