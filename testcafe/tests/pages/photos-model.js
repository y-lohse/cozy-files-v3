//!FIXME Change selector (ID or react)
import { Selector, t } from 'testcafe'
import { getPageUrl, getElementWithTestId } from '../helpers/utils'

export default class Page {
  constructor() {
    this.loading = getElementWithTestId('loading')
    //page
    this.photoSection = getElementWithTestId('photoSection')
    this.photoEmpty = Selector('[class*="c-empty"]')

    // Upload
    this.btnUpload = getElementWithTestId('uploadButton')
    this.divUpload = getElementWithTestId('uploadQueue')
    this.divUploadSuccess = getElementWithTestId('uploadQueue-success')
    this.modalUpload = Selector('[class*="c-alert-wrapper"]', {
      visibilityCheck: true
    })

    //thumbnails
    this.photoThumb = value => {
      return Selector('[class*="pho-photo-item"]').nth(value)
    }
    this.photoToolbar = Selector(
      '[class*="coz-selectionbar pho-viewer-toolbar-actions"]'
    )

    this.photoCheckbox = Selector(
      '[class*="pho-photo-select"][data-input="checkbox"]'
    )
    //Top Option bar & Confirmation Modal
    this.barPhoto = Selector('[class*="coz-selectionbar"]')
    this.barPhotoBtnAddtoalbum = this.barPhoto.find('button').nth(0) //ADD TO ALBUM
    this.barPhotoBtnDl = this.barPhoto.find('button').nth(1) //DOWNLOAD
    this.barPhotoBtnDelete = this.barPhoto.find('button').nth(2) //DELETE
    this.modalDelete = Selector('[class*="c-modal"]').find('div')
    this.modalDeleteBtnDelete = this.modalDelete.find('button').nth(2) //REMOVE

    this.allPhotosWrapper = this.photoSection.find('[class^="pho-photo"]')
    this.allPhotos = Selector('img[class*="pho-photo-item"]')

    // Photo fullscreen
    this.photoFull = Selector('[class*="pho-viewer-imageviewer"]').find('img')
    this.photoNavNext = Selector('[class*="pho-viewer-nav--next"]')
    this.photoNavNextBtn = this.photoNavNext.find(
      '[class*="pho-viewer-nav-arrow"]'
    )
    this.photoNavPrevious = Selector('[class*="pho-viewer-nav--previous"]')
    this.photoNavPreviousBtn = this.photoNavPrevious.find(
      '[class*="pho-viewer-nav-arrow"]'
    )
    this.photoBtnClose = Selector('[class*="pho-viewer-toolbar-close"]').find(
      '[class*="c-btn"]'
    )
  }

  async initPhotoPage() {
    await this.waitForLoading()
    t.ctx.allPhotosStartCount = await this.getPhotosCount('Before')
  }

  async waitForLoading() {
    await t.expect(this.loading.exists).notOk('Page still loading')
  }

  //@param {string} when : text for console.log
  async getPhotosCount(when) {
    let allPhotosCount

    if (await this.photoEmpty.exists) {
      allPhotosCount = 0
    } else if (await this.photoSection.exists) {
      await t
        .expect(this.allPhotosWrapper.exists)
        .ok('No Picture wrapper')
        .expect(this.allPhotos.exists)
        .ok('No Picture')
      allPhotosCount = await this.allPhotos.count
    }
    console.log(`Number of pictures on page (${when} test):  ${allPhotosCount}`)
    return allPhotosCount
  }

  async uploadPhotos(files) {
    const numOfFiles = files.length
    console.log('Uploading ' + numOfFiles + ' picture(s)')

    await t
      .setFilesToUpload(this.btnUpload, files)
      .expect(this.divUpload.visible)
      .ok('Upload pop-in does not show up')
      .expect(this.divUploadSuccess.visible)
      .ok('Upload pop-in not successfull')

      .expect(this.modalUpload.exists)
      .ok('Photo(s) not uploaded')
      .expect(this.divUpload.child('h4').innerText)
      .match(
        new RegExp('([' + numOfFiles + '].*){2}'),
        'Numbers of pictures uploaded does not match'
      )
    await t.takeScreenshot()

    const allPhotosEndCount = await this.getPhotosCount('After')
    await t
      .expect(allPhotosEndCount)
      .eql(t.ctx.allPhotosStartCount + numOfFiles)
  }

