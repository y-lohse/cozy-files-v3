/* global __DEVELOPMENT__ __APP_VERSION__ */
import 'babel-polyfill'

import 'drive/styles/main'
import 'drive/mobile/styles/main'

import React from 'react'
import { render } from 'react-dom'
import { CozyProvider } from 'redux-cozy-client'
import { hashHistory } from 'react-router'

import { I18n } from 'cozy-ui/react/I18n'

import MobileRouter from 'authentication/MobileRouter'
import AppRoute from 'drive/components/AppRoute'

import configureStore from 'drive/mobile/store/configureStore'
import { loadState } from 'drive/mobile/store/persistedState'
import { getLang } from 'drive/mobile/lib/device'
import { initClient, initBar } from 'authentication/lib/client'
import { startBackgroundService } from 'drive/mobile/lib/background'
import { startTracker, useHistoryForTracker, startHeartBeat, stopHeartBeat } from 'drive/mobile/lib/tracker'
import { pingOnceADay } from 'drive/mobile/actions/timestamp'
import { backupImages } from 'drive/mobile/actions/mediaBackup'
import { backupContacts } from 'drive/mobile/actions/contactsBackup'
import { setUrl, saveCredentials, startReplication } from 'drive/mobile/actions/settings'
import { revokeClient } from 'drive/mobile//actions/authorization'
import { configure as configureReporter } from 'drive/mobile/lib/reporter'
import { SOFTWARE_ID } from 'drive/constants'

if (__DEVELOPMENT__) {
  // Enables React dev tools for Preact
  // Cannot use import as we are in a condition
  require('preact/devtools')

  // Export React to window for the devtools
  window.React = React
}

const renderAppWithPersistedState = persistedState => {
  const hasPersistedMobileStore = persistedState && persistedState.mobile
  const client = initClient(hasPersistedMobileStore ? persistedState.mobile.settings.serverUrl : '', {
    softwareID: SOFTWARE_ID,
    softwareVersion: __APP_VERSION__,
    clientURI: 'https://github.com/cozy/cozy-drive/',
    logoURI: 'https://raw.githubusercontent.com/cozy/cozy-drive/master/vendor/assets/apple-touch-icon-120x120.png',
    scopes: ['io.cozy.files', 'io.cozy.contacts', 'io.cozy.jobs:POST:sendmail:worker', 'io.cozy.settings:PUT:passphrase'],
    offline: {doctypes: ['io.cozy.files']}
  })

  const store = configureStore(persistedState)

  client.isRegistered(hasPersistedMobileStore ? persistedState.settings.client : null).then(isRegistered => {
    if (isRegistered) {
      startReplication(store.dispatch, store.getState) // don't like to pass `store.dispatch` and `store.getState` as parameters, big coupling
      initBar()
    } else {
      store.dispatch(revokeClient())
    }
  })

  configureReporter(store.getState().mobile.settings.analytics)

  function isAuthorized () {
    return !store.getState().mobile.settings.authorized
  }

  function isRevoked () {
    return store.getState().mobile.authorization.revoked
  }

  function saveCredentialsAndRedirect ({ url, clientInfo, token, router }) {
    store.dispatch(saveCredentials(clientInfo, token))
    store.dispatch(setUrl(url))
    router.replace('/onboarding')
  }

  function pingOnceADayWithState () {
    const state = store.getState()
    if (state.mobile) {
      const timestamp = state.mobile.timestamp
      const analytics = state.mobile.settings.analytics
      store.dispatch(pingOnceADay(timestamp, analytics))
    }
  }

  document.addEventListener('pause', () => {
    if (store.getState().mobile.settings.analytics) stopHeartBeat()
  }, false)

  document.addEventListener('resume', () => {
    pingOnceADayWithState()
    if (store.getState().mobile.settings.analytics) startHeartBeat()
  }, false)

  document.addEventListener('deviceready', () => {
    pingOnceADayWithState()
    store.dispatch(backupImages())
    if (navigator && navigator.splashscreen) navigator.splashscreen.hide()
    if (store.getState().mobile.settings.backupContacts) store.dispatch(backupContacts())
  }, false)

  useHistoryForTracker(hashHistory)
  if (store.getState().mobile.settings.analytics) startTracker(store.getState().mobile.settings.serverUrl)

  const root = document.querySelector('[role=application]')

  render((
    <I18n lang={getLang()} dictRequire={(lang) => require(`drive/locales/${lang}`)}>
      <CozyProvider store={store} client={client}>
        <MobileRouter
          history={hashHistory}
          appRoutes={AppRoute}
          isAuthenticated={isAuthorized}
          isRevoked={isRevoked}
          onAuthenticated={saveCredentialsAndRedirect}
          allowRegistration={false}
        />
      </CozyProvider>
    </I18n>
  ), root)
}

// Allows to know if the launch of the application has been done by the service background
// @see: https://git.io/vSQBC
const isBackgroundServiceParameter = () => {
  let queryDict = {}
  location.search.substr(1).split('&').forEach(function (item) { queryDict[item.split('=')[0]] = item.split('=')[1] })

  return queryDict.backgroundservice
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isBackgroundServiceParameter()) {
    loadState().then(renderAppWithPersistedState)
  }
}, false)

document.addEventListener('deviceready', () => {
  if (isBackgroundServiceParameter()) {
    startBackgroundService()
  }
}, false)
