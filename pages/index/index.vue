<template>
	<view class="container" :class="{ 
		'tablet-mode': isTablet, 
		'sheet-expanded': isSheetExpanded,
		'reading-mode': pdfLoaded
	}" :style="themeStyle">
	<!-- #ifndef MP-WEIXIN -->
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
				<view class="pdf-canvas-wrapper" id="pdfCanvasContainer">
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
					<text class="section-title">外观</text>
				</view>
				<view class="settings-list">
					<view class="setting-item" @click="toggleDarkMode">
						<text class="setting-icon">{{ isDarkMode ? '🌙' : '☀️' }}</text>
						<text class="setting-label">{{ isDarkMode ? '深色模式' : '亮色模式' }}</text>
						<view class="toggle-switch" :class="{ 'on': isDarkMode }">
							<view class="toggle-knob"></view>
						</view>
					</view>
					<view class="setting-item" @click="chooseBackground">
						<text class="setting-icon">🖼️</text>
						<text class="setting-label">自定义背景图</text>
						<text class="setting-value">{{ customBackground ? '已设置' : '未设置' }}</text>
					</view>
					<view class="setting-item" v-if="customBackground" @click="clearBackground">
						<text class="setting-icon">❌</text>
						<text class="setting-label">清除背景图</text>
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
			:isDarkMode="isDarkMode"
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
	import { ScoreStorage } from '@/utils/score-storage.js'

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
				isDarkMode: false,
				customBackground: '',
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
				const bgColor = this.isDarkMode ? '#1a1a2e' : theme.bg
				const bgImage = this.customBackground ? `url(${this.customBackground})` : 'none'
				return {
					'--theme-primary': theme.primary,
					'--theme-secondary': theme.secondary,
					'--theme-accent': theme.accent,
					'--theme-bg': bgColor,
					'--theme-text': this.isDarkMode ? '#e8e8ec' : '#1a1a1a',
					'--theme-card': this.isDarkMode ? 'rgba(40, 40, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
					'--theme-border': this.isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					'--theme-bg-image': bgImage,
					'--theme-bg-image-size': 'cover',
					'--theme-bg-image-position': 'center center'
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
			
			const savedDark = uni.getStorageSync('flipinbeat_dark')
			if (savedDark !== undefined && savedDark !== '') {
				this.isDarkMode = savedDark === 'true' || savedDark === true
			}
			
			const savedBg = uni.getStorageSync('flipinbeat_bg')
			if (savedBg) {
				this.customBackground = savedBg
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
			// 先显示本地缓存
			this.scoreList = ScoreStorage.getScores()
			// 从服务器同步最新列表
			ScoreStorage.fetchServerList()
				.then((scores) => {
					this.scoreList = scores
					console.log('Synced scores from server:', scores.length)
				})
				.catch((err) => {
					console.warn('Sync from server failed, using local:', err.message)
				})
			if (this.scoreList.length > 0) {
				this.currentTab = 'library'
			}
		},
		
		onUnload() {
				this.stopMetronome()
				if (this._webAudioCtx) {
					try { this._webAudioCtx.close() } catch(e) {}
					this._webAudioCtx = null
				}
				if (this.audioCtx) {
					try { this.audioCtx.close() } catch(e) {}
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
				if (this._audioPool) {
					for (var i = 0; i < this._audioPool.length; i++) {
						this._audioPool[i].destroy()
					}
					this._audioPool = null
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
				// 预加载节拍器音频（微信小程序需要先加载才能播放）
				// #ifndef H5
				this._initBeatAudioPool()
				// #endif
			},
			
			_initBeatAudioPool() {
				if (this._audioPool) return
				this._audioPool = []
				this._poolIdx = 0
				this._audioReadyCount = 0
				for (var i = 0; i < 3; i++) {
					var ctx = uni.createInnerAudioContext()
					ctx.obeyMuteSwitch = false
					ctx.src = '/static/click1.wav'
					;(function(idx, self) {
						ctx.onCanplay(function() {
							self._audioReadyCount = (self._audioReadyCount || 0) + 1
						})
						ctx.onError(function(res) {
							console.error('Beat audio[' + idx + '] error:', res)
						})
					})(i, this)
					this._audioPool.push(ctx)
				}
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
			
			toggleDarkMode() {
				this.isDarkMode = !this.isDarkMode
				uni.setStorageSync('flipinbeat_dark', this.isDarkMode)
				this.showToastMsg(this.isDarkMode ? '已切换深色模式' : '已切换亮色模式')
			},
			
			chooseBackground() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						const tempPath = res.tempFilePaths[0]
						this.customBackground = tempPath
						uni.setStorageSync('flipinbeat_bg', tempPath)
						this.showToastMsg('背景已设置')
					},
					fail: (err) => {
						if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
							console.error('Choose image failed:', err)
							this.showToastMsg('选择图片失败')
						}
					}
				})
			},
			
			clearBackground() {
				this.customBackground = ''
				uni.removeStorageSync('flipinbeat_bg')
				this.showToastMsg('已恢复默认背景')
			},
			
			toggleParticleEffect() {
				this.particleEffect = !this.particleEffect
				uni.setStorageSync('flipinbeat_particle', this.particleEffect)
				this.showToastMsg(this.particleEffect ? '粒子效果已开启' : '粒子效果已关闭')
			},
			
			importPDF() {
				//#ifdef MP-WEIXIN
				uni.chooseMessageFile({
					count: 1,
					type: 'file',
					extension: ['.pdf'],
					success: (res) => {
						const tempFile = res.tempFiles[0]
						if (!tempFile) {
							this.showToastMsg('未获取到文件')
							return
						}
						this.uploadToServer(tempFile.path, tempFile.name)
					},
					fail: (err) => {
						if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
							console.error('Choose file failed:', err)
							this.showToastMsg('选择文件失败，请从聊天记录中选择PDF文件')
						}
					}
				})
				return
				//#endif

				//#ifdef APP-PLUS || H5
				this.fileTrigger++
				//#endif
			},

			uploadToServer(filePath, fileName) {
				this.showToastMsg('正在上传乐谱到服务器...')
				ScoreStorage.uploadToServer(filePath, fileName)
					.then((score) => {
						this.scoreList = ScoreStorage.getScores()
						this.showToastMsg('乐谱上传成功：' + score.name)
					})
					.catch((err) => {
						console.error('Upload failed:', err)
						this.showToastMsg('上传失败：' + err.message)
					})
			},
			
			onUploadStart(data) {
				this.showToastMsg('正在上传：' + data.name)
			},

			onUploadSuccess(score) {
				ScoreStorage.addScore(score)
				this.scoreList = ScoreStorage.getScores()
				this.showToastMsg('上传成功：' + score.name)
			},

			onUploadFail(data) {
				console.error('Upload failed:', data)
				this.showToastMsg('上传失败：' + data.message)
			},

			onFileSelected(data) {
				// 兼容旧逻辑（不再使用）
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
				// 通知renderjs清理资源
				this.pdfData = '__CLEAR__'
				this.$nextTick(() => {
					this.pdfData = ''
				})
			},
			
			onPDFLoaded(data) {
				console.log('PDF loaded, total pages:', data.totalPages)
				this.totalPages = data.totalPages
				this.pdfLoading = false
			},

			onPDFLoadFail(data) {
				console.error('PDF load failed:', data.message)
				this.pdfLoading = false
				this.pdfLoaded = false
				this.showToastMsg('PDF加载失败：' + data.message)
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

			openScore(score) {
				this.currentScoreName = score.name
				this.totalPages = 10
				this.currentPage = 0
				this.pdfLoading = true
				this.showToastMsg('正在加载乐谱...')

				const downloadUrl = ScoreStorage.getDownloadUrl(score.id)
				console.log('Open score:', score.name, 'URL:', downloadUrl)

				//#ifdef MP-WEIXIN
				console.log('WeChat: downloading PDF...')
				uni.downloadFile({
					url: downloadUrl,
					success: (res) => {
						console.log('Download success:', res.statusCode, res.tempFilePath)
						if (res.statusCode === 200) {
							// 保存为临时文件并加上.pdf扩展名
							var tempPath = res.tempFilePath
							// 确保文件路径以.pdf结尾
							uni.saveFile({
								tempFilePath: tempPath,
								success: (saveRes) => {
									console.log('Save success:', saveRes.savedFilePath)
									uni.openDocument({
										filePath: saveRes.savedFilePath,
										fileType: 'pdf',
										showMenu: true,
										success: () => {
											console.log('Open document success')
											this.pdfLoading = false
										},
										fail: (err) => {
											console.error('Open document failed:', err)
											// 尝试直接用临时文件打开
											uni.openDocument({
												filePath: tempPath,
												fileType: 'pdf',
												showMenu: true,
												success: () => { this.pdfLoading = false },
												fail: (err2) => {
													console.error('Open temp failed:', err2)
													this.pdfLoading = false
													this.showToastMsg('打开文件失败：' + (err2.errMsg || ''))
												}
											})
										}
									})
								},
								fail: (err) => {
									console.error('Save file failed:', err)
									// 保存失败，直接用临时文件打开
									uni.openDocument({
										filePath: tempPath,
										fileType: 'pdf',
										showMenu: true,
										success: () => { this.pdfLoading = false },
										fail: (err2) => {
											console.error('Open document failed:', err2)
											this.pdfLoading = false
											this.showToastMsg('打开文件失败')
										}
									})
								}
							})
						} else {
							this.pdfLoading = false
							this.showToastMsg('下载失败：HTTP ' + res.statusCode)
						}
					},
					fail: (err) => {
						console.error('Download failed:', err)
						this.pdfLoading = false
						this.showToastMsg('下载失败：' + (err.errMsg || '网络错误'))
					}
				})
				return
				//#endif

				//#ifdef APP-PLUS || H5
				// 通过 renderjs 加载PDF（传入服务器URL）
				this.pdfData = downloadUrl
				this.pdfLoaded = true
				//#endif
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
							this.showToastMsg('正在删除...')
							ScoreStorage.deleteFromServer(score.id)
								.then(() => {
									this.scoreList = ScoreStorage.getScores()
									this.showToastMsg('已删除')
								})
								.catch((err) => {
									console.error('Delete failed:', err)
									// 服务器删除失败也从本地移除
									ScoreStorage.removeScore(score.id)
									this.scoreList = ScoreStorage.getScores()
									this.showToastMsg('已从本地删除')
								})
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
				if (this._audioPool) {
					for (var i = 0; i < this._audioPool.length; i++) {
						this._audioPool[i].stop()
					}
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

				// 所有平台统一调用
				this.playBeatLocally(isStrong)
				
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
			
			playBeatLocally(isStrong) {
				// #ifdef H5
				if (typeof window !== 'undefined') {
					try {
						if (!this._webAudioCtx) {
							var AC = window.AudioContext || window.webkitAudioContext
							if (AC) this._webAudioCtx = new AC()
						}
						if (this._webAudioCtx) {
							if (this._webAudioCtx.state === 'suspended') {
								this._webAudioCtx.resume()
							}
							this.playBeatWithAudioCtx(isStrong)
							return
						}
					} catch (e) {
						console.error('Web Audio failed, fallback to pool:', e)
					}
				}
				// #endif
				this.playBeatWithPool(isStrong)
			},
			
			playBeatWithPool(isStrong) {
				try {
					// 确保池已初始化
					if (!this._audioPool) {
						this._initBeatAudioPool()
					}
					
					if (!this._audioPool || this._audioPool.length === 0) return
					
					var audio = this._audioPool[this._poolIdx]
					audio.volume = isStrong ? 1.0 : 0.7
					// 先seek到开头再play，确保每次都能播放
					try { audio.seek(0) } catch(e) {}
					audio.play()
					this._poolIdx = (this._poolIdx + 1) % this._audioPool.length
				} catch (e) {
					console.error('playBeatWithPool failed:', e)
				}
			},
			
			playBeatWithAudioCtx(isStrong) {
				try {
					var ctx = this._webAudioCtx
					if (!ctx) return
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
				
				const volume = isStrong ? 1.0 : 0.7
				
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

<!-- #ifndef MP-WEIXIN -->
<script module="audio" lang="renderjs">
	let audioCtx = null
	
	export default {
		methods: {
			onAudioDataChange(newVal, oldVal, ownerVm) {
				// 音频播放已在逻辑层统一处理，此处不再播放
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
							ownerVm.callMethod('onUploadStart', { name: file.name })
							try {
								const formData = new FormData()
								formData.append('file', file)
								const resp = await fetch('http://49.232.71.68:1092/api/upload', {
									method: 'POST',
									body: formData
								})
								const result = await resp.json()
								if (result.success) {
									ownerVm.callMethod('onUploadSuccess', result.score)
								} else {
									ownerVm.callMethod('onUploadFail', { message: result.error || '上传失败' })
								}
							} catch (err) {
								ownerVm.callMethod('onUploadFail', { message: err.message || '网络错误' })
							}
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
				if (!newVal) return
				if (newVal === '__CLEAR__') {
					this.cleanupPDF()
					return
				}
				if (newVal === oldVal) return
				this.loadPDF(newVal, ownerVm)
			},

			cleanupPDF() {
				try {
					// 取消渲染任务
					if (this._renderTask) {
						try { this._renderTask.cancel() } catch(e) {}
						this._renderTask = null
					}
					// 销毁PDF文档释放内存
					if (this.pdfDoc) {
						try { this.pdfDoc.destroy() } catch(e) {}
						this.pdfDoc = null
					}
					// 清理canvas
					const container = document.getElementById('pdfCanvasContainer')
					if (container) {
						const canvases = container.querySelectorAll('canvas')
						canvases.forEach(function(c) {
							c.width = 0
							c.height = 0
							c.remove()
						})
						container._touchSetup = false
					}
					// 清理缓冲
					this._bufferCanvas = null
					this._bufferedPage = null
				} catch(e) {
					console.error('cleanupPDF error:', e)
				}
			},
			
			async loadPDF(pdfSource, ownerVm) {
				try {
					pdfOwnerVm = ownerVm

					const container = document.getElementById('pdfCanvasContainer')
					if (container) {
						// 清理旧canvas
						const oldCanvases = container.querySelectorAll('canvas')
						oldCanvases.forEach(function(c) { c.remove() })

						// 重建单canvas（已验证可工作的方式）
						const c = document.createElement('canvas')
						c.id = 'pdfRenderCanvas'
						c.style.cssText = 'width:100%;height:100%;touch-action:none;position:relative;'
						container.appendChild(c)

						// 创建离屏缓冲canvas（不加入DOM，用于预渲染）
						this._bufferCanvas = document.createElement('canvas')
					}

					if (!window.pdfjsLib) {
						await this.loadPdfJs()
					}

					let bytes
					if (typeof pdfSource === 'string' && pdfSource.startsWith('http')) {
						const response = await fetch(pdfSource)
						const arrayBuffer = await response.arrayBuffer()
						bytes = new Uint8Array(arrayBuffer)
					} else {
						const parts = pdfSource.split(',')
						const rawBase64 = parts.length > 1 ? parts[1] : pdfSource
						const binaryStr = window.atob(rawBase64)
						bytes = new Uint8Array(binaryStr.length)
						for (let i = 0; i < binaryStr.length; i++) {
							bytes[i] = binaryStr.charCodeAt(i)
						}
					}

					this.pdfDoc = await window.pdfjsLib.getDocument({ data: bytes, disableWorker: true }).promise
					this.totalPdfPages = this.pdfDoc.numPages
					this.currentPdfPage = 1

					// 渲染当前页
					await this.renderPageDirect(1)
					// 预渲染下一页到缓冲
					if (this.totalPdfPages > 1) {
						this._preRenderNext(2)
					}

					this.setupTouch()
					ownerVm.callMethod('onPDFLoaded', { totalPages: this.totalPdfPages })
					ownerVm.callMethod('onPageChanged', { page: 1 })
				} catch (err) {
					console.error('PDF load failed:', err)
					ownerVm.callMethod('onPDFLoadFail', { message: err.message })
				}
			},

			// 直接渲染到可见canvas
			async renderPageDirect(pageNum) {
				const canvas = document.getElementById('pdfRenderCanvas')
				if (!canvas || !this.pdfDoc) return

				if (this._renderTask) {
					try { this._renderTask.cancel() } catch(e) {}
					this._renderTask = null
				}

				const page = await this.pdfDoc.getPage(pageNum)
				const dpr = Math.min(window.devicePixelRatio || 1, 2)
				const container = canvas.parentElement
				const rect = container.getBoundingClientRect()
				const viewport = page.getViewport({ scale: 1 })

				// 每次都重新计算 scale，确保适配不同尺寸的页面
				const maxW = Math.max(50, rect.width - 20)
				const maxH = Math.max(50, rect.height - 20)
				const scale = Math.max(0.1, Math.min(maxW / viewport.width, maxH / viewport.height))
				const scaledViewport = page.getViewport({ scale: scale * dpr })

				// 重置所有 transform，确保干净状态
				canvas.style.transition = 'none'
				canvas.style.transform = 'none'
				canvas.style.opacity = '1'
				canvas.style.transformOrigin = 'center center'

				canvas.width = scaledViewport.width
				canvas.height = scaledViewport.height
				canvas.style.width = (scaledViewport.width / dpr) + 'px'
				canvas.style.height = (scaledViewport.height / dpr) + 'px'

				const ctx = canvas.getContext('2d')
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
				ctx.clearRect(0, 0, canvas.width, canvas.height)

				await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: scale }) }).promise
				try { page.cleanup() } catch(e) {}
			},

			// 预渲染到离屏缓冲
			async _preRenderNext(pageNum) {
				if (!this._bufferCanvas || !this.pdfDoc) return
				const canvas = this._bufferCanvas

				const page = await this.pdfDoc.getPage(pageNum)
				const dpr = Math.min(window.devicePixelRatio || 1, 2)
				const visibleCanvas = document.getElementById('pdfRenderCanvas')
				if (!visibleCanvas) return
				const container = visibleCanvas.parentElement
				const rect = container.getBoundingClientRect()
				const viewport = page.getViewport({ scale: 1 })

				const maxW = Math.max(50, rect.width - 20)
				const maxH = Math.max(50, rect.height - 20)
				const scale = Math.max(0.1, Math.min(maxW / viewport.width, maxH / viewport.height))
				const scaledViewport = page.getViewport({ scale: scale * dpr })

				// 总是重新设置buffer尺寸，确保匹配当前页
				canvas.width = scaledViewport.width
				canvas.height = scaledViewport.height

				const ctx = canvas.getContext('2d')
				ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
				ctx.clearRect(0, 0, canvas.width, canvas.height)

				await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: scale }) }).promise
				try { page.cleanup() } catch(e) {}
				this._bufferedPage = pageNum
			},

			// 将缓冲canvas内容绘制到可见canvas
			_swapBufferToVisible() {
				const visible = document.getElementById('pdfRenderCanvas')
				const buffer = this._bufferCanvas
				if (!visible || !buffer) return

				// 确保buffer已渲染正确页面
				if (!this._bufferedPage) return

				// 重置可见canvas的transform
				visible.style.transition = 'none'
				visible.style.transform = 'none'
				visible.style.opacity = '1'
				visible.style.transformOrigin = 'center center'

				// 同步尺寸
				visible.width = buffer.width
				visible.height = buffer.height

				// 计算DPR恢复CSS尺寸
				const dpr = Math.min(window.devicePixelRatio || 1, 2)
				visible.style.width = (buffer.width / dpr) + 'px'
				visible.style.height = (buffer.height / dpr) + 'px'

				// 复制内容
				const ctx = visible.getContext('2d')
				ctx.setTransform(1, 0, 0, 1, 0, 0)
				ctx.clearRect(0, 0, visible.width, visible.height)
				ctx.drawImage(buffer, 0, 0)
			},

			setupTouch() {
				const container = document.getElementById('pdfCanvasContainer')
				if (!container || container._touchSetup) return
				container._touchSetup = true

				const self = this
				let startX = 0
				let startY = 0
				let dragging = false
				let dragDirection = ''
				const SWIPE_THRESHOLD = 40

				// 缩放状态
				let scale = 1
				let lastScale = 1
				let lastX = 0
				let lastY = 0
				let isPinching = false
				let pinchStartDist = 0
				let pinchStartScale = 1
				let pinchCenterX = 0
				let pinchCenterY = 0
				let lastTapTime = 0
				let doubleTapTimer = null

				function getPinchDistance(touches) {
					const dx = touches[0].clientX - touches[1].clientX
					const dy = touches[0].clientY - touches[1].clientY
					return Math.sqrt(dx * dx + dy * dy)
				}

				function getPinchCenter(touches) {
					return {
						x: (touches[0].clientX + touches[1].clientX) / 2,
						y: (touches[0].clientY + touches[1].clientY) / 2
					}
				}

				function applyTransform() {
					const canvas = document.getElementById('pdfRenderCanvas')
					if (!canvas) return
					canvas.style.transform = 'scale(' + scale + ') translate(' + lastX + 'px, ' + lastY + 'px)'
					canvas.style.transformOrigin = 'center center'
				}

				container.addEventListener('touchstart', function(e) {
					const t = e.touches[0]
					startX = t.clientX
					startY = t.clientY
					dragging = false
					dragDirection = ''

					// 双指缩放
					if (e.touches.length === 2) {
						isPinching = true
						pinchStartDist = getPinchDistance(e.touches)
						pinchStartScale = scale
						const center = getPinchCenter(e.touches)
						pinchCenterX = center.x
						pinchCenterY = center.y
						return
					}

					// 双击缩放
					const now = Date.now()
					if (now - lastTapTime < 300) {
						if (doubleTapTimer) clearTimeout(doubleTapTimer)
						if (scale === 1) {
							// 放大到2x
							scale = 2
							lastX = -(t.clientX - container.offsetWidth / 2) * 0.5
							lastY = -(t.clientY - container.offsetHeight / 2) * 0.5
						} else {
							// 还原
							scale = 1
							lastX = 0
							lastY = 0
						}
						applyTransform()
						lastTapTime = 0
						return
					}
					lastTapTime = now
				}, { passive: true })

				container.addEventListener('touchmove', function(e) {
					// 双指缩放处理
					if (isPinching && e.touches.length === 2) {
						e.preventDefault()
						const dist = getPinchDistance(e.touches)
						const newScale = Math.max(1, Math.min(5, pinchStartScale * (dist / pinchStartDist)))
						const center = getPinchCenter(e.touches)
						// 以手指中心为缩放点
						lastX = (center.x - pinchCenterX) * 0
						lastY = (center.y - pinchCenterY) * 0
						scale = newScale
						applyTransform()
						return
					}

					if (scale > 1) {
						// 放大状态下拖动平移
						if (e.touches.length === 1) {
							e.preventDefault()
							const t = e.touches[0]
							const diffX = t.clientX - startX
							const diffY = t.clientY - startY
							lastX += diffX
							lastY += diffY
							startX = t.clientX
							startY = t.clientY
							applyTransform()
						}
						return
					}

					if (!dragging) {
						const t = e.touches[0]
						const diffX = t.clientX - startX
						const diffY = t.clientY - startY

						if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
							dragging = true
							dragDirection = diffX > 0 ? 'right' : 'left'
							self._startAnim(dragDirection)
						}
					} else {
						const t = e.touches[0]
						const diff = t.clientX - startX
						container.style.transition = 'none'
						if (dragDirection === 'left') {
							const progress = Math.min(1, Math.abs(diff) / (container.offsetWidth || 300))
							self._applyAnim(progress)
						} else if (dragDirection === 'right') {
							const progress = Math.min(1, Math.abs(diff) / (container.offsetWidth || 300))
							self._applyAnim(progress)
						}
					}
				}, { passive: false })

				container.addEventListener('touchend', function(e) {
					if (isPinching) {
						isPinching = false
						// 如果缩放回到1，重置位移
						if (scale <= 1.01) {
							scale = 1
							lastX = 0
							lastY = 0
							applyTransform()
						}
						return
					}

					if (scale > 1) return

					if (!dragging) return
					dragging = false

					const visible = document.getElementById('pdfRenderCanvas')
					container.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease'

					if (dragDirection === 'left' && self.currentPdfPage < self.totalPdfPages) {
						container.style.transform = 'translateX(-100%)'
						setTimeout(function() {
							self.currentPdfPage++
							visible.style.transition = 'none'
							visible.style.transform = 'none'
							visible.style.opacity = '1'
							if (self._bufferCanvas && self._bufferedPage === self.currentPdfPage) {
								self._swapBufferToVisible()
							} else {
								self.renderPageDirect(self.currentPdfPage)
							}
							if (self.currentPdfPage < self.totalPdfPages) {
								self._preRenderNext(self.currentPdfPage + 1)
							}
							container.style.transition = 'none'
							container.style.transform = 'translateX(0)'
							if (pdfOwnerVm) {
								pdfOwnerVm.callMethod('onPageChanged', { page: self.currentPdfPage })
							}
						}, 300)
					} else if (dragDirection === 'right' && self.currentPdfPage > 1) {
						container.style.transform = 'translateX(100%)'
						setTimeout(function() {
							self.currentPdfPage--
							visible.style.transition = 'none'
							visible.style.transform = 'none'
							visible.style.opacity = '1'
							self.renderPageDirect(self.currentPdfPage)
							if (self.currentPdfPage > 1) {
								self._preRenderNext(self.currentPdfPage - 1)
							}
							container.style.transition = 'none'
							container.style.transform = 'translateX(0)'
							if (pdfOwnerVm) {
								pdfOwnerVm.callMethod('onPageChanged', { page: self.currentPdfPage })
							}
						}, 300)
					} else {
						visible.style.transition = 'transform 0.25s ease-out'
						visible.style.transform = 'none'
						visible.style.opacity = '1'
						container.style.transform = 'translateX(0)'
					}
				}, { passive: true })
			},

			_startAnim(direction) {
				const container = document.getElementById('pdfCanvasContainer')
				const canvas = document.getElementById('pdfRenderCanvas')
				if (!container || !canvas) return

				this._animDir = direction
				if (direction === 'left') {
					// 预渲染下一页到缓冲已在 loadPDF/翻页时完成
					canvas.style.transformOrigin = 'left center'
				} else {
					if (this.currentPdfPage > 1) {
						this._preRenderNext(this.currentPdfPage - 1)
					}
					canvas.style.transformOrigin = 'right center'
				}
			},

			_applyAnim(progress) {
				const canvas = document.getElementById('pdfRenderCanvas')
				if (!canvas) return
				const angle = progress * 180
				const scale = 1 - progress * 0.04
				if (this._animDir === 'left') {
					canvas.style.transform = 'perspective(2000px) rotateY(' + (-angle) + 'deg) scaleX(' + scale + ')'
					canvas.style.opacity = 1 - progress * 0.2
				} else {
					canvas.style.transform = 'perspective(2000px) rotateY(' + angle + 'deg) scaleX(' + scale + ')'
					canvas.style.opacity = 1 - progress * 0.2
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

			renderPage(pageNum, ownerVm) {
				this.renderPageDirect(pageNum)
				if (ownerVm) ownerVm.callMethod('onPageChanged', { page: pageNum })
			},

			nextPage(ownerVm) {
				if (this.currentPdfPage < this.totalPdfPages) {
					this.currentPdfPage++
					this.renderPageDirect(this.currentPdfPage)
					if (this.currentPdfPage < this.totalPdfPages) {
						this._preRenderNext(this.currentPdfPage + 1)
					}
					if (ownerVm) ownerVm.callMethod('onPageChanged', { page: this.currentPdfPage })
				}
			},

			prevPage(ownerVm) {
				if (this.currentPdfPage > 1) {
					this.currentPdfPage--
					this.renderPageDirect(this.currentPdfPage)
					if (this.currentPdfPage > 1) {
						this._preRenderNext(this.currentPdfPage - 1)
					}
					if (ownerVm) ownerVm.callMethod('onPageChanged', { page: this.currentPdfPage })
				}
			}
		}
	}
	
	let pdfDoc = null
