import sweetAlert from "../helper/sweetAlert"
import getUrl from "../helper/getHostUrl"

// Model
class Model {
  constructor() {
    this.url = getUrl('/api')
    this.objectUrl = this.url + '/objects'
    this.data = [] // all data
    this.prefix = '' // folder path
    this.map = null
  }
  async fetchData() {
    try {
      const response = await fetch(this.objectUrl)
      const data = await response.json()
      this.data = this.sortContentType(data)
    } catch (err) {
      alert('Can not fetch data')
    }
  }
  async postFile(form) {
    const formData = new FormData(form)
    return fetch(this.objectUrl, {
      method: 'POST',
      body: formData
    })
  }
  async deleteFile(Key) {
    return fetch(this.objectUrl, {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Key: Key })
    })
  }
  getObjectURL(prefix, delimiter) {
    return `${this.objectUrl}?prefix=${prefix || ''}&delimiter=${delimiter || ''}`
  }
  sortContentType(contents) {
    contents.sort((a, b) => {
      // a is less than b
      if (a.type === 'file' && b.type === 'folder') {
        return 1
      }
      // b is less than a
      else if (a.type === 'folder' && b.type === 'file') {
        return -1
      }
      else {
        return 0
      }
    })
    return contents
  }
  getDataType(type) {
    return this.data.filter(item => item.type === type)
  }
  createFolderMap() {
    const folders = this.getDataType('folder')
    const map = new Map()
    const currentPaths = this.prefix.split('/') || ''
    const currentDepth = currentPaths.length - 1 || 0
    const currentFolder = currentPaths[currentPaths.length - 2]
    let isCompleted = false

    // filter folders
    const filterFolders = folders.filter(folder => {
      const folderKey = folder.key
      const folderPaths = folderKey.split('/')
      const currentPaths = this.prefix.split('/')
      if (folderPaths > currentPaths) return false
      // if paths is different
      for (let i = 0; i < folderPaths.length; i++) {
        if (folderPaths[i] !== currentPaths[i]) return false
      }
      return true
    })

    filterFolders.forEach(folder => {
      if (isCompleted) return
      const folderKey = folder.key
      const paths = folderKey.split('/')
      paths.pop()
      let prefix = ''

      for (let i = 0; i < paths.length; i++) {
        if (i + 1 > currentDepth) return
        if (i + 1 === currentDepth && paths[i] !== currentFolder) continue
        prefix += (paths[i] + '/')
        map.set(paths[i], prefix)

      }
    })
    return map
  }
}

