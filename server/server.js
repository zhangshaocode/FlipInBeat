/**
 * FlipinBeat 服务器端
 * 功能：PDF乐谱上传（AES-256-GCM加密存储）、下载（解密）、列表、删除
 * 端口：1092
 */

const Koa = require('koa')
const Router = require('koa-router')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const multer = require('@koa/multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = new Koa()
const router = new Router()
const upload = multer({ storage: multer.memoryStorage() })

// ============ 配置 ============
const PORT = 1092
const DATA_DIR = path.join(__dirname, 'data', 'scores')
const META_FILE = path.join(DATA_DIR, 'metadata.json')
// AES-256-GCM 密钥（32字节），生产环境请用环境变量覆盖
const ENCRYPTION_KEY = process.env.FLIPINBEAT_KEY || 'FlipinBeat2026SecretKey32Bytes!!'

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true })
}

// ============ AES-256-GCM 加密/解密 ============

function encryptBuffer(buffer) {
	const key = Buffer.from(ENCRYPTION_KEY, 'utf8')
	const iv = crypto.randomBytes(16) // GCM推荐12字节，这里用16字节
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
	const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
	const authTag = cipher.getAuthTag()
	// 将iv和authTag拼接到密文前面：[iv(16) + authTag(16) + encrypted]
	return Buffer.concat([iv, authTag, encrypted])
}

function decryptBuffer(encryptedBuffer) {
	const key = Buffer.from(ENCRYPTION_KEY, 'utf8')
	const iv = encryptedBuffer.slice(0, 16)
	const authTag = encryptedBuffer.slice(16, 32)
	const encrypted = encryptedBuffer.slice(32)
	const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
	decipher.setAuthTag(authTag)
	return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

// ============ 元数据管理 ============

function loadMetadata() {
	try {
		if (fs.existsSync(META_FILE)) {
			return JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
		}
	} catch (e) {
		console.error('加载元数据失败:', e)
	}
	return { scores: [] }
}

function saveMetadata(meta) {
	fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8')
}

function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// ============ 路由 ============

// 健康检查
router.get('/api/health', (ctx) => {
	ctx.body = { status: 'ok', timestamp: Date.now() }
})

// 上传PDF（加密存储）
router.post('/api/upload', upload.single('file'), (ctx) => {
	try {
		const file = ctx.file
		if (!file) {
			ctx.status = 400
			ctx.body = { error: '未收到文件' }
			return
		}

		// 验证文件类型
		if (!file.originalname.toLowerCase().endsWith('.pdf')) {
			ctx.status = 400
			ctx.body = { error: '仅支持PDF文件' }
			return
		}

		const meta = loadMetadata()

		// 重名处理
		let fileName = file.originalname
		const existing = meta.scores.map(s => s.name)
		if (existing.includes(fileName)) {
			const dotIdx = fileName.lastIndexOf('.')
			const base = dotIdx > 0 ? fileName.substring(0, dotIdx) : fileName
			const ext = dotIdx > 0 ? fileName.substring(dotIdx) : '.pdf'
			let count = 1
			while (existing.includes(`${base}(${count})${ext}`)) {
				count++
			}
			fileName = `${base}(${count})${ext}`
		}

		const id = generateId()
		const encryptedData = encryptBuffer(file.buffer)
		const encryptedPath = path.join(DATA_DIR, `${id}.enc`)

		fs.writeFileSync(encryptedPath, encryptedData)

		const scoreRecord = {
			id: id,
			name: fileName,
			originalSize: file.size,
			encryptedSize: encryptedData.length,
			importDate: Date.now()
		}

		meta.scores.unshift(scoreRecord)
		saveMetadata(meta)

		console.log(`[上传成功] ${fileName} -> ${id}.enc (${file.size} bytes)`)

		ctx.body = {
			success: true,
			score: scoreRecord
		}
	} catch (e) {
		console.error('[上传失败]', e)
		ctx.status = 500
		ctx.body = { error: '服务器内部错误: ' + e.message }
	}
})

// 下载PDF（解密返回）
router.get('/api/download/:id', (ctx) => {
	try {
		const id = ctx.params.id
		const meta = loadMetadata()
		const score = meta.scores.find(s => s.id === id)

		if (!score) {
			ctx.status = 404
			ctx.body = { error: '文件不存在' }
			return
		}

		const encryptedPath = path.join(DATA_DIR, `${id}.enc`)
		if (!fs.existsSync(encryptedPath)) {
			ctx.status = 404
			ctx.body = { error: '加密文件丢失' }
			return
		}

		const encryptedData = fs.readFileSync(encryptedPath)
		const decryptedData = decryptBuffer(encryptedData)

		ctx.set('Content-Type', 'application/pdf')
		ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(score.name)}"`)
		ctx.set('Content-Length', decryptedData.length)
		ctx.body = decryptedData

		console.log(`[下载成功] ${score.name} (${decryptedData.length} bytes)`)
	} catch (e) {
		console.error('[下载失败]', e)
		ctx.status = 500
		ctx.body = { error: '服务器内部错误: ' + e.message }
	}
})

// 获取乐谱列表
router.get('/api/list', (ctx) => {
	const meta = loadMetadata()
	ctx.body = { scores: meta.scores }
})

// 删除乐谱
router.delete('/api/score/:id', (ctx) => {
	try {
		const id = ctx.params.id
		const meta = loadMetadata()
		const idx = meta.scores.findIndex(s => s.id === id)

		if (idx === -1) {
			ctx.status = 404
			ctx.body = { error: '文件不存在' }
			return
		}

		const score = meta.scores[idx]
		meta.scores.splice(idx, 1)
		saveMetadata(meta)

		// 删除加密文件
		const encryptedPath = path.join(DATA_DIR, `${id}.enc`)
		if (fs.existsSync(encryptedPath)) {
			fs.unlinkSync(encryptedPath)
		}

		console.log(`[删除成功] ${score.name}`)
		ctx.body = { success: true }
	} catch (e) {
		console.error('[删除失败]', e)
		ctx.status = 500
		ctx.body = { error: '服务器内部错误: ' + e.message }
	}
})

// ============ 启动服务器 ============

app.use(cors())
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(PORT, () => {
	console.log(`========================================`)
	console.log(`  FlipinBeat 服务器已启动`)
	console.log(`  端口: ${PORT}`)
	console.log(`  数据目录: ${DATA_DIR}`)
	console.log(`  加密方式: AES-256-GCM`)
	console.log(`========================================`)
})
