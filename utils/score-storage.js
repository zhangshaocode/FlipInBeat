const STORAGE_KEY = 'flipinbeat_scores'

export const ScoreStorage = {
  getScores() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to get scores:', e)
      return []
    }
  },

  saveScores(scores) {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(scores))
      return true
    } catch (e) {
      console.error('Failed to save scores:', e)
      return false
    }
  },

  addScore(score) {
    const scores = this.getScores()
    scores.unshift(score)
    return this.saveScores(scores)
  },

  removeScore(id) {
    const scores = this.getScores()
    const newScores = scores.filter(s => s.id !== id)
    return this.saveScores(newScores)
  },

  getScoreById(id) {
    const scores = this.getScores()
    return scores.find(s => s.id === id)
  },

  checkDuplicateName(name) {
    const scores = this.getScores()
    return scores.some(s => s.name === name)
  },

  generateUniqueName(originalName) {
    const scores = this.getScores()
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const ext = originalName.match(/\.[^/.]+$/)?.[0] || '.pdf'
    
    let counter = 1
    let newName = originalName
    
    while (scores.some(s => s.name === newName)) {
      newName = `${nameWithoutExt}(${counter})${ext}`
      counter++
    }
    
    return newName
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}

export function saveFileToLocal(tempFilePath, fileName) {
  return new Promise((resolve, reject) => {
    if (uni.getFileSystemManager) {
      const fs = uni.getFileSystemManager()
      fs.readFile({
        filePath: tempFilePath,
        encoding: 'base64',
        success: (res) => {
          resolve({
            savedFilePath: res.data,
            fileName: fileName,
            isBase64: true
          })
        },
        fail: (err) => {
          console.warn('readFile failed, falling back to saveFile:', err)
          uni.saveFile({
            tempFilePath: tempFilePath,
            success: (res) => {
              resolve({
                savedFilePath: res.savedFilePath,
                fileName: fileName,
                isBase64: false
              })
            },
            fail: (saveErr) => {
              console.warn('saveFile also failed, using temp path:', saveErr)
              resolve({
                savedFilePath: tempFilePath,
                fileName: fileName,
                isBase64: false
              })
            }
          })
        }
      })
    } else {
      fetch(tempFilePath)
        .then(response => response.arrayBuffer())
        .then(buffer => {
          const base64 = arrayBufferToBase64(buffer)
          resolve({
            savedFilePath: base64,
            fileName: fileName,
            isBase64: true
          })
        })
        .catch(err => {
          console.warn('fetch failed, using temp path:', err)
          resolve({
            savedFilePath: tempFilePath,
            fileName: fileName,
            isBase64: false
          })
        })
    }
  })
}

function arrayBufferToBase64(buffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
