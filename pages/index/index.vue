<template>
	<view class="container" :class="{ 
		'tablet-mode': isTablet, 
		'sheet-expanded': isSheetExpanded,
		'reading-mode': pdfLoaded
	}" :style="themeStyle">
	<!-- #ifdef APP-PLUS || H5 -->
		<view :prop="audioData" :change:prop="audio.onAudioDataChange" class="hidden"></view>
		<view :prop="fileTrigger" :change:prop="audio.onFileTrigger" class="hidden"></view>
		<view :prop="pdfData" :change:prop="audio.onPdfDataChange" class="hidden"></view>
	<!-- #endif -->
		<view class="header" v-if="!pdfLoaded">
			<view class="header-left">
				<text class="title">FlipinBeat</text>
				<text class="subtitle">{{ currentTab === 'library' ? '谱架' : currentTab === 'metronome' ? '节拍器' : '设置' }}</text>
			</view>
			<view class="header-right">
				<view class="import-btn" @click="importPDF">
					<text class="import-icon">+</text>
				</view>
			</view>
		</view>

		<view class="main-content">
			<view class="reader-container" v-if="pdfLoaded">
				<view class="reader-back-btn" @click="closePDF">
					<text>←</text>
				</view>
				<view class="pdf-loading-overlay" v-if="pdfLoading">
					<view class="loading-spinner"></view>
					<text class="loading-text">正在加载中，请稍后...</text>
				</view>
				<view class="pdf-canvas-wrapper" id="pdfCanvasContainer" :class="{ 'page-turning': isPageTurning, 'turn-left': turnDirection === 'left', 'turn-right': turnDirection === 'right' }">
				</view>
				<view class="page-indicator">
					<text class="page-text">{{ currentPage + 1 }} / {{ totalPages }}</text>
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
					</view>
				</view>
			</view>

			<view class="library-view" v-else-if="currentTab === 'library'">
				<view v-if="scoreList.length === 0" class="empty-library" @click="importPDF">
					<view class="decoration-bg"></view>
					<view class="empty-card">
						<view class="empty-icon-wrapper">
							<text class="empty-icon">🎹</text>
						</view>
						<text class="empty-title">FlipinBeat</text>
						<text class="empty-subtitle">翻页节拍器</text>
						<text class="empty-desc">点击任意位置导入乐谱</text>
						<view class="empty-btn">
							<text class="empty-btn-text">导入乐谱</text>
							<text class="empty-btn-icon">+</text>
						</view>
					</view>
				</view>

				<view v-else class="score-grid">
					<view 
						v-for="score in scoreList" 
						:key="score.id"
						class="score-card"
						@click="openScore(score)"
						@longpress="showScoreMenu(score)"
					>
						<view class="score-icon">
							<text>📄</text>
						</view>
						<view class="score-info">
							<text class="score-name">{{ score.name }}</text>
							<text class="score-date">{{ formatDate(score.importDate) }}</text>
						</view>
						<view class="score-arrow">
							<text>›</text>
						</view>
					</view>
				</view>
			</view>

			<view class="settings-view" v-else-if="currentTab === 'settings'">
				<view class="section-header">
					<text class="section-title">主题设置</text>
				</view>
				<view class="theme-selector">
					<view 
						v-for="(theme, key) in themes" 
						:key="key" 
						class="theme-card"
						:class="{ 'active': currentTheme === key }"
						:style="{ '--theme-primary': theme.primary, '--theme-secondary': theme.secondary }"
						@click="setTheme(key)"
					>
						<view class="theme-color-preview" :style="{ background: theme.primary }"></view>
						<text class="theme-name">{{ theme.name }}</text>
						<view v-if="currentTheme === key" class="theme-check">✓</view>
					</view>
				</view>
				
				<view class="section-header">
					<text class="section-title">节拍器效果</text>
				</view>
				<view class="settings-list">
					<view class="setting-item" @click="toggleParticleEffect">
						<text class="setting-icon">✨</text>
						<text class="setting-label">粒子爆破效果</text>
						<view class="toggle-switch" :class="{ 'on': particleEffect }">
							<view class="toggle-knob"></view>
						</view>
					</view>
				</view>
				
				<view class="section-header">
					<text class="section-title">关于</text>
				</view>
				<view class="settings-list">
					<view class="setting-item">
						<text class="setting-icon">ℹ️</text>
						<text class="setting-label">关于 FlipinBeat</text>
						<text class="setting-version">v1.0.0</text>
					</view>
				</view>
			</view>
		</view>

		<metronome-panel 
			:isVisible="currentTab === 'metronome' || pdfLoaded"
			:isFloating="pdfLoaded"
			:isPlaying="isPlaying"
			:bpm="bpm"
			:timeSignature="timeSignature"
			:toneType="toneType"
			:currentBeat="displayBeat"
			:currentBeats="currentBeats"
			:particleEffect="particleEffect"
			:theme="themes[currentTheme]"
			@togglePlay="togglePlay"
			@adjustBpm="adjustBpm"
			@timeSignatureChange="setTimeSignature"
			@toneChange="setTone"
			@toggle="onMetronomeToggle"
		/>
		
		<view class="tutorial-overlay" v-if="showMetronomeTutorial" @click="closeTutorial">
			<view class="tutorial-content">
				<view class="tutorial-arrow"></view>
				<text class="tutorial-text">点击底部"节拍器"按钮\n打开节拍器面板</text>
			</view>
		</view>

		<bottom-nav 
			v-if="!pdfLoaded || currentTab === 'metronome'"
			:currentTab="currentTab"
			:isPlaying="isPlaying"
			:theme="themes[currentTheme]"
			@change="switchTab"
		/>

		<view class="toast" v-if="showToast">
			<text>{{ toastMessage }}</text>
		</view>
	</view>
</template>

