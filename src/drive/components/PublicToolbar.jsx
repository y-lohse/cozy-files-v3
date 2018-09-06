/* global cozy */
import React from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { Button, withBreakpoints } from 'cozy-ui/react'
import { MoreButton } from 'components/Button'
import Menu, { Item } from 'components/Menu'
import DownloadButton from './DownloadButton'
import toolbarstyles from '../styles/toolbar'
import CloudIcon from '../assets/icons/icon-cloud-open.svg'
import { downloadFiles } from '../actions'
import { CozyHomeLink } from 'components/Button'

const { BarRight } = cozy.bar

const OpenInCozyButton = ({ t, size = 'normal' }) => (
  <Button size={size} label={t('toolbar.menu_open_cozy')} icon={CloudIcon} />
)
const DownloadFilesButton = ({ t, onDownload, size = 'normal' }) => (
  <DownloadButton
    label={t('toolbar.menu_download_folder')}
    className={toolbarstyles['fil-public-download']}
    onDownload={onDownload}
    theme="secondary"
    size={size}
  />
)
const MoreMenu = ({ onDownload, t }) => (
  <Menu
    title={t('toolbar.item_more')}
    className={classnames(
      toolbarstyles['fil-toolbar-menu'],
      toolbarstyles['fil-toolbar-menu--public']
    )}
    buttonClassName={toolbarstyles['fil-toolbar-more-btn']}
    button={<MoreButton>{t('Toolbar.more')}</MoreButton>}
  >
    <Item>
      <a className={toolbarstyles['fil-action-open-cozy']} href="#">
        {t('toolbar.menu_open_cozy')}
      </a>
    </Item>
    <Item>
      <a className={toolbarstyles['fil-action-download']} onClick={onDownload}>
        {t('toolbar.menu_download_folder')}
      </a>
    </Item>
  </Menu>
)

const PublicToolbar = (
  { files, onDownload, breakpoints: { isMobile }, renderInBar = false },
  { t }
) => {
  if (isMobile) {
    return (
      <BarRight>
        <MoreMenu t={t} onDownload={() => onDownload(files)} />
      </BarRight>
    )
  } else if (renderInBar) {
    return (
      <BarRight>
        <div className={toolbarstyles['toolbar-inside-bar']}>
          <OpenInCozyButton t={t} size="small" />
          <CozyHomeLink from="sharing-drive" />
          <DownloadFilesButton
            t={t}
            onDownload={() => onDownload(files)}
            size="small"
          />
        </div>
      </BarRight>
    )
  } else {
    return (
      <div className={toolbarstyles['fil-toolbar-files']} role="toolbar">
        <OpenInCozyButton t={t} />
        <DownloadFilesButton t={t} onDownload={() => onDownload(files)} />
        <BarRight>
          <div />
        </BarRight>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  onDownload: files => dispatch(downloadFiles(files))
})

export default connect(null, mapDispatchToProps)(
  withBreakpoints()(PublicToolbar)
)