  async selectPhotos(numOfFiles) {
    console.log('Selecting ' + numOfFiles + ' picture(s)')

    await t
      .expect(this.photoThumb(0).exists)
      .ok("1st picture thumb doesn't exist")
      .hover(this.photoThumb(0)) //Only one 'hover' as all checkbox should be visible once the 1st checkbox is checked

    for (let i = 0; i < numOfFiles; i++) {
      await t
        .expect(this.photoCheckbox.nth(i).exists)
        .ok(`${i}th picture checkbox doesn't exist`)
        .click(this.photoCheckbox.nth(i))
    }
    await t.expect(this.barPhoto.visible).ok('Selection bar does not show up')

    // TODO - Add check on label text ??
  }

  async checkPhotobar() {
    await t
      .expect(this.barPhotoBtnAddtoalbum.visible)
      .ok('Button "Add to Album" does not show up')
      .expect(this.barPhotoBtnDl.visible)
      .ok('Button "Download" does not show up')
      .expect(this.barPhotoBtnDelete.visible)
      .ok('Button "Delete" does not show up')
    //!FIXME Add check on label text
  }

  async openPhotoFullscreen(index) {
    await t
      .click(this.photoThumb(index))
      .expect(this.photoFull.visible)
      .ok('Photo is not in fullscreen view')
  }

  async closePhotoFullscreenX() {
    //Pic closed using Button
    await t
      .click(this.photoBtnClose)
      .expect(this.photoFull.exists)
      .notOk('Photo is still in fullscreen view')
  }

  async closePhotoFullscreenEsc() {
    //Pic closed using 'esc'
    await t
      .pressKey('esc')
      .expect(this.photoFull.exists)
      .notOk('Photo is still in fullscreen view')
  }

  async navigateToNextPhoto(index) {
    if (index == t.ctx.allPhotosStartCount - 1) {
      //this is the last picture, so next button does not exist
      await t
        .expect(this.photoNavNext.exists)
        .notOk('Next button on last picture')
    } else {
      const photo1src = await this.photoFull.getAttribute('src')
      const photo1url = await getPageUrl()
      await t
        .hover(this.photoNavNext) //not last photo, so next button should exists
        .expect(this.photoNavNextBtn.visible)
        .ok('Next arrow does not show up')
        .click(this.photoNavNextBtn)

      const photo2src = await this.photoFull.getAttribute('src')
      const photo2url = await getPageUrl()
      //Photo has change, so src & url are different

      await t.expect(photo1src).notEql(photo2src)
      await t.expect(photo1url).notEql(photo2url)
      //!FIXME add data-photo-id=xxx in photo and check url=#/photos/xxx
    }
  }

  async navigateToPrevPhoto(index) {
    if (index == 0) {
      //this is the 1st picture, so previous button does not exist
      await t
        .expect(this.photoNavPrevious.exists)
        .notOk('Previous button on first picture')
    } else {
      const photo1src = await this.photoFull.getAttribute('src')
      const photo1url = await getPageUrl()

      await t
        .hover(this.photoNavPrevious) //not 1st photo, so previous button should exists
        .expect(this.photoNavPreviousBtn.visible)
        .ok('Previous arrow does not show up')
        .click(this.photoNavPrevious)

      const photo2src = await this.photoFull.getAttribute('src')
      const photo2url = await getPageUrl()
      //Photo has change, so src & url are different
      await t.expect(photo1src).notEql(photo2src)
      await t.expect(photo1url).notEql(photo2url)
      //!FIXME add data-photo-id=xxx in photo and check url=#/photos/xxx
    }
  }

  async deletePhotos(numOfFiles) {
    await this.selectPhotos(numOfFiles)

    console.log('Deleting ' + numOfFiles + ' picture(s)')

    await t
      .click(this.barPhotoBtnDelete)
      .expect(this.modalDelete.visible)
      .ok('Delete button does not show up')
      .click(this.modalDeleteBtnDelete)
    await t.takeScreenshot()

    const allPhotosEndCount = await this.getPhotosCount('After')
    await t
      .expect(allPhotosEndCount)
      .eql(t.ctx.allPhotosStartCount - numOfFiles)
  }
}