<script>
	import BottomNav from '@/components/bottom-nav.vue'
	import MetronomePanel from '@/components/metronome-panel.vue'
	import { ScoreStorage, saveFileToLocal } from '@/utils/score-storage.js'

	export default {
		components: {
			BottomNav,
			MetronomePanel
		},
		
		data() {
			return {
				isTablet: false,
				currentTab: 'library',
				showMetronomeTutorial: false,
				pdfLoaded: false,
				pdfData: '',
				pdfLoading: false,
				isPageTurning: false,
				turnDirection: 'left',
				pdfViewerUrl: '',
				pdfFilePath: '',
				currentPage: 0,
				totalPages: 0,
				currentScoreName: '',
				scoreList: [],
				isSheetExpanded: false,
				
				isPlaying: false,
				isMetronomeExpanded: true,
				bpm: 120,
				timeSignature: '4/4',
				toneType: 'click',
				currentBeat: 1,
				displayBeat: 0,
				currentBeats: [1, 2, 3, 4],
				nextNoteTime: 0,
				timerID: null,
				audioContext: null,
				scheduleAheadTime: 0.1,
				lookahead: 25,
				
				audioData: { beat: 0, isStrong: false, bpm: 120, toneType: 'click' },
				fileTrigger: 0,
				
				currentTheme: 'skyblue',
				themes: {
					skyblue: { name: '天蓝色', primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD', bg: '#F0F9FF' },
					purple: { name: '紫色', primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD', bg: '#FAF5FF' },
					green: { name: '浅绿色', primary: '#10B981', secondary: '#34D399', accent: '#6EE7B7', bg: '#F0FDF4' }
				},
				particleEffect: true,
				
				showToast: false,
				toastMessage: ''
			}
		},
		
		computed: {
			progressPercent() {
				return this.totalPages > 0 ? ((this.currentPage + 1) / this.totalPages) * 100 : 0
			},
			
			beatsPerMeasure() {
				return parseInt(this.timeSignature.split('/')[0])
			},
			
			themeStyle() {
				const theme = this.themes[this.currentTheme]
				return {
					'--theme-primary': theme.primary,
					'--theme-secondary': theme.secondary,
					'--theme-accent': theme.accent,
					'--theme-bg': theme.bg
				}
			}
		},
		
		onLoad() {
			this.checkDeviceType()
			this.initAudioContext()
			
			const savedTheme = uni.getStorageSync('flipinbeat_theme')
			if (savedTheme && this.themes[savedTheme]) {
				this.currentTheme = savedTheme
			} else {
				this.currentTheme = 'skyblue'
			}
			
			const savedParticle = uni.getStorageSync('flipinbeat_particle')
			if (savedParticle !== undefined) {
				this.particleEffect = savedParticle === 'true' || savedParticle === true
			} else {
				this.particleEffect = true
			}
			
			this.loadScores()
			
			const hasSeenTutorial = uni.getStorageSync('hasSeenMetronomeTutorial')
			if (!hasSeenTutorial) {
				setTimeout(() => {
					this.showMetronomeTutorial = true
				}, 1500)
			}
		},
		
		onShow() {
			console.log('Page onShow, loading scores...')
			this.scoreList = ScoreStorage.getScores()
			console.log('Loaded scores count:', this.scoreList.length)
			if (this.scoreList.length > 0) {
				this.currentTab = 'library'
			}
		},
		
		onUnload() {
				this.stopMetronome()
				if (this.audioCtx) {
					this.audioCtx.close()
				}
				if (this.innerAudioStrong) {
					this.innerAudioStrong.destroy()
				}
				if (this.innerAudioWeak) {
					this.innerAudioWeak.destroy()
				}
				if (this.innerAudio) {
					this.innerAudio.destroy()
				}
			},
		
		methods: {
			checkDeviceType() {
				uni.getSystemInfo({
					success: (res) => {
						const screenWidth = res.windowWidth || res.screenWidth
						const screenHeight = res.windowHeight || res.screenHeight
						this.isTablet = screenWidth >= 768 || (screenWidth / screenHeight) > 1.5
					}
				})
			},
			
			initAudioContext() {
				this.audioInitialized = false
			},
			
			ensureAudioContext() {
				if (this.audioInitialized) {
					if (this.audioCtx && this.audioCtx.state === 'suspended') {
						this.audioCtx.resume()
					}
					return
				}
				
				if (typeof window !== 'undefined') {
					try {
						const AudioContext = window.AudioContext || window.webkitAudioContext
						if (AudioContext) {
							this.audioCtx = new AudioContext()
							this.audioInitialized = true
							return
						}
					} catch (e) {
						console.error('Web AudioContext init failed:', e)
					}
				}
				
				if (typeof uni !== 'undefined') {
					try {
						this.innerAudioStrong = uni.createInnerAudioContext()
						this.innerAudioStrong.src = '/static/click1.wav'
						this.innerAudioStrong.volume = 1.0
						this.innerAudioStrong.onError = (res) => {
							console.error('InnerAudio strong error:', res)
						}
						this.innerAudioStrong.onEnded = () => {}
						
						this.innerAudioWeak = uni.createInnerAudioContext()
						this.innerAudioWeak.src = '/static/click1.wav'
						this.innerAudioWeak.volume = 0.7
						this.innerAudioWeak.onError = (res) => {
							console.error('InnerAudio weak error:', res)
						}
						this.innerAudioWeak.onEnded = () => {}
						
						this.audioInitialized = true
						return
					} catch (e) {
						console.error('InnerAudioContext init failed:', e)
					}
				}
			},
			
			loadScores() {
				this.scoreList = ScoreStorage.getScores()
			},
			
			switchTab(tab) {
				this.currentTab = tab
				if (tab === 'metronome') {
					uni.setStorageSync('hasSeenMetronomeTutorial', true)
				}
			},
			
			setTheme(themeKey) {
				this.currentTheme = themeKey
				uni.setStorageSync('flipinbeat_theme', themeKey)
				this.showToastMsg(`已切换到${this.themes[themeKey].name}主题`)
			},
			
			toggleParticleEffect() {
				this.particleEffect = !this.particleEffect
				uni.setStorageSync('flipinbeat_particle', this.particleEffect)
				this.showToastMsg(this.particleEffect ? '粒子效果已开启' : '粒子效果已关闭')
			},
			
			importPDF() {
				//#ifdef MP-WEIXIN
				this.showToastMsg('微信小程序不支持文件导入，请使用APP端')
				return
				//#endif
				
				this.fileTrigger++
			},
			
			onFileSelected(data) {
				console.log('onFileSelected:', data.name, data.base64 ? data.base64.length : 0)
				this.showToastMsg('正在加载乐谱...')
				this.openPDFDirectly(data.base64, data.name)
			},
			
			openPDFDirectly(base64, fileName) {
				this.currentScoreName = fileName
				this.totalPages = 10
				this.currentPage = 0
				this.pdfLoading = true
				this.pdfData = base64
				this.pdfLoaded = true
			},
			
			closePDF() {
				this.pdfLoaded = false
				this.pdfLoading = false
				this.pdfData = ''
				this.currentScoreName = ''
			},
			
			onPDFLoaded(data) {
				console.log('PDF loaded, total pages:', data.totalPages)
				this.totalPages = data.totalPages
				this.pdfLoading = false
			},
			
			onPageChanged(data) {
				this.currentPage = data.page - 1
				this.progressPercent = ((data.page) / this.totalPages) * 100
				
				if (data.direction) {
					this.turnDirection = data.direction
				}
				this.isPageTurning = true
				setTimeout(() => {
					this.isPageTurning = false
				}, 400)
			},
			
						handleActivityResult(data) {
				console.log('handleActivityResult called:', data)
				try {
					const uri = plus.android.invoke(data, 'getData')
					console.log('URI:', uri)
					
					const resolver = plus.android.runtimeMainActivity().getContentResolver()
					
					let fileName = 'unknown.pdf'
					try {
						const cursor = plus.android.invoke(resolver, 'query', uri, null, null, null, null)
						if (cursor) {
							const nameIndex = plus.android.invoke(cursor, 'getColumnIndex', '_display_name')
							plus.android.invoke(cursor, 'moveToFirst')
							fileName = plus.android.invoke(cursor, 'getString', nameIndex) || 'unknown.pdf'
							plus.android.invoke(cursor, 'close')
						}
					} catch (e) {
						console.warn('Failed to get filename from cursor:', e)
						fileName = 'imported.pdf'
					}
					console.log('File name:', fileName)
					
					this.copyFileToAppStorage(uri, fileName)
				} catch (err) {
					console.error('File read failed:', err)
					this.showToastMsg('文件处理失败: ' + err.message)
				}
			},
			
			copyFileToAppStorage(uri, fileName) {
				console.log('copyFileToAppStorage:', fileName)
				this.showToastMsg('正在导入文件...')
				
				try {
					const resolver = plus.android.runtimeMainActivity().getContentResolver()
					const inputStream = plus.android.invoke(resolver, 'openInputStream', uri)
					console.log('InputStream:', inputStream ? 'OK' : 'null')
					
					if (!inputStream) {
						this.showToastMsg('无法打开文件')
						return
					}
					
					const docDir = plus.io.convertLocalFileSystemURL('_doc/')
					console.log('Doc dir:', docDir)
					
					const File = plus.android.importClass('java.io.File')
					const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
					const Channels = plus.android.importClass('java.nio.channels.Channels')
					
					const extIndex = fileName.lastIndexOf('.')
					const baseName = extIndex > 0 ? fileName.substring(0, extIndex) : fileName
					const ext = extIndex > 0 ? fileName.substring(extIndex) : '.pdf'
					
					let finalName = fileName
					const existingScores = ScoreStorage.getScores()
					if (existingScores.some(s => s.name === fileName)) {
						let count = 1
						while (existingScores.some(s => s.name === `${baseName}(${count})${ext}`)) {
							count++
						}
						finalName = `${baseName}(${count})${ext}`
					}
					
					const outputFile = new File(docDir, finalName)
					const outputStream = new FileOutputStream(outputFile)
					
					const srcChannel = plus.android.invoke(Channels, 'newChannel', inputStream)
					const destChannel = plus.android.invoke(outputStream, 'getChannel')
					
					let totalTransferred = 0
					const chunkSize = 1048576
					while (true) {
						const transferred = plus.android.invoke(destChannel, 'transferFrom', srcChannel, totalTransferred, chunkSize)
						let count = 0
						try { count = Number(transferred); if (isNaN(count)) count = 0 }
						catch (e) { count = 0 }
						if (count <= 0) break
						totalTransferred += count
					}
					console.log('Total transferred:', totalTransferred)
					
					plus.android.invoke(srcChannel, 'close')
					plus.android.invoke(destChannel, 'close')
					plus.android.invoke(outputStream, 'close')
					plus.android.invoke(inputStream, 'close')
					
					const fileSize = plus.android.invoke(outputFile, 'length')
					console.log('Output file size:', fileSize)
					
					if (fileSize > 0) {
						const fileUrl = outputFile.toURL ? plus.android.invoke(outputFile, 'toURL') : ('file://' + docDir + finalName)
						console.log('File URL:', fileUrl)
						
						const newScore = {
							id: ScoreStorage.generateId(),
							name: finalName,
							localPath: String(fileUrl),
							isBase64: false,
							importDate: Date.now()
						}
						
						ScoreStorage.addScore(newScore)
						
						const that = this
						this.$nextTick(() => {
							that.scoreList = ScoreStorage.getScores()
							console.log('Score list updated:', that.scoreList.length)
							setTimeout(() => {
								that.currentTab = 'library'
								that.showToastMsg('乐谱导入成功')
							}, 100)
						})
					} else {
						console.error('Output file is empty')
						this.showToastMsg('文件保存失败')
					}
				} catch (err) {
					console.error('Copy file failed:', err)
					try {
						this.copyFileViaFileUtilsFallback(uri, fileName)
					} catch (e2) {
						this.showToastMsg('文件导入失败: ' + err.message)
					}
				}
			},
			
			copyFileViaFileUtilsFallback(uri, fileName) {
				console.log('Trying FileUtils.copy fallback')
				const resolver = plus.android.runtimeMainActivity().getContentResolver()
				const inputStream = plus.android.invoke(resolver, 'openInputStream', uri)
				const docDir = plus.io.convertLocalFileSystemURL('_doc/')
				const File = plus.android.importClass('java.io.File')
				const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
				const outputFile = new File(docDir, fileName)
				const outputStream = new FileOutputStream(outputFile)
				
				const FileUtils = plus.android.importClass('android.os.FileUtils')
				plus.android.invoke(FileUtils, 'copy', inputStream, outputStream)
				
				plus.android.invoke(outputStream, 'flush')
				plus.android.invoke(outputStream, 'close')
				plus.android.invoke(inputStream, 'close')
				
				const fileSize = plus.android.invoke(outputFile, 'length')
				console.log('FileUtils copy result, size:', fileSize)
				
				if (fileSize > 0) {
					const newScore = {
						id: ScoreStorage.generateId(),
						name: fileName,
						localPath: 'file://' + docDir + fileName,
						isBase64: false,
						importDate: Date.now()
					}
					ScoreStorage.addScore(newScore)
					const that = this
					this.$nextTick(() => {
						that.scoreList = ScoreStorage.getScores()
						setTimeout(() => { that.currentTab = 'library'; that.showToastMsg('乐谱导入成功') }, 100)
					})
				} else {
					this.showToastMsg('文件导入失败')
				}
			},
			
			readFileUsingJava(uri, fileName) {
				console.log('readFileUsingJava:', fileName)
				
				try {
					const uriStr = plus.android.invoke(uri, 'toString')
					console.log('URI string:', uriStr)
					
					let filePath = ''
					const resolver = plus.android.runtimeMainActivity().getContentResolver()
					
					try {
						const cursor = plus.android.invoke(resolver, 'query', uri, ['_data'], null, null, null)
						if (cursor) {
							plus.android.invoke(cursor, 'moveToFirst')
							const colIdx = plus.android.invoke(cursor, 'getColumnIndex', '_data')
							filePath = plus.android.invoke(cursor, 'getString', colIdx)
							plus.android.invoke(cursor, 'close')
							console.log('Got _data from cursor:', filePath)
						}
					} catch (e) {
						console.warn('Cursor query failed:', e)
					}
					
					if (!filePath) {
						console.warn('Could not resolve file path, trying content resolver')
						this.readFileWithContentResolver(uri, fileName)
						return
					}
					
					const File = plus.android.importClass('java.io.File')
					const file = new File(filePath)
					const exists = plus.android.invoke(file, 'exists')
					const size = plus.android.invoke(file, 'length')
					console.log('File exists:', exists, 'size:', size)
					
					if (!exists || size <= 0) {
						console.error('File not found or empty at:', filePath)
						this.readFileWithContentResolver(uri, fileName)
						return
					}
					
					const FileInputStream = plus.android.importClass('java.io.FileInputStream')
					const ByteArrayOutputStream = plus.android.importClass('java.io.ByteArrayOutputStream')
					const fis = new FileInputStream(file)
					const baos = new ByteArrayOutputStream()
					const ByteBuffer = plus.android.importClass('java.nio.ByteBuffer')
					const buf = plus.android.invoke(ByteBuffer, 'allocate', 8192)
					const buffer = plus.android.invoke(buf, 'array')
					let totalRead = 0
					
					while (true) {
						const byteCountObj = plus.android.invoke(fis, 'read', buffer)
						let byteCount = -1
						if (byteCountObj === null || byteCountObj === undefined) {
							break
						}
						try {
							byteCount = parseInt(byteCountObj.toString())
						} catch (e) {
							byteCount = -1
						}
						if (byteCount <= 0) break
						
						plus.android.invoke(baos, 'write', buffer, 0, byteCount)
						totalRead += byteCount
					}
					plus.android.invoke(fis, 'close')
					console.log('Total bytes read:', totalRead)
					
					const byteArray = plus.android.invoke(baos, 'toByteArray')
					const byteLength = plus.android.invoke(byteArray, 'length')
					console.log('Byte array length:', byteLength)
					
					const Base64 = plus.android.importClass('android.util.Base64')
					const base64Str = plus.android.invoke(Base64, 'encodeToString', byteArray, Base64.DEFAULT)
					console.log('Base64长度:', base64Str ? base64Str.length : 0)
					
					if (base64Str && base64Str.length > 100) {
						this.handleBase64Import(base64Str, fileName)
					} else {
						console.error('Base64 conversion returned null/empty')
						this.showToastMsg('文件数据转换失败')
					}
				} catch (e) {
					console.error('Java file read failed:', e)
					this.readFileWithContentResolver(uri, fileName)
				}
			},
			
			readFileWithContentResolver(uri, fileName) {
				console.log('readFileWithContentResolver:', fileName)
				
				try {
					const resolver = plus.android.runtimeMainActivity().getContentResolver()
					const inputStream = plus.android.invoke(resolver, 'openInputStream', uri)
					console.log('InputStream:', inputStream ? 'OK' : 'null')
					
					if (!inputStream) {
						this.showToastMsg('无法打开文件')
						return
					}
					
					const ByteArrayOutputStream = plus.android.importClass('java.io.ByteArrayOutputStream')
					const ByteBuffer = plus.android.importClass('java.nio.ByteBuffer')
					const baos = new ByteArrayOutputStream()
					const buf = plus.android.invoke(ByteBuffer, 'allocate', 8192)
					const buffer = plus.android.invoke(buf, 'array')
					let totalRead = 0
					
					while (true) {
						const result = plus.android.invoke(inputStream, 'read', buffer)
						let byteCount = -1
						
						try { byteCount = Number(result); if (isNaN(byteCount)) byteCount = -1 }
						catch (e) {
							try { byteCount = parseInt(plus.android.invoke(result, 'toString')) }
							catch (e2) { break }
						}
						
						if (byteCount <= 0) break
						
						plus.android.invoke(baos, 'write', buffer, 0, byteCount)
						totalRead += byteCount
					}
					plus.android.invoke(inputStream, 'close')
					console.log('Total bytes read:', totalRead)
					
					const byteArray = plus.android.invoke(baos, 'toByteArray')
					const length = plus.android.invoke(byteArray, 'length')
					console.log('Byte array length:', length)
					
					if (length > 0) {
						const Base64 = plus.android.importClass('android.util.Base64')
						const base64Str = plus.android.invoke(Base64, 'encodeToString', byteArray, Base64.DEFAULT)
						console.log('Base64 length:', base64Str ? base64Str.length : 0)
						
						if (base64Str && base64Str.length > 100) {
							this.handleBase64Import(base64Str, fileName)
						} else {
							this.showToastMsg('文件数据转换失败')
						}
					} else {
						console.error('Empty byte array')
						this.showToastMsg('文件内容为空')
					}
				} catch (err) {
					console.error('ContentResolver method failed:', err)
					this.showToastMsg('文件读取失败: ' + err.message)
				}
			},
			
			convertAndSave(byteArray, length, fileName) {
				console.log('convertAndSave:', length, fileName)
				
				const Base64 = plus.android.importClass('android.util.Base64')
				const DEFAULT = 0
				
				try {
					const base64Str = plus.android.invoke(Base64, 'encodeToString', byteArray, DEFAULT)
					console.log('Android Base64 result:', base64Str ? base64Str.length : 0)
					
					if (base64Str && base64Str.length > 100) {
						this.handleBase64Import(base64Str, fileName)
						return
					}
				} catch (e) {
					console.warn('Android Base64 failed:', e)
				}
				
				try {
					let binary = ''
					const uint8Array = new Uint8Array(length)
					for (let i = 0; i < length; i++) {
						const byteVal = plus.android.invoke(byteArray, 'get', i)
						uint8Array[i] = byteVal & 0xFF
					}
					const blob = new Blob([uint8Array], { type: 'application/pdf' })
					const reader = new FileReader()
					reader.onload = (e) => {
						const dataUrl = e.target.result
						const base64Str = dataUrl.split(',')[1]
						console.log('Blob to Base64 result:', base64Str ? base64Str.length : 0)
						if (base64Str && base64Str.length > 100) {
							this.handleBase64Import(base64Str, fileName)
						} else {
							console.error('Blob conversion failed')
							this.showToastMsg('文件数据转换失败')
						}
					}
					reader.readAsDataURL(blob)
				} catch (e2) {
					console.error('Blob conversion failed:', e2)
					this.showToastMsg('文件数据转换失败')
				}
			},
			
			async handlePathImport(filePath, originalName) {
				this.showToastMsg('正在保存乐谱...')
				
				try {
					const isDuplicate = ScoreStorage.checkDuplicateName(originalName)
					
					let finalName = originalName
					
					if (isDuplicate) {
						await new Promise((resolve) => {
							uni.showActionSheet({
								itemList: ['自动添加(1)', '自定义名称'],
								success: async (res) => {
									if (res.tapIndex === 0) {
										finalName = ScoreStorage.generateUniqueName(originalName)
									} else {
										await new Promise((innerResolve) => {
											uni.showModal({
												title: '自定义名称',
												editable: true,
												placeholderText: '请输入乐谱名称',
												success: (modalRes) => {
													if (modalRes.confirm && modalRes.content) {
														let customName = modalRes.content.trim()
														if (!customName.endsWith('.pdf')) {
															customName += '.pdf'
														}
														finalName = ScoreStorage.generateUniqueName(customName)
													} else {
														finalName = ScoreStorage.generateUniqueName(originalName)
													}
													innerResolve()
												}
											})
										})
									}
									resolve()
								},
								fail: () => {
									finalName = ScoreStorage.generateUniqueName(originalName)
									resolve()
								}
							})
						})
					}
					
					const newScore = {
						id: ScoreStorage.generateId(),
						name: finalName,
						localPath: filePath,
						isBase64: false,
						importDate: Date.now()
					}
					
					ScoreStorage.addScore(newScore)
					this.loadScores()
					
					this.showToastMsg('乐谱导入成功')
					
				} catch (err) {
					console.error('File import failed:', err)
					this.showToastMsg('保存失败，请重试')
				}
			},
			
			async handleFileImport(tempFilePath, originalName) {
				this.showToastMsg('正在保存乐谱...')
				
				try {
					const isDuplicate = ScoreStorage.checkDuplicateName(originalName)
					
					let finalName = originalName
					
					if (isDuplicate) {
						await new Promise((resolve) => {
							uni.showActionSheet({
								itemList: ['自动添加(1)', '自定义名称'],
								success: async (res) => {
									if (res.tapIndex === 0) {
										finalName = ScoreStorage.generateUniqueName(originalName)
									} else {
										await new Promise((innerResolve) => {
											uni.showModal({
												title: '自定义名称',
												editable: true,
												placeholderText: '请输入乐谱名称',
												success: (modalRes) => {
													if (modalRes.confirm && modalRes.content) {
														let customName = modalRes.content.trim()
														if (!customName.endsWith('.pdf')) {
															customName += '.pdf'
														}
														finalName = ScoreStorage.generateUniqueName(customName)
													} else {
														finalName = ScoreStorage.generateUniqueName(originalName)
													}
													innerResolve()
												}
											})
										})
									}
									resolve()
								},
								fail: () => {
									finalName = ScoreStorage.generateUniqueName(originalName)
									resolve()
								}
							})
						})
					}
					
					const saveResult = await saveFileToLocal(tempFilePath, finalName)
					
					const newScore = {
						id: ScoreStorage.generateId(),
						name: finalName,
						localPath: saveResult.savedFilePath,
						isBase64: saveResult.isBase64 || false,
						importDate: Date.now()
					}
					
					ScoreStorage.addScore(newScore)
					this.loadScores()
					
					this.showToastMsg('乐谱导入成功')
					
				} catch (err) {
					console.error('File import failed:', err)
					this.showToastMsg('保存失败，请重试')
				}
			},
			
			handleBase64Import(base64, originalName) {
				console.log('handleBase64Import called:', originalName, base64 ? base64.length : 0)
				this.showToastMsg('正在保存乐谱...')
				
				try {
					if (!base64 || base64.length < 100) {
						console.error('Invalid base64 data')
						this.showToastMsg('文件数据无效')
						return
					}
					
					const extIndex = originalName.lastIndexOf('.')
					const baseName = extIndex > 0 ? originalName.substring(0, extIndex) : originalName
					const ext = extIndex > 0 ? originalName.substring(extIndex) : '.pdf'
					
					let finalName = originalName
					const existingScores = ScoreStorage.getScores()
					console.log('Existing scores count before add:', existingScores.length)
					
					const nameExists = existingScores.some(s => s.name === originalName)
					console.log('Name exists:', nameExists)
					
					if (nameExists) {
						let count = 1
						while (existingScores.some(s => s.name === `${baseName}(${count})${ext}`)) {
							count++
						}
						finalName = `${baseName}(${count})${ext}`
					}
					
					const that = this
					
					plus.io.requestFileSystem(plus.io.PRIVATE_DOC, function(fs) {
						fs.root.getFile(finalName, { create: true }, function(fileEntry) {
							fileEntry.createWriter(function(writer) {
								writer.onwrite = function() {
									console.log('File written successfully')
									const fileUrl = fileEntry.toURL()
									console.log('File URL:', fileUrl)
									
									const newScore = {
										id: ScoreStorage.generateId(),
										name: finalName,
										localPath: fileUrl,
										isBase64: false,
										importDate: Date.now()
									}
									
									console.log('Adding new score:', finalName)
									ScoreStorage.addScore(newScore)
									
									const scoresAfterAdd = ScoreStorage.getScores()
									console.log('Scores after add:', scoresAfterAdd.length)
									
									that.$nextTick(() => {
										that.scoreList = [...scoresAfterAdd]
										console.log('Score list updated:', that.scoreList.length)
										setTimeout(() => {
											that.currentTab = 'library'
											that.showToastMsg('乐谱导入成功')
										}, 100)
									})
								}
								writer.onerror = function(e) {
									console.error('Write error:', e)
									that.showToastMsg('文件写入失败')
								}
								
								const base64Data = base64.startsWith('data:') ? base64.split(',')[1] : base64
												writer.seek(0)
												writer.writeAsBinary(that.base64ToArrayBuffer(base64Data))
							}, function(e) {
								console.error('Create writer failed:', e)
								that.showToastMsg('文件创建失败')
							})
						}, function(e) {
							console.error('Get file failed:', e)
							that.showToastMsg('文件创建失败')
						})
					}, function(e) {
						console.error('Request file system failed:', e)
						that.showToastMsg('文件系统不可用')
					})
				} catch (err) {
					console.error('File import failed:', err)
					this.showToastMsg('保存失败: ' + err.message)
				}
			},
			
			base64ToArrayBuffer(base64) {
				const binaryStr = atob(base64)
				const bytes = new ArrayBuffer(binaryStr.length)
				const uint8Arr = new Uint8Array(bytes)
				for (let i = 0; i < binaryStr.length; i++) {
					uint8Arr[i] = binaryStr.charCodeAt(i)
				}
				return bytes
			},
			
			async handleH5FileImport(file) {
				this.showToastMsg('正在保存乐谱...')
				
				try {
					const originalName = file.name
					const extIndex = originalName.lastIndexOf('.')
					const baseName = extIndex > 0 ? originalName.substring(0, extIndex) : originalName
					const ext = extIndex > 0 ? originalName.substring(extIndex) : '.pdf'
					
					let finalName = originalName
					const existingScores = ScoreStorage.getScores()
					const nameExists = existingScores.some(s => s.name === originalName)
					
					if (nameExists) {
						let count = 1
						while (existingScores.some(s => s.name === `${baseName}(${count})${ext}`)) {
							count++
						}
						finalName = `${baseName}(${count})${ext}`
					}
					
					const arrayBuffer = await file.arrayBuffer()
					const base64 = this.arrayBufferToBase64(arrayBuffer)
					
					const newScore = {
						id: ScoreStorage.generateId(),
						name: finalName,
						localPath: base64,
						isBase64: true,
						importDate: Date.now()
					}
					
					ScoreStorage.addScore(newScore)
					this.loadScores()
					
					this.showToastMsg('乐谱导入成功')
					
				} catch (err) {
					console.error('File import failed:', err)
					this.showToastMsg('保存失败，请重试')
				}
			},
			
			arrayBufferToBase64(buffer) {
				let binary = ''
				const bytes = new Uint8Array(buffer)
				const len = bytes.byteLength
				for (let i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				return btoa(binary)
			},
			
			openScore(score) {
				//#ifdef MP-WEIXIN
				this.showToastMsg('微信小程序不支持PDF阅读，请使用APP端')
				return
				//#endif
				
				this.currentScoreName = score.name
				this.pdfFilePath = score.localPath
				this.totalPages = 10
				this.currentPage = 0
				
				this.showToastMsg('正在打开乐谱...')
				
				if (score.isBase64) {
					const base64Data = `data:application/pdf;base64,${score.localPath}`
					this.pdfViewerUrl = `/pages/pdf-viewer/pdf-viewer.html#pdf=${encodeURIComponent(base64Data)}`
					this.pdfLoaded = true
				} else if (uni.getFileSystemManager) {
					const fs = uni.getFileSystemManager()
					fs.readFile({
						filePath: score.localPath,
						encoding: 'base64',
						success: (res) => {
							const base64Data = `data:application/pdf;base64,${res.data}`
							this.pdfViewerUrl = `/pages/pdf-viewer/pdf-viewer.html#pdf=${encodeURIComponent(base64Data)}`
							this.pdfLoaded = true
						},
						fail: (err) => {
							console.error('Failed to read PDF file, fallback to fetch:', err)
							this.readPDFByFetch(score.localPath)
						}
					})
				} else {
					this.readPDFByFetch(score.localPath)
				}
			},
			
			readPDFByFetch(filePath) {
				fetch(filePath)
					.then(response => response.arrayBuffer())
					.then(buffer => {
						const base64Data = `data:application/pdf;base64,${this.arrayBufferToBase64(buffer)}`
						this.pdfViewerUrl = `/pages/pdf-viewer/pdf-viewer.html#pdf=${encodeURIComponent(base64Data)}`
						this.pdfLoaded = true
					})
					.catch(err => {
						console.error('Failed to fetch PDF file:', err)
						this.showToastMsg('打开乐谱失败')
					})
			},
			
			arrayBufferToBase64(buffer) {
				let binary = ''
				const bytes = new Uint8Array(buffer)
				const len = bytes.byteLength
				for (let i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i])
				}
				return btoa(binary)
			},
			
			closePDF() {
				this.pdfLoaded = false
				this.pdfFilePath = ''
				this.currentScoreName = ''
				this.currentTab = 'library'
			},
			
			showScoreMenu(score) {
				uni.showActionSheet({
					itemList: ['删除'],
					success: (res) => {
						if (res.tapIndex === 0) {
							this.deleteScore(score)
						}
					}
				})
			},
			
			deleteScore(score) {
				uni.showModal({
					title: '确认删除',
					content: `确定要删除 "${score.name}" 吗？`,
					success: (res) => {
						if (res.confirm) {
							ScoreStorage.removeScore(score.id)
							this.loadScores()
							this.showToastMsg('已删除')
						}
					}
				})
			},
			
			formatDate(timestamp) {
				const date = new Date(timestamp)
				const month = date.getMonth() + 1
				const day = date.getDate()
				return `${month}月${day}日`
			},
			
			handleWebviewMessage(e) {
				const data = e.detail.data
				if (data && data.length > 0) {
					const lastData = data[data.length - 1]
					if (lastData.currentPage !== undefined) {
						this.currentPage = lastData.currentPage
					}
					if (lastData.totalPages !== undefined) {
						this.totalPages = lastData.totalPages
					}
				}
			},
			
			togglePlay() {
				if (this.isPlaying) {
					this.stopMetronome()
				} else {
					this.startMetronome()
				}
			},
			
			startMetronome() {
				this.startPlayback()
			},
			
			startPlayback() {
				this.isPlaying = true
				this.currentBeat = 1
				this.displayBeat = 0
				this.playNextBeat()
			},
			
			stopMetronome() {
				this.isPlaying = false
				if (this.timerID) {
					clearTimeout(this.timerID)
					this.timerID = null
				}
				this.currentBeat = 1
				this.displayBeat = 0
			},
			
			scheduler() {
				if (!this.isPlaying || !this.audioContext) return
				
				while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
					this.scheduleNote(this.currentBeat, this.nextNoteTime)
					this.nextNote()
				}
				
				this.timerID = setTimeout(() => {
					if (this.isPlaying) {
						this.scheduler()
					}
				}, this.lookahead)
			},
			
			nextNote() {
				const secondsPerBeat = 60.0 / this.bpm
				this.nextNoteTime += secondsPerBeat
				
				this.currentBeat++
				if (this.currentBeat > this.beatsPerMeasure) {
					this.currentBeat = 1
				}
				
				this.currentBeats = Array.from({ length: this.beatsPerMeasure }, (_, i) => i + 1)
			},
			
			scheduleNote(beatNumber, time) {
				if (!this.audioContext) return
				
				const osc = this.audioContext.createOscillator()
				const gainNode = this.audioContext.createGain()
				
				osc.connect(gainNode)
				gainNode.connect(this.audioContext.destination)
				
				let frequency = beatNumber === 1 ? 1000 : 800
				
				switch (this.toneType) {
					case 'click':
						frequency = beatNumber === 1 ? 1000 : 800
						break
					case 'wood':
						frequency = beatNumber === 1 ? 800 : 600
						break
					case 'bell':
						frequency = beatNumber === 1 ? 1500 : 1000
						break
					case 'digital':
						frequency = beatNumber === 1 ? 1200 : 800
						break
				}
				
				osc.frequency.value = frequency
				gainNode.gain.value = beatNumber === 1 ? this.volume : this.volume * 0.7
				
				osc.start(time)
				gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
				osc.stop(time + 0.1)
			},
			
			playNextBeat() {
				if (!this.isPlaying) return
				
				const beatNumber = this.currentBeat
				const isStrong = beatNumber === 1
				
				this.displayBeat = beatNumber
				this.audioData = { beat: beatNumber, isStrong: isStrong, bpm: this.bpm, toneType: this.toneType }
				
				this.currentBeat++
				if (this.currentBeat > this.beatsPerMeasure) {
					this.currentBeat = 1
				}
				this.currentBeats = Array.from({ length: this.beatsPerMeasure }, (_, i) => i + 1)
				
				const secondsPerBeat = 60.0 / this.bpm
				this.timerID = setTimeout(() => {
					if (this.isPlaying) {
						this.playNextBeat()
					}
				}, secondsPerBeat * 1000)
			},
			
			playBeatWithAudioCtx(isStrong) {
				try {
					const ctx = this.audioCtx
					if (ctx.state === 'suspended') {
						ctx.resume()
					}
					
					const osc = ctx.createOscillator()
					const gainNode = ctx.createGain()
					
					osc.connect(gainNode)
					gainNode.connect(ctx.destination)
					
					let frequency = isStrong ? 1000 : 800
					switch (this.toneType) {
						case 'click':
							frequency = isStrong ? 1000 : 800
							break
						case 'wood':
							frequency = isStrong ? 800 : 600
							break
						case 'bell':
							frequency = isStrong ? 1500 : 1000
							break
						case 'digital':
							frequency = isStrong ? 1200 : 800
							break
					}
					
					osc.frequency.value = frequency
					gainNode.gain.setValueAtTime(isStrong ? 1.0 : 0.7, ctx.currentTime)
					gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
					
					osc.start(ctx.currentTime)
					osc.stop(ctx.currentTime + 0.15)
				} catch (e) {
					console.error('Web Audio playback failed:', e)
				}
			},
			
			playBeatWithInnerAudio(isStrong) {
				try {
					const audio = this.innerAudio
					audio.volume = isStrong ? this.volume : this.volume * 0.7
					
					const wavData = this.generateBeatWav(isStrong)
					audio.src = `data:audio/wav;base64,${wavData}`
					audio.play()
				} catch (e) {
					console.error('InnerAudio playback failed:', e)
				}
			},
			
			generateBeatWav(isStrong) {
				const sampleRate = 44100
				const duration = 0.15
				const numSamples = Math.floor(sampleRate * duration)
				const buffer = new ArrayBuffer(44 + numSamples * 2)
				const view = new DataView(buffer)
				
				view.setUint8(0, 0x52)
				view.setUint8(1, 0x49)
				view.setUint8(2, 0x46)
				view.setUint8(3, 0x46)
				
				const fileSize = 36 + numSamples * 2
				view.setUint32(4, fileSize, true)
				
				view.setUint8(8, 0x57)
				view.setUint8(9, 0x41)
				view.setUint8(10, 0x56)
				view.setUint8(11, 0x45)
				view.setUint8(12, 0x66)
				view.setUint8(13, 0x6D)
				view.setUint8(14, 0x74)
				view.setUint8(15, 0x20)
				
				view.setUint32(16, 16, true)
				view.setUint16(20, 1, true)
				view.setUint16(22, 1, true)
				view.setUint32(24, sampleRate, true)
				view.setUint32(28, sampleRate * 2, true)
				view.setUint16(32, 2, true)
				view.setUint16(34, 16, true)
				
				view.setUint8(36, 0x64)
				view.setUint8(37, 0x61)
				view.setUint8(38, 0x74)
				view.setUint8(39, 0x61)
				view.setUint32(40, numSamples * 2, true)
				
				let frequency = isStrong ? 1000 : 800
				switch (this.toneType) {
					case 'click':
						frequency = isStrong ? 1000 : 800
						break
					case 'wood':
						frequency = isStrong ? 800 : 600
						break
					case 'bell':
						frequency = isStrong ? 1500 : 1000
						break
					case 'digital':
						frequency = isStrong ? 1200 : 800
						break
				}
				
				const volume = isStrong ? this.volume : this.volume * 0.7
				
				for (let i = 0; i < numSamples; i++) {
					const t = i / sampleRate
					const envelope = Math.exp(-t * 8)
					const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * volume
					view.setInt16(44 + i * 2, sample * 32767, true)
				}
				
				const bytes = new Uint8Array(buffer)
				let str = ''
				for (let i = 0; i < bytes.length; i++) {
					str += String.fromCharCode(bytes[i])
				}
				return btoa(str)
			},
			
			adjustBpm(delta) {
				const newBpm = this.bpm + delta
				if (newBpm >= 40 && newBpm <= 240) {
					this.bpm = newBpm
				}
			},
			
			onBpmChange(val) {
				this.bpm = val
			},
			
			setTimeSignature(sig) {
				this.timeSignature = sig
				this.currentBeat = 1
				this.currentBeats = Array.from({ length: this.beatsPerMeasure }, (_, i) => i + 1)
			},
			
			setTone(tone) {
				this.toneType = tone
			},
			
			showToastMsg(msg) {
				this.toastMessage = msg
				this.showToast = true
				setTimeout(() => {
					this.showToast = false
				}, 2000)
			},
			
			closeTutorial() {
				this.showMetronomeTutorial = false
				uni.setStorageSync('hasSeenMetronomeTutorial', true)
			},
			
			onMetronomeToggle(expanded) {
				this.isMetronomeExpanded = expanded
			}
		}
	}