let currentPdfPage = 1
let totalPdfPages = 0
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
		background: var(--theme-bg);
		background-image: var(--theme-bg-image);
		background-size: var(--theme-bg-image-size);
		background-position: var(--theme-bg-image-position);
		background-repeat: no-repeat;
		display: flex;
		flex-direction: column;
		padding-bottom: 120rpx;
		transition: all 0.4s ease;
		--theme-primary: #3B82F6;
		--theme-secondary: #60A5FA;
		--theme-accent: #93C5FD;
		--theme-bg: #F0F9FF;
		--theme-text: #1a1a1a;
		--theme-card: rgba(255, 255, 255, 0.85);
		--theme-border: rgba(0, 0, 0, 0.06);
		--theme-bg-image: none;
		--theme-bg-image-size: cover;
		--theme-bg-image-position: center center;
		
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
			background: var(--theme-bg);
			background-image: var(--theme-bg-image);
			background-size: var(--theme-bg-image-size);
			background-position: var(--theme-bg-image-position);
			background-repeat: no-repeat;
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
		background: var(--theme-card);
		backdrop-filter: blur(20px);
		border-bottom: 1rpx solid var(--theme-border);
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
		color: var(--theme-text);
		opacity: 0.6;
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
		height: 100vh;
		overflow: hidden;
		background: #2c2c2c;
	}

	.pdf-canvas-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
		background: linear-gradient(135deg, #525659 0%, #3a3d40 100%);
		perspective: 2000rpx;
	}

	.pdf-page {
		position: absolute;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		transform-origin: left center;
		transition: transform 0.15s ease-out;
		box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.6), 3rpx 0 12rpx rgba(0, 0, 0, 0.3);
		border-radius: 4rpx;
		background: #fff;
	}

	.pdf-page-current {
		z-index: 10;
		transform-origin: left center;
	}

	.pdf-page-next {
		z-index: 5;
	}

	.page-curl-shadow {
		position: absolute;
		z-index: 15;
		pointer-events: none;
		background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.4) 100%);
		opacity: 0;
		transition: opacity 0.15s ease;
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
		background: var(--theme-card);
		backdrop-filter: blur(20px);
		border-radius: 40rpx;
		padding: 64rpx 48rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 24rpx 80rpx rgba(59, 130, 246, 0.15);
		border: 1rpx solid var(--theme-border);
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
		color: var(--theme-text);
		opacity: 0.5;
		margin-bottom: 32rpx;
	}
	
	.empty-desc {
		font-size: 28rpx;
		color: var(--theme-text);
		opacity: 0.7;
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
		background: var(--theme-card);
		border-radius: 20rpx;
		padding: 32rpx;
		display: flex;
		align-items: center;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid var(--theme-border);
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
		color: var(--theme-text);
	}
	
	.score-date {
		font-size: 24rpx;
		color: var(--theme-text);
		opacity: 0.5;
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
		color: var(--theme-text);
	}
	
	.settings-list {
		flex: 1;
		background: var(--theme-card);
		border-radius: 24rpx;
		overflow: hidden;
	}
	
	.setting-item {
		display: flex;
		align-items: center;
		padding: 32rpx 24rpx;
		border-bottom: 1rpx solid var(--theme-border);
		
		&:last-child {
			border-bottom: none;
		}
	}
	
	.setting-icon {
		font-size: 36rpx;
		margin-right: 20rpx;
	}
	
	.setting-label {
		color: var(--theme-text);
		flex: 1;
		font-size: 30rpx;
		font-weight: 500;
	}
	
	.setting-value {
		font-size: 26rpx;
		color: var(--theme-text);
		opacity: 0.5;
	}
	
	.setting-arrow {
		font-size: 36rpx;
		color: var(--theme-text);
		opacity: 0.3;
		font-weight: 300;
	}
	
	.setting-version {
		font-size: 26rpx;
		color: var(--theme-text);
		opacity: 0.5;
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
