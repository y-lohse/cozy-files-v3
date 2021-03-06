/* global cozy */
/**
 * This component was previously named FileOpener
 * It has been renamed since it is used in :
 *  - an intent handler (aka service)
 *  - via cozydrive://
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { Spinner, Alerter, translate } from 'cozy-ui/react'
import styles from './styles'
import Viewer from 'viewer'

const doNothing = () => {}

const FileNotFoundError = translate()(({ t }) => (
  <pre className="u-error">{t('FileOpenerExternal.fileNotFoundError')}</pre>
))

class FileOpener extends Component {
  state = {
    loading: true,
    file: null
  }
  componentWillMount() {
    this.loadFileInfo()
  }

  async loadFileInfo() {
    try {
      this.setState({ fileNotFound: false })
      const resp = await cozy.client.files.statById(
        getFileId(this.props),
        false
      )
      const file = { ...resp, ...resp.attributes, id: resp._id }
      this.setState({ file, loading: false })
    } catch (e) {
      this.setState({ fileNotFound: true, loading: false })
      Alerter.error('alert.could_not_open_file')
    }
  }

  render() {
    const { file, loading, fileNotFound } = this.state

    return (
      <div className={styles.fileOpener}>
        {loading && <Spinner size="xxlarge" loadingType="message" middle />}
        {fileNotFound && <FileNotFoundError />}
        {!loading &&
          !fileNotFound && (
            <Viewer
              style={{ top: '3rem' }}
              files={[file]}
              currentIndex={0}
              onChange={doNothing}
            />
          )}
      </div>
    )
  }
}

const getFileId = ownProps => {
  return ownProps.fileId || ownProps.router.params.fileId
}

FileOpener.PropTypes = {
  router: PropTypes.shape({
    params: PropTypes.shape({
      fileId: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  fileId: PropTypes.number
}

export default translate()(FileOpener)
