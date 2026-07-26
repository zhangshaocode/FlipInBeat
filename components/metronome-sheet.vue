<template>
	<view class="metronome-sheet-wrapper" :class="{ 'expanded': isExpanded }">
		<view class="sheet-backdrop" @click="toggleExpand"></view>
		
		<view class="sheet-container" :style="sheetStyle">
			<view class="sheet-handle" @click="toggleExpand">
				<view class="handle-bar"></view>
			</view>
			
			<view class="sheet-header">
				<view class="header-left">
					<text class="sheet-title">节拍器</text>
					<text class="sheet-subtitle">{{ bpm }} BPM</text>
				</view>
				<view 
					class="play-btn" 
					:class="{ 'playing': isPlaying }"
					@click="togglePlay"
				>
					<text class="play-icon">{{ isPlaying ? '⏹' : '▶' }}</text>
				</view>
			</view>
			
			<view class="sheet-content" v-if="isExpanded">
				<view class="control-group">
					<text class="control-label">速度 (BPM)</text>
					<view class="bpm-controls">
						<view class="bpm-btn" @click="adjustBpm(-10)">
							<text>-10</text>
						</view>
						<text class="bpm-value">{{ bpm }}</text>
						<view class="bpm-btn" @click="adjustBpm(10)">
							<text>+10</text>
						</view>
					</view>
					<slider 
						class="bpm-slider" 
						:value="bpm" 
						:min="40" 
						:max="240" 
						@change="onBpmChange"
					/>
				</view>

				<view class="control-group">
					<text class="control-label">拍号</text>
					<view class="time-signature-selector">
						<view 
							v-for="sig in timeSignatures" 
							:key="sig.value"
							class="sig-btn"
							:class="{ 'active': timeSignature === sig.value }"
							@click="setTimeSignature(sig.value)"
						>
							<text>{{ sig.label }}</text>
						</view>
					</view>
				</view>

				<view class="control-group">
					<text class="control-label">音色</text>
					<view class="tone-selector">
						<view 
							v-for="tone in tones" 
							:key="tone.value"
							class="tone-btn"
							:class="{ 'active': toneType === tone.value }"
							@click="setTone(tone.value)"
						>
							<text>{{ tone.label }}</text>
						</view>
					</view>
				</view>

				<view class="control-group beat-section" v-if="isPlaying">
					<text class="control-label">当前拍</text>
					<view class="beat-indicator">
						<view 
							v-for="(beat, index) in currentBeats" 
							:key="index"
							class="beat-dot"
							:class="{ 'active': index === currentBeat - 1 }"
						></view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			isPlaying: {
				type: Boolean,
				default: false
			},
			bpm: {
				type: Number,
				default: 120
			},
			timeSignature: {
				type: String,
				default: '4/4'
			},
			toneType: {
				type: String,
				default: 'click'
			},
			currentBeat: {
				type: Number,
				default: 1
			},
			currentBeats: {
				type: Array,
				default: () => [1, 2, 3, 4]
			}
		},
		
		data() {
			return {
				isExpanded: false,
				timeSignatures: [
					{ label: '2/4', value: '2/4' },
					{ label: '3/4', value: '3/4' },
					{ label: '4/4', value: '4/4' },
					{ label: '6/8', value: '6/8' }
				],
				tones: [
					{ label: 'Click', value: 'click' },
					{ label: 'Wood', value: 'wood' },
					{ label: 'Bell', value: 'bell' },
					{ label: 'Digital', value: 'digital' }
				]
			}
		},
		
		computed: {
			sheetStyle() {
				return {
					transform: this.isExpanded ? 'translateY(0)' : 'translateY(75%)'
				}
			}
		},
		
		methods: {
			toggleExpand() {
				this.isExpanded = !this.isExpanded
				this.$emit('expand', this.isExpanded)
			},
			
			togglePlay() {
				this.$emit('togglePlay')
			},
			
			adjustBpm(delta) {
				this.$emit('adjustBpm', delta)
			},
			
			onBpmChange(e) {
				this.$emit('bpmChange', e.detail.value)
			},
			
			setTimeSignature(sig) {
				this.$emit('timeSignatureChange', sig)
			},
			
			setTone(tone) {
				this.$emit('toneChange', tone)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.metronome-sheet-wrapper {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 200;
		pointer-events: none;
		
		&.expanded {
			.sheet-backdrop {
				opacity: 1;
				pointer-events: auto;
			}
			
			.sheet-container {
				pointer-events: auto;
			}
		}
	}
	
	.sheet-backdrop {
		position: absolute;
		top: -100vh;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.sheet-container {
		position: relative;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 32rpx 32rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.12);
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		pointer-events: auto;
		max-height: 80vh;
	}
	
	.sheet-handle {
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.handle-bar {
		width: 60rpx;
		height: 8rpx;
		background: #ddd;
		border-radius: 4rpx;
		transition: all 0.3s ease;
		
		.sheet-container:active & {
			background: #bbb;
		}
	}
	
	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 32rpx 24rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
	}
	
	.header-left {
		display: flex;
		flex-direction: column;
	}
	
	.sheet-title {
		font-size: 32rpx;
		font-weight: 700;
		color: #1a1a2e;
	}
	
	.sheet-subtitle {
		font-size: 24rpx;
		color: #667eea;
		margin-top: 4rpx;
		font-weight: 600;
	}
	
	.play-btn {
		width: 88rpx;
		height: 88rpx;
		background: linear-gradient(135deg, #22c55e, #16a34a);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(34, 197, 94, 0.4);
		transition: all 0.3s ease;
		
		&.playing {
			background: linear-gradient(135deg, #ef4444, #dc2626);
			box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.4);
			animation: pulse-glow 2s infinite;
		}
		
		&:active {
			transform: scale(0.95);
		}
	}
	
	@keyframes pulse-glow {
		0%, 100% {
			box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.4);
		}
		50% {
			box-shadow: 0 8rpx 32rpx rgba(239, 68, 68, 0.6);
		}
	}
	
	.play-icon {
		font-size: 36rpx;
		color: #fff;
	}
	
	.sheet-content {
		padding: 24rpx 32rpx;
		max-height: 60vh;
		overflow-y: auto;
	}
	
	.control-group {
		margin-bottom: 32rpx;
		
		&:last-child {
			margin-bottom: 0;
		}
	}
	
	.control-label {
		font-size: 24rpx;
		color: #888;
		margin-bottom: 16rpx;
		display: block;
		text-transform: uppercase;
		letter-spacing: 2rpx;
	}
	
	.bpm-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 48rpx;
		margin-bottom: 20rpx;
	}
	
	.bpm-btn {
		width: 96rpx;
		height: 72rpx;
		background: #f5f7fa;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		color: #555;
		font-weight: 600;
		transition: all 0.2s ease;
		
		&:active {
			background: #e8ecf0;
			transform: scale(0.96);
		}
	}
	
	.bpm-value {
		font-size: 64rpx;
		font-weight: 800;
		color: #667eea;
		min-width: 160rpx;
		text-align: center;
	}
	
	.bpm-slider {
		width: 100%;
		margin: 0;
		
		::v-deep(.uni-slider-handle-wrapper) {
			.uni-slider-handle {
				width: 36rpx;
				height: 36rpx;
				background: #667eea;
				border: none;
				box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.5);
			}
		}
		
		::v-deep(.uni-slider-bar) {
			background: #667eea;
		}
		
		::v-deep(.uni-slider-bg) {
			background: #e8ecf0;
		}
	}
	
	.time-signature-selector,
	.tone-selector {
		display: flex;
		gap: 16rpx;
		flex-wrap: wrap;
	}
	
	.sig-btn,
	.tone-btn {
		padding: 20rpx 40rpx;
		background: #f5f7fa;
		border-radius: 16rpx;
		font-size: 26rpx;
		color: #555;
		font-weight: 500;
		transition: all 0.25s ease;
		
		&.active {
			background: linear-gradient(135deg, #667eea, #764ba2);
			color: #fff;
			box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
		}
		
		&:active {
			transform: scale(0.96);
		}
	}
	
	.beat-section {
		margin-top: 24rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid rgba(0, 0, 0, 0.05);
	}
	
	.beat-indicator {
		display: flex;
		gap: 24rpx;
		justify-content: center;
	}
	
	.beat-dot {
		width: 36rpx;
		height: 36rpx;
		background: #e8ecf0;
		border-radius: 50%;
		transition: all 0.15s ease;
		
		&.active {
			background: #22c55e;
			transform: scale(1.4);
			box-shadow: 0 0 16rpx rgba(34, 197, 94, 0.6);
		}
	}
</style>