</script>

<!-- #ifdef APP-PLUS || H5 -->
<script module="audio" lang="renderjs">
	let audioCtx = null
	
	export default {
		methods: {
			onAudioDataChange(newVal, oldVal, ownerVm) {
				if (!newVal || newVal.beat === 0) return
				
				if (!audioCtx) {
					const AudioContext = window.AudioContext || window.webkitAudioContext
					if (AudioContext) {
						audioCtx = new AudioContext()
					}
				}
				
				if (audioCtx) {
					this.playBeat(audioCtx, newVal.isStrong, newVal.toneType)
				}
			},
			
			onFileTrigger(newVal, oldVal, ownerVm) {
				if (newVal && newVal > oldVal) {
					const input = document.createElement('input')
					input.type = 'file'
					input.accept = 'application/pdf,.pdf'
					input.removeAttribute('capture')
					input.style.cssText = 'position:fixed;top:-100px;left:-100px;opacity:0;width:1px;height:1px;'
					document.body.appendChild(input)
					
					input.onchange = async (e) => {
						document.body.removeChild(input)
						const file = e.target.files[0]
						if (file) {
							const arrayBuffer = await file.arrayBuffer()
							const base64 = arrayBufferToBase64(arrayBuffer)
							ownerVm.callMethod('onFileSelected', { base64, name: file.name, isBase64: true })
						}
					}
					
					input.click()
				}
			},
			
			playBeat(ctx, isStrong, toneType) {
				if (ctx.state === 'suspended') {
					ctx.resume()
				}
				
				const osc = ctx.createOscillator()
				const gainNode = ctx.createGain()
				
				osc.connect(gainNode)
				gainNode.connect(ctx.destination)
				
				let frequency = isStrong ? 1000 : 800
				switch (toneType) {
					case 'click':
						frequency = isStrong ? 1000 : 800
						break
					case 'wood':
						frequency = isStrong ? 800 : 600
						break
					case 'bell':
						frequency = isStrong ? 1500 : 1000
						break
					case 'digital':
						frequency = isStrong ? 1200 : 800
						break
				}
				
				osc.frequency.value = frequency
				gainNode.gain.setValueAtTime(isStrong ? 1.0 : 0.7, ctx.currentTime)
				gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
				
				osc.start(ctx.currentTime)
				osc.stop(ctx.currentTime + 0.15)
			},
			
			onPdfDataChange(newVal, oldVal, ownerVm) {
				if (!newVal || newVal === oldVal) return
				this.loadPDF(newVal, ownerVm)
			},
			
			async loadPDF(base64, ownerVm) {
				try {
					pdfOwnerVm = ownerVm
					
					const container = document.getElementById('pdfCanvasContainer')
					if (container && !container.querySelector('canvas')) {
						const c = document.createElement('canvas')
						c.id = 'pdfRenderCanvas'
						c.style.cssText = 'width:100%;height:100%;touch-action:none;'
						container.appendChild(c)
					}
					
					if (!window.pdfjsLib) {
						await this.loadPdfJs()
					}
					
					const parts = base64.split(',')
					const rawBase64 = parts.length > 1 ? parts[1] : base64
					const binaryStr = window.atob(rawBase64)
					const bytes = new Uint8Array(binaryStr.length)
					for (let i = 0; i < binaryStr.length; i++) {
						bytes[i] = binaryStr.charCodeAt(i)
					}
					
					this.pdfDoc = await window.pdfjsLib.getDocument({ data: bytes, disableWorker: true }).promise
					this.totalPdfPages = this.pdfDoc.numPages
					this.currentPdfPage = 1
					
					this.setupTouch()
					ownerVm.callMethod('onPDFLoaded', { totalPages: this.totalPdfPages })
					this.renderPage(1, ownerVm)
				} catch (err) {
					console.error('PDF load failed:', err)
				}
			},
			
			setupTouch() {
				const canvas = document.getElementById('pdfRenderCanvas')
				if (!canvas || canvas._touchSetup) return
				canvas._touchSetup = true
				
				const self = this
				canvas.addEventListener('touchstart', function(e) {
					touchStartX = e.touches[0].clientX
				}, { passive: true })
				
				canvas.addEventListener('touchend', function(e) {
					const endX = e.changedTouches[0].clientX
					const diff = touchStartX - endX
					if (Math.abs(diff) > 50) {
						if (diff > 0) {
							self.nextPage_Swipe()
						} else {
							self.prevPage_Swipe()
						}
					}
				}, { passive: true })
			},
			
			nextPage_Swipe() {
				if (this.currentPdfPage < this.totalPdfPages) {
					this.currentPdfPage++
					if (pdfOwnerVm) {
						this.renderPage(this.currentPdfPage, pdfOwnerVm)
						pdfOwnerVm.callMethod('onPageChanged', { page: this.currentPdfPage, direction: 'left' })
					}
				}
			},
			
			prevPage_Swipe() {
				if (this.currentPdfPage > 1) {
					this.currentPdfPage--
					if (pdfOwnerVm) {
						this.renderPage(this.currentPdfPage, pdfOwnerVm)
						pdfOwnerVm.callMethod('onPageChanged', { page: this.currentPdfPage, direction: 'right' })
					}
				}
			},
			
			loadPdfJs() {
				return new Promise((resolve, reject) => {
					const script = document.createElement('script')
					script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
					script.onload = () => {
						window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
						resolve()
					}
					script.onerror = () => reject(new Error('pdf.js load failed'))
					document.head.appendChild(script)
				})
			},
			
			async renderPage(pageNum, ownerVm) {
				const canvas = document.getElementById('pdfRenderCanvas')
				if (!canvas || !this.pdfDoc) return
				
				const page = await this.pdfDoc.getPage(pageNum)
				const dpr = window.devicePixelRatio || 1
				const rect = canvas.parentElement.getBoundingClientRect()
				const viewport = page.getViewport({ scale: 1 })
				const scale = Math.min(rect.width / viewport.width, rect.height / viewport.height)
				const scaledViewport = page.getViewport({ scale: scale * dpr })
				
				canvas.width = scaledViewport.width
				canvas.height = scaledViewport.height
				canvas.style.width = (scaledViewport.width / dpr) + 'px'
				canvas.style.height = (scaledViewport.height / dpr) + 'px'
				
				const ctx = canvas.getContext('2d')
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
				
				await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: scale }) }).promise
				ownerVm.callMethod('onPageChanged', { page: pageNum })
			},
			
			nextPage(ownerVm) {
				if (this.currentPdfPage < this.totalPdfPages) {
					this.currentPdfPage++
					this.renderPage(this.currentPdfPage, ownerVm)
				}
			},
			
			prevPage(ownerVm) {
				if (this.currentPdfPage > 1) {
					this.currentPdfPage--
					this.renderPage(this.currentPdfPage, ownerVm)
				}
			}
		}
	}
	
	let pdfDoc = null