// View
class View {
  constructor(model, controller) {
    this.model = model
    this.controller = controller
    this.table = document.querySelector('#bucket-table')
    this.tableBody = document.querySelector('#table-body')
  }
  tableBodyLoading() {
    this.tableBody.innerHTML = ''
    const loadingRow = document.createElement('tr')
    const loadingTd = document.createElement('td')
    loadingTd.innerText = 'Loading...'
    loadingTd.colSpan = 4
    loadingTd.classList = ['text-center']
    loadingRow.appendChild(loadingTd)
    this.tableBody.appendChild(loadingRow)
  }
  renderTableBody(data) {
    this.tableBody.innerHTML = ''

    // filter object with prefix 
    const prefix = this.model.prefix
    // match key that start with prefix, and doesn't end with a '/' (folder)
    // also prevent the key === the prefix (current folder)
    const regex = new RegExp(`^${prefix}(?!$)[^/]*\/?$`)

    const contents = data.filter(object => regex.test(object.key))

    // if contents is empty
    if (contents.length === 0) {
      const row = document.createElement('tr')
      const td = document.createElement('td')
      td.innerText = 'no file'
      td.colSpan = 1000
      td.classList = ['text-center']
      row.appendChild(td)
      this.tableBody.appendChild(row)
      return
    }

    // Generate table row
    for (const object of contents) {
      // table row
      const row = document.createElement('tr')
      if (object.type === 'folder') {
        row.classList.add('table-secondary')
      }

      // Key
      const keyCol = document.createElement('td')
      const keySpan = document.createElement('span')
      const keyLink = document.createElement('a')
      // key icon
      const keyIcon = document.createElement('img')
      keyIcon.classList.add('icon')
      keyIcon.src = `/images/icons/${object.type}.svg`

      keySpan.appendChild(keyIcon)
      keySpan.innerHTML += ' '
      keySpan.appendChild(keyLink)
      keyCol.appendChild(keySpan)

      // cut the text to the last part
      const keyArray = object.key.split('/')
      if (keyArray[keyArray.length - 1] === '') {
        keyLink.innerText = keyArray[keyArray.length - 2]
      } else {
        keyLink.innerText = keyArray[keyArray.length - 1]
      }

      if (object.type === 'file') {
        keyLink.target = '_blank'
        keyLink.href = object.url
      }
      if (object.type === 'folder') {
        keyLink.href = 'javascript:void(0)'
        // add controller handler
        keyLink.onclick = () => {
          view.controller.changeCurrentPrefix(object.key)
        }
      }
      row.appendChild(keyCol)


      // preview image
      const previewCol = document.createElement('td')
      if (object.type === 'file' && object.url) {
        // show image preview
        const image = document.createElement('img')
        image.src = object.url
        image.classList.add('bucket-preview')
        previewCol.appendChild(image)

        // click image to show image
        image.onclick = () => sweetAlert.image(object.url, '100%')
      }
      row.appendChild(previewCol)

      // Size
      const sizeCol = document.createElement('td')
      if (object.type === 'file') {
        sizeCol.innerText = object.bytes || ''
      }
      row.appendChild(sizeCol)

      // delete
      const deleteCol = document.createElement('td')
      if (object.type === 'file') {
        const deleteButton = document.createElement('button')
        deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>'
        deleteButton.classList.add('btn', 'btn-danger', 'delete')
        deleteButton.onclick = (e) => {
          this.controller.deleteObjectButtonFnc(e.target, object.key)
        }
        deleteCol.appendChild(deleteButton)
      }
      row.appendChild(deleteCol)

      // append to table-body
      this.tableBody.appendChild(row)
    }
  }
  createFolderMapLinks(folderMap) {
    const div = document.createElement('div')

    function appendFolderLink(key, prefix) {
      const link = document.createElement('a')
      link.href = '#'
      link.innerText = key
      link.classList.add('folder-link')

      // link on click 
      link.onclick = function (e) {
        e.preventDefault()
        // controller
        view.controller.changeCurrentPrefix(prefix)
      }
      // color current prefix link
      if (prefix === view.model.prefix) {
        link.classList.add('text-danger')
      }

      const span = document.createElement('span')
      span.innerText = ' / '
      div.appendChild(link)
      div.appendChild(span)
    }

    // Root folder
    appendFolderLink('Root', '')

    // Other folders
    for (const [key, prefix] of folderMap.entries()) {
      appendFolderLink(key, prefix)
    }
    return div
  }
  async renderFolderMap() {
    const folderMapContainer = document.querySelector('#folder-map-container')
    folderMapContainer.innerHTML = ''

    // filter content type
    const folders = this.model.getDataType('folder')

    // create folders map
    const foldersMap = this.model.createFolderMap(folders)
    const foldersMapDiv = this.createFolderMapLinks(foldersMap)
    // insert 
    folderMapContainer.appendChild(foldersMapDiv)

  }
  uploadButtonShowLoading() {
    // loading icon on upload button
    const uploadBtn = document.querySelector('#upload')
    uploadBtn.innerHTML = ''
    const loading = document.createElement('div')
    loading.classList.add('loading-icon')
    uploadBtn.appendChild(loading)
  }
  resetUploadForm() {
    const nameInput = document.querySelector('#name-input')
    const keyInput = document.querySelector('#key-input')
    const fileInput = document.querySelector('#file-input')
    const button = document.querySelector('#upload')
    nameInput.value = ''
    keyInput.value = ''
    fileInput.value = null
    button.innerHTML = ''
    button.innerText = 'Upload'
  }
  updateCurrentPrefix(folderName) {
    const currentFolder = document.querySelector('#current-prefix')
    currentFolder.innerText = folderName || 'Root'
  }
}

// Controller
class Controller {
  constructor(model, view) {
    this.model = model
    this.view = view
  }
  async init() {
    await this.fetchAndRender()
    // set upload button
    const upload = document.querySelector('#upload')
    upload.onclick = (e) => {
      e.preventDefault()
      this.uploadButtonFuc()
    }
  }
  async fetchAndRender() {
    // show loading
    this.view.tableBodyLoading()
    await this.model.fetchData()
    this.view.renderTableBody(this.model.data)
    this.view.renderFolderMap()
  }
  async deleteObjectButtonFnc(button, Key) {
    try {
      const result = await sweetAlert.confirm('Delete File', `Are you sure you want to delete ${Key}`)
      if (!result.isConfirmed) return

      // show loading icon
      const text = button.innerText
      button.innerHTML = ''
      button.classList.add('loading-icon')

      // DELETE
      const response = await this.model.deleteFile(Key)

      // finished
      button.innerText = text
      this.fetchAndRender()

    } catch (err) {
      alert(err)
      location.reload()
    }
  }
  async uploadButtonFuc() {
    try {
      const form = document.querySelector('#upload-form')
      const nameInput = document.querySelector('#name-input')
      const keyInput = document.querySelector('#key-input') // hidden
      const fileInput = document.querySelector('#file-input')

      if (!form) throw new Error('Missing upload form')
      if (!nameInput.value?.trim()) throw new Error('Missing Key')
      if (!fileInput.files) throw new Error('Missing File')

      // add prefix to key
      keyInput.value = this.model.prefix + nameInput.value

      // upload button loading
      this.view.uploadButtonShowLoading()

      // POST 
      const response = await this.model.postFile(form)
      const json = await response.json()


      if (!json.ok) throw new Error(json.err)
      this.view.resetUploadForm()
      this.fetchAndRender()

    } catch (err) {
      await sweetAlert.error('Fail To Upload', err)
      location.reload()
    }
  }
  changeCurrentPrefix(prefix) {
    controller.model.prefix = prefix
    this.fetchAndRender()
    this.view.updateCurrentPrefix(this.model.prefix)
  }
}

const model = new Model()
const view = new View()
const controller = new Controller()
view.model = model
view.controller = controller
controller.model = model
controller.view = view
controller.init()


