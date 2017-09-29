/* global cozy, document, __APP_VERSION__, __ALLOW_HTTP__ */
import { getLang } from './init'
import { LocalStorage as Storage } from 'cozy-client-js'
import { SOFTWARE_NAME, SOFTWARE_ID } from './constants'

export const clientRevokedMsg = 'Client has been revoked'
const getStorage = () => new Storage()
const getClientName = device => `${SOFTWARE_NAME} (${device})`

export const getClientParams = (device) => ({
  redirectURI: 'http://localhost',
  softwareID: SOFTWARE_ID,
  clientName: getClientName(device),
  softwareVersion: __APP_VERSION__,
  clientKind: 'mobile',
  clientURI: 'https://github.com/cozy/cozy-drive/',
  logoURI: 'https://raw.githubusercontent.com/cozy/cozy-drive/master/vendor/assets/apple-touch-icon-120x120.png',
  policyURI: 'https://files.cozycloud.cc/cgu.pdf',
  scopes: ['io.cozy.files', 'io.cozy.contacts', 'io.cozy.jobs:POST:sendmail:worker', 'io.cozy.settings']//:PUT:passphrase']
})

const getAuth = (onRegister, device) => ({
  storage: getStorage(),
  clientParams: getClientParams(device),
  onRegistered: onRegister
})

export const initClient = (url, onRegister = null, device = 'Device') => {
  if (url) {
    console.log(`Cozy Client initializes a connection with ${url}`)
    cozy.client.init({
      cozyURL: url,
      oauth: getAuth(onRegister, device),
      offline: {doctypes: ['io.cozy.files']}
    })
  }
}

export const initBar = () => {
  cozy.bar.init({
    appName: 'Drive',
    appEditor: 'Cozy',
    iconPath: require('../../../../targets/drive/vendor/assets/app-icon.svg'),
    lang: getLang(),
    replaceTitleOnMobile: true
  })
}

export const isClientRegistered = async (client) => {
  return await cozy.client.auth.getClient(client).then(client => true).catch(err => {
    if (err.message === clientRevokedMsg) {
      return false
    }
    // this is the error sent if we are offline
    if (err.message === 'Failed to fetch') {
      return true
    }
    throw err
  })
}

export function resetClient () {
  // reset cozy-bar
  if (document.getElementById('coz-bar')) {
    document.getElementById('coz-bar').remove()
  }
  // reset pouchDB
  if (cozy.client.offline.destroyAllDatabase) {
    cozy.client.offline.destroyAllDatabase()
  }
  // reset cozy-client-js
  if (cozy.client._storage) {
    cozy.client._storage.clear()
  }
}

export const getToken = async () => {
  const credentials = await cozy.client.authorize()
  return credentials.token.accessToken
}

export const getClientUrl = () => cozy.client._url
