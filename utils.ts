import { 
  createHash, 
  BinaryToTextEncoding, 
  privateDecrypt, 
  publicEncrypt, 
  generateKeyPairSync, 
  RSAKeyPairOptions,
  RsaPublicKey,
} from 'crypto'
import Env from '@ioc:Adonis/Core/Env'
import fs from 'fs'
import path from 'path'

/** Caminho do certificado para a aplicação. */
const certPath = path.resolve(Env.get('APP_CERT_PATH')) //agora esse caminho é necessário para a aplicação funcionar

export const privateKeyPath = path.resolve(certPath + '/api_key.pem')

export const publicKeyPath = path.resolve(certPath + '/api_key_public.pem')

/** Dá um log no prompt de comando com sintaxe reduzida.
 * @param message Mensagem a ser escrita.
 * @param params Array de objetos a serem mostrados.
 */
export const log = (message?: string, ...params: any[]) => { if(params && params.length > 0) console.log(message, params); else console.log(message); }

/** Gera uma string de código aleatóriamente, dado o tamanho da string.
 * @param tamanho Tamanho do código
 * @returns Um código aleatório.
 * @example geraCodigo(5) => '4TjaE'
 */
export function geraCodigo(tamanho: number){
  let text = '';
  const possible = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for(let i = 0; i < tamanho; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
/** Verifica baseado no tamanho se código é válido, evitando possíveis operações com um código inválido.
 * @param tamanho Tamanho do código
 * @param possivelCodigo String qualquer, caso undefined, false será retornado.
 * @returns true se código é valido.
 * @example verificaCodigo(5, 'a7JH2') => true
 */
export function verificaCodigo(tamanho: number, possivelCodigo: string | undefined) {
  const codigoRegExp = new RegExp(`^([a-zA-Z]|\\d){${tamanho}}$`)

  return possivelCodigo ? codigoRegExp.test(possivelCodigo) : false // false caso possivelCodigo undefined
}
/** Criptograda uma string utilizando o SHA-256. */
export function sha256(str: string, enconding?: BinaryToTextEncoding){
  return createHash('sha256').update(str).digest(enconding ?? 'hex');
}

/** Pega o valor de uma string dentro da string (usado para pegar valores do Digest).
 * @param strToda A string inteira a ser buscada.
 * @param strBusca A string que será feita a busca do valor.
 * @example pegaValorStr('username="alguem"', 'username') = 'alguem';
 */
export function pegaValorStr(strToda: string, strBusca: string){
  let searchStr = strBusca + '="'
  let startPos = strToda.lastIndexOf(searchStr) + searchStr.length
  if(startPos === -1) return ''

  return strToda.substring(startPos, strToda.indexOf('"', startPos + 1))
}

/** Descriptografa um texto utilizando a privateKey existente. Caso a mesma não exista, irá da erro. */
export function decrypt( textToDecrypt: string){
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
  const buffer = Buffer.from(textToDecrypt, 'base64')  

  const decrypted = privateDecrypt({ key: privateKey, passphrase: '' }, buffer)

  return decrypted.toString('base64');
}

/** Criptografa um texto utilizando a publicKey existente. Caso a mesma não exista, irá dar erro. */
export function encrypt(textToEncrypt: string){
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8')
  const buffer = Buffer.from(textToEncrypt, 'base64')
  const key : RsaPublicKey = { key: publicKey } //, padding: 'RSA_PKCS1_OAEP_PADDING' }
  const encrypted = publicEncrypt(key, buffer)

  return encrypted.toString('base64');
}

/** Tenta gerar novas chaves para a aplicação no diretorio atual.
 * @returns true se chaves foram criadas, se não, false.
 */
export function generateKeys() {
  if(fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath)) return false

  let options : RSAKeyPairOptions<'pem', 'pem'> = { 
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'c81e728' }
   }

  const { publicKey, privateKey } = generateKeyPairSync('rsa', options) 

  if(!fs.existsSync(certPath)) fs.mkdirSync(certPath)

  fs.writeFileSync(certPath + '/api_key.pem', privateKey)
  fs.writeFileSync(certPath + '/api_key_public.pem', publicKey)
  return true
}

/** Transforma o array passado em uma string contendo o tipo + valor de cada elemento do array.
 * @param array Array a ser iterado.
 * @param separator Separador da string final. Por padrão é `', '`
 * @returns Uma string representando o array informado.
 * @example arrayToString(['bom',5,'dia']) => '[ string: bom, number: 5, string: dia ]'
 */
export function arrayToString(array: any[], separator?: string){
  let str = '[ ', separador = separator ?? ', '

  if(array.length === 0) str += separador //corrige a posição para apagar o separador e deixar só o colchete vazio.
  
  array.forEach((value) => { if(value) 
      if(value instanceof Date) str += 'Date: ' + value.toLocaleString() + separador
      else str += typeof value + ': ' + value.toString() + separador
  })
  //retorna a string toda até o último separador e fecha o colchete.
  return str.substring(0, str.length - separador.length) + ' ]'
}

/** Retorna uma string em JSON correspondente ao objeto. */
export function objectToString(obj: any, space?: string | number){
  return JSON.stringify(obj, undefined, space ?? 1)
}

/** @description Define um objeto genérico que tenha um id.  @abstract { id: number, ...}*/
interface GenericObject { id: number }
/** Busca por um objeto (que possua um `id: number`) no array e retorna seu index.
 * @returns O index do objeto ou -1 caso não encontrado.
 */
export function buscaIndexNoArrayPorId<Type extends GenericObject>(arrayBusca: Type[], idBusca: number){
  return arrayBusca.findIndex((value) => { return value.id === idBusca })
}