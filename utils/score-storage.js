/**
 * 乐谱存储工具
 * 支持服务器端加密存储（AES-256-GCM）和本地缓存
 */

const STORAGE_KEY = 'flipinbeat_scores'
const SERVER_BASE = 'http://49.232.71.68:1092'

export const ScoreStorage = {
	// 获取本地缓存的乐谱列表
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

	generateId() {
		return Date.now().toString(36) + Math.random().toString(36).substr(2)
	},

	// ============ 服务器API ============

	/**
	 * 上传PDF到服务器（加密存储）
	 * @param {string} filePath - 临时文件路径
	 * @param {string} fileName - 文件名
	 * @returns {Promise}
	 */
	uploadToServer(filePath, fileName) {
		return new Promise((resolve, reject) => {
			uni.uploadFile({
				url: SERVER_BASE + '/api/upload',
				filePath: filePath,
				name: 'file',
				formData: {},
				success: (res) => {
					try {
						const data = JSON.parse(res.data)
						if (data.success && data.score) {
							// 同步到本地缓存
							this.addScore(data.score)
							resolve(data.score)
						} else {
							reject(new Error(data.error || '上传失败'))
						}
					} catch (e) {
						reject(new Error('解析服务器响应失败: ' + e.message))
					}
				},
				fail: (err) => {
					console.error('Upload failed:', err)
					reject(new Error('网络请求失败: ' + (err.errMsg || err.message || '')))
				}
			})
		})
	},

	/**
	 * 从服务器获取乐谱列表并同步到本地
	 * @returns {Promise}
	 */
	fetchServerList() {
		return new Promise((resolve, reject) => {
			uni.request({
				url: SERVER_BASE + '/api/list',
				method: 'GET',
				success: (res) => {
					if (res.statusCode === 200 && res.data && res.data.scores) {
						var serverScores = res.data.scores
						// 只有服务器返回非空列表时才覆盖本地
						// 避免服务器为空时清空本地已上传的乐谱
						if (serverScores.length > 0) {
							this.saveScores(serverScores)
						}
						resolve(serverScores)
					} else {
						reject(new Error('获取列表失败'))
					}
				},
				fail: (err) => {
					console.error('Fetch list failed:', err)
					reject(new Error('网络请求失败'))
				}
			})
		})
	},

	/**
	 * 从服务器删除乐谱
	 * @param {string} id - 乐谱ID
	 * @returns {Promise}
	 */
	deleteFromServer(id) {
		return new Promise((resolve, reject) => {
			uni.request({
				url: SERVER_BASE + '/api/score/' + id,
				method: 'DELETE',
				success: (res) => {
					if (res.statusCode === 200) {
						this.removeScore(id)
						resolve(true)
					} else {
						reject(new Error('删除失败'))
					}
				},
				fail: (err) => {
					console.error('Delete failed:', err)
					reject(new Error('网络请求失败'))
				}
			})
		})
	},

	/**
	 * 获取服务器下载URL
	 * @param {string} id - 乐谱ID
	 * @returns {string}
	 */
	getDownloadUrl(id) {
		return SERVER_BASE + '/api/download/' + id
	}
}
