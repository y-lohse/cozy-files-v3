import React, { Component } from 'react'
import { Query } from 'cozy-client'

import Selection from 'photos/ducks/selection'
import ErrorShare from 'components/Error/ErrorShare'
import { Button, Menu, MenuItem, Icon, Spinner } from 'cozy-ui/react'
import { IconSprite } from 'cozy-ui/transpiled/react'
import { Main } from 'cozy-ui/react/Layout'

import { MoreButton, CozyHomeLink } from 'components/Button'
import PhotoBoard from 'photos/components/PhotoBoard'
import classNames from 'classnames'
import styles from './index.styl'
import { ALBUM_QUERY } from '../../../../src/photos/ducks/albums/index'

import flatten from 'lodash/flatten'
class App extends Component {
  onDownload = selected => {
    const photos = selected.length !== 0 ? selected : null
    this.downloadPhotos(photos)
  }

  downloadPhotos = async photos => {
    let allPhotos
    const { album } = this.props
    if (photos !== null) {
      allPhotos = flatten(photos)
    } else {
      const photosRequested = await this.context.client
        .getStackClient()
        .collection('io.cozy.files')
        .findReferencedBy(
          {
            _type: 'io.cozy.photos.albums',
            _id: album.id
          },
          { limit: 99999 }
        )
      allPhotos = photosRequested.data
    }

    this.context.client
      .collection('io.cozy.files')
      .downloadArchive(allPhotos.map(({ _id }) => _id), album.name)
  }

  componentWillReceiveProps(nextProps) {
    const { fetchStatus } = nextProps
    if (fetchStatus === 'failed') {
      this.setState({ error: 'Fetch error' })
    }
  }

  render() {
    const { album, hasMore, photos, fetchMore } = this.props

    const { t } = this.context
    if (this.state.error) {
      return (
        <div
          className={classNames(
            styles['pho-public-layout'],
            styles['pho-public-layout--full'],
            'u-pt-3'
          )}
        >
          <Main className="u-pt-1-half">
            <ErrorShare errorType={`public_album_unshared`} />
          </Main>
        </div>
      )
    }
    return (
      <div className={styles['pho-public-layout']}>
        <Main className="u-pt-1-half">
          <Selection>
            {(selected, active, selection) => (
              <div>
                <div
                  className={classNames(
                    styles['pho-content-header'],
                    styles['--no-icon'],
                    styles['--hide-bar']
                  )}
                >
                  <h2 className={styles['pho-content-title']}>{album.name}</h2>
                  <div className={styles['pho-toolbar']} role="toolbar">
                    <CozyHomeLink from="sharing-photos" t={t} />
                    <Button
                      theme="secondary"
                      className={styles['pho-public-download']}
                      onClick={() => this.onDownload(selected)}
                      icon="download"
                      label={t('Toolbar.album_download')}
                    />

                    <Menu
                      title={t('Toolbar.more')}
                      component={<MoreButton />}
                      position="right"
                      className="u-hide--desk"
                    >
                      <MenuItem
                        onSelect={() => this.onDownload(selected)}
                        icon={<Icon icon="download" />}
                      >
                        {t('Toolbar.album_download')}
                      </MenuItem>
                    </Menu>
                  </div>
                </div>
                <PhotoBoard
                  lists={[{ photos }]}
                  selected={selected}
                  photosContext="timeline"
                  showSelection={active}
                  onPhotoToggle={selection.toggle}
                  onPhotosSelect={selection.select}
                  onPhotosUnselect={selection.unselect}
                  fetchStatus={photos.fetchStatus}
                  hasMore={hasMore}
                  fetchMore={fetchMore}
                />
              </div>
            )}
          </Selection>
          <IconSprite />
        </Main>
      </div>
    )
  }
}

const ConnectedApp = props => (
  <Query query={ALBUM_QUERY} {...props}>
    {({ data: album, hasMore, fetchMore, fetchStatus }) => {
      if (fetchStatus === 'loaded') {
        return (
          <App
            album={album}
            photos={album.photos.data}
            fetchStatus={fetchStatus}
            hasMore={hasMore}
            fetchMore={fetchMore}
            {...props}
          />
        )
      } else {
        return (
          <Spinner
            size={'xxlarge'}
            loadingType={'photos_fetching'}
            middle={true}
          />
        )
      }
    }}
  </Query>
)

export default ConnectedApp