let currentPdfPage = 1
let totalPdfPages = 0
let touchStartX = 0
let pdfOwnerVm = null

function arrayBufferToBase64(buffer) {
		let binary = ''
		const bytes = new Uint8Array(buffer)
		const len = bytes.byteLength
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i])
		}
		return window.btoa(binary)
	}
</script>
<!-- #endif -->

<style lang="scss">
	.hidden {
		display: none;
	}
	
	.container {
		min-height: 100vh;
		background: #fff;
		display: flex;
		flex-direction: column;
		padding-bottom: 120rpx;
		transition: all 0.4s ease;
		--theme-primary: #3B82F6;
		--theme-secondary: #60A5FA;
		--theme-accent: #93C5FD;
		--theme-bg: #F0F9FF;
		
		&.sheet-expanded {
			padding-bottom: 400rpx;
		}
		
		&.tablet-mode {
			.main-content {
				flex-direction: row;
			}
			
			.reader-container {
				flex: 2;
			}
		}
		
		&.reading-mode {
			background: #fff;
			padding-bottom: 0;
			
			.main-content {
				padding: 0;
				flex: 1;
			}
		}
	}
	
	.header {
		padding: 60px 32rpx 24rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(20px);
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
	}
	
	.header-left {
		display: flex;
		flex-direction: column;
	}
	
	.title {
		font-size: 40rpx;
		font-weight: 800;
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.subtitle {
		font-size: 24rpx;
		color: #999;
		margin-top: 4rpx;
	}
	
	.import-btn {
		width: 72rpx;
		height: 72rpx;
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.35);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.95);
			box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
		}
	}
	
	.import-icon {
		font-size: 40rpx;
		font-weight: 300;
	}
	
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 24rpx;
		overflow: hidden;
	}
	
	.reader-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 100vh;
	}
	
	.pdf-canvas-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: linear-gradient(135deg, #525659 0%, #3a3d40 100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
		
		&.page-turning {
			&.turn-left {
				transform: translateX(-40rpx) scaleX(0.95);
				opacity: 0.4;
			}
			&.turn-right {
				transform: translateX(40rpx) scaleX(0.95);
				opacity: 0.4;
			}
		}
	}
	
	.pdf-canvas-wrapper canvas {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		transition: opacity 0.3s ease;
		box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.6), 
		            3rpx 0 12rpx rgba(0, 0, 0, 0.3);
		border-radius: 4rpx;
	}
	
	.pdf-loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 50;
		backdrop-filter: blur(4px);
	}
	
	.loading-spinner {
		width: 80rpx;
		height: 80rpx;
		border: 6rpx solid rgba(255, 255, 255, 0.2);
		border-top-color: var(--theme-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	
	.loading-text {
		margin-top: 32rpx;
		font-size: 28rpx;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: 2rpx;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.reader-back-btn {
		position: absolute;
		top: 60rpx;
		left: 24rpx;
		width: 80rpx;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
		transition: all 0.2s ease;
		z-index: 100;
		
		&:active {
			transform: scale(0.95);
		}
		
		text {
			font-size: 40rpx;
			color: #333;
			font-weight: 300;
		}
	}
	
	.reader-title {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		max-width: 400rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.placeholder {
		width: 64rpx;
	}
	
	.pdf-webview {
		width: 100%;
		height: 100vh;
		min-height: 100%;
		flex: 1;
		background: #fff;
	}
	
	.page-indicator {
		position: absolute;
		bottom: 60rpx;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		background: rgba(0, 0, 0, 0.5);
		padding: 20rpx 40rpx;
		border-radius: 40rpx;
	}
	
	.page-text {
		font-size: 28rpx;
		color: #fff;
		margin-bottom: 8rpx;
		font-weight: 500;
	}
	
	.progress-bar {
		width: 300rpx;
		height: 6rpx;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 3rpx;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--theme-primary), var(--theme-secondary));
		border-radius: 4rpx;
		transition: width 0.3s ease;
	}
	
	.library-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0;
	}
	
	.empty-library {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 60rpx 40rpx;
	}
	
	.decoration-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(96, 165, 250, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
		pointer-events: none;
	}
	
	.empty-card {
		position: relative;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		border-radius: 40rpx;
		padding: 64rpx 48rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 24rpx 80rpx rgba(59, 130, 246, 0.15);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
	}
	
	.empty-icon-wrapper {
		width: 160rpx;
		height: 160rpx;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1));
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 32rpx;
	}
	
	.empty-icon {
		font-size: 80rpx;
	}
	
	.empty-title {
		font-size: 56rpx;
		font-weight: 900;
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 8rpx;
	}
	
	.empty-subtitle {
		font-size: 28rpx;
		color: #999;
		margin-bottom: 32rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: #666;
		text-align: center;
		margin-bottom: 48rpx;
		line-height: 1.8;
	}
	
	.empty-btn {
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		color: #fff;
		padding: 28rpx 80rpx;
		border-radius: 50rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 12rpx 32rpx rgba(59, 130, 246, 0.4);
		transition: all 0.3s ease;
		
		&:active {
			transform: scale(0.95);
			box-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.3);
		}
	}
	
	.empty-btn-text {
		font-size: 30rpx;
		font-weight: 600;
		margin-right: 12rpx;
	}
	
	.empty-btn-icon {
		font-size: 32rpx;
		font-weight: 300;
	}
	
	.score-grid {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding: 24rpx;
	}
	
	.score-card {
		background: rgba(255, 255, 255, 0.9);
		border-radius: 20rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		transition: all 0.25s ease;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		}
	}
	
	.score-icon {
		width: 80rpx;
		height: 80rpx;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.1));
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 24rpx;
		
		text {
			font-size: 40rpx;
		}
	}
	
	.score-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}
	
	.score-name {
		font-size: 30rpx;
		font-weight: 600;
		color: #333;
	}
	
	.score-date {
		font-size: 24rpx;
		color: #999;
	}
	
	.score-arrow {
		text {
			font-size: 36rpx;
			color: #ccc;
			font-weight: 300;
		}
	}
	
	.settings-view {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 24rpx;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32rpx;
	}
	
	.section-title {
		font-size: 36rpx;
		font-weight: 700;
		color: #1a1a2e;
	}
	
	.settings-list {
		flex: 1;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 24rpx;
		overflow: hidden;
	}
	
	.setting-item {
		display: flex;
		align-items: center;
		padding: 32rpx 24rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
		
		&:last-child {
			border-bottom: none;
		}
	}
	
	.setting-icon {
		font-size: 36rpx;
		margin-right: 20rpx;
	}
	
	.setting-label {
		flex: 1;
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
	}
	
	.setting-arrow {
		font-size: 36rpx;
		color: #ccc;
		font-weight: 300;
	}
	
	.setting-version {
		font-size: 26rpx;
		color: #999;
	}
	
	.theme-selector {
		display: flex;
		gap: 24rpx;
		margin-bottom: 48rpx;
	}
	
	.theme-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24rpx;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 20rpx;
		border: 3rpx solid transparent;
		transition: all 0.3s ease;
		
		&.active {
			border-color: var(--theme-primary, #3B82F6);
			background: rgba(255, 255, 255, 0.95);
			box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.2);
		}
	}
	
	.theme-color-preview {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		margin-bottom: 16rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}
	
	.theme-name {
		font-size: 26rpx;
		color: #333;
		font-weight: 500;
	}
	
	.theme-check {
		margin-top: 12rpx;
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		background: var(--theme-primary, #3B82F6);
		color: #fff;
		font-size: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.toggle-switch {
		width: 88rpx;
		height: 48rpx;
		background: #e8ecf0;
		border-radius: 24rpx;
		position: relative;
		transition: background 0.3s ease;
		
		&.on {
			background: var(--theme-primary, #3B82F6);
		}
	}
	
	.toggle-knob {
		width: 40rpx;
		height: 40rpx;
		background: #fff;
		border-radius: 50%;
		position: absolute;
		top: 4rpx;
		left: 4rpx;
		transition: left 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
		
		.toggle-switch.on & {
			left: 44rpx;
		}
	}
	
	.toast {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.85);
		color: #fff;
		padding: 28rpx 56rpx;
		border-radius: 16rpx;
		font-size: 28rpx;
		z-index: 1000;
		animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	
	.tutorial-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 400;
		animation: fadeIn 0.3s ease;
		padding-bottom: 160rpx;
	}
	
	.tutorial-content {
		position: relative;
		background: #fff;
		padding: 28rpx 40rpx;
		border-radius: 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.tutorial-arrow {
		position: absolute;
		bottom: -20rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 20rpx solid transparent;
		border-right: 20rpx solid transparent;
		border-top: 20rpx solid #fff;
	}
	
	.tutorial-text {
		font-size: 28rpx;
		color: #333;
		text-align: center;
		line-height: 1.6;
		font-weight: 500;
	}
</style>
