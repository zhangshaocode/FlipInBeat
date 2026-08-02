<template>
	<view 
		class="metronome-panel" 
		:class="{ 'floating': isFloating, 'visible': isVisible, 'collapsed': isFloating && !isFloatingExpanded }" 
		:style="panelStyle"
	>
		<view class="floating-strip" v-if="isFloating && !isFloatingExpanded" @click.stop="toggleFloating">
			<view class="strip-indicator"></view>
			<view v-if="isPlaying" class="strip-playing"></view>
			<text class="strip-icon">◀</text>
		</view>
		
		<view class="panel-container" v-show="isVisible && (!isFloating || isFloatingExpanded)">
			<view class="panel-header">
				<view v-if="isFloatingExpanded" class="collapse-btn" @click="toggleFloating">
					<text>▶</text>
				</view>
				<text class="panel-title">节拍器</text>
			</view>

			<view class="panel-content">
				<view class="bpm-display">
					<text class="bpm-value">{{ bpm }}</text>
					<text class="bpm-unit">BPM</text>
				</view>
				
				<view class="beat-indicator-container" v-if="isPlaying">
					<view class="beat-indicator">
						<view v-for="(beat, index) in currentBeats" :key="index" class="beat-dot" :class="{ 'active': index === currentBeat - 1 }"></view>
					</view>
					<view class="particles-container" v-if="particleEffect && currentBeat > 0">
						<view 
							v-for="(particle, pIndex) in particles" 
							:key="pIndex" 
							class="particle"
							:style="{ 
								left: particle.x + '%', 
								top: particle.y + '%', 
								background: particle.color,
								animationDuration: particle.duration + 'ms',
								animationDelay: particle.delay + 'ms',
								width: particle.size + 'rpx',
								height: particle.size + 'rpx',
								opacity: particle.opacity
							}"
						></view>
					</view>
				</view>
				
				<view class="play-btn" :class="{ 'playing': isPlaying }" @click="togglePlay">
					<text class="play-icon">{{ isPlaying ? '⏹' : '▶' }}</text>
				</view>

				<view class="control-group">
					<text class="control-label">速度</text>
					<view class="bpm-controls">
						<view class="bpm-btn" @click="adjustBpm(-10)"><text>-10</text></view>
						<view class="bpm-btn" @click="adjustBpm(-1)"><text>-1</text></view>
						<view class="bpm-btn" @click="adjustBpm(1)"><text>+1</text></view>
						<view class="bpm-btn" @click="adjustBpm(10)"><text>+10</text></view>
					</view>
				</view>

				<view class="control-group">
					<text class="control-label">拍号</text>
					<view class="time-signature-selector">
						<view v-for="sig in timeSignatures" :key="sig.value" class="sig-btn" :class="{ 'active': timeSignature === sig.value }" @click="setTimeSignature(sig.value)">
							<text>{{ sig.label }}</text>
						</view>
					</view>
				</view>

				<view class="control-group">
					<text class="control-label">音色</text>
					<view class="tone-selector">
						<view v-for="tone in tones" :key="tone.value" class="tone-btn" :class="{ 'active': toneType === tone.value }" @click="setTone(tone.value)">
							<text>{{ tone.label }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		isVisible: { type: Boolean, default: false },
		isFloating: { type: Boolean, default: false },
		isPlaying: { type: Boolean, default: false },
		bpm: { type: Number, default: 120 },
		timeSignature: { type: String, default: '4/4' },
		toneType: { type: String, default: 'click' },
		currentBeat: { type: Number, default: 1 },
		currentBeats: { type: Array, default: function() { return [1, 2, 3, 4]; } },
		particleEffect: { type: Boolean, default: true },
		theme: { type: Object, default: function() { return { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' }; } }
	},
	data: function() {
		return {
			isFloatingExpanded: true,
			particles: [],
			timeSignatures: [
				{ label: '2/4', value: '2/4' },
				{ label: '3/4', value: '3/4' },
				{ label: '4/4', value: '4/4' },
				{ label: '5/4', value: '5/4' },
				{ label: '6/4', value: '6/4' },
				{ label: '7/4', value: '7/4' },
				{ label: '3/8', value: '3/8' },
				{ label: '6/8', value: '6/8' },
				{ label: '9/8', value: '9/8' },
				{ label: '12/8', value: '12/8' },
				{ label: '2/2', value: '2/2' }
			],
			tones: [
				{ label: 'Click', value: 'click' },
				{ label: 'Wood', value: 'wood' },
				{ label: 'Bell', value: 'bell' },
				{ label: 'Digital', value: 'digital' }
			]
		};
	},
	computed: {
		panelStyle: function() {
			return {
				'--theme-primary': this.theme.primary,
				'--theme-secondary': this.theme.secondary,
				'--theme-accent': this.theme.accent
			}
		}
	},
	watch: {
		isFloating: function(newVal) {
			if (newVal) {
				this.isFloatingExpanded = false;
			}
		},
		currentBeat: function(newBeat) {
			if (newBeat > 0 && this.particleEffect) {
				this.generateParticles(newBeat === 1);
			}
		}
	},
	methods: {
		toggleFloating: function() {
			this.isFloatingExpanded = !this.isFloatingExpanded;
			this.$emit('toggle', this.isFloatingExpanded);
		},
		togglePlay: function() {
			this.$emit('togglePlay');
		},
		adjustBpm: function(delta) {
			this.$emit('adjustBpm', delta);
		},
		setTimeSignature: function(value) {
			this.$emit('timeSignatureChange', value);
		},
		setTone: function(tone) {
			this.$emit('toneChange', tone);
		},
		generateParticles: function(isStrong) {
			const particleCount = isStrong ? 40 : 30;
			const colors = isStrong 
				? [this.theme.primary, this.theme.secondary, this.theme.accent]
				: [this.theme.accent, this.theme.secondary, '#6EE7B7', '#A5B4FC'];
			
			this.particles = [];
			
			for (let i = 0; i < particleCount; i++) {
				const angle = Math.random() * Math.PI * 2;
				const distance = 5 + Math.random() * 35;
				const size = 4 + Math.random() * 12;
				
				this.particles.push({
					x: 50 + Math.cos(angle) * distance,
					y: 50 + Math.sin(angle) * distance,
					color: colors[Math.floor(Math.random() * colors.length)],
					size: size,
					duration: 300 + Math.random() * 400,
					delay: Math.random() * 60,
					opacity: 0.5 + Math.random() * 0.5
				});
			}
			
			setTimeout(() => {
				this.particles = [];
			}, 800);
		}
	}
};
</script>

<style lang="scss" scoped>
.metronome-panel {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.98);
	backdrop-filter: blur(20px);
	display: flex;
	flex-direction: column;
	opacity: 0;
	transform: scale(0.9);
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	pointer-events: none;
	z-index: 300;
	overflow: hidden;
	--theme-primary: #3B82F6;
	--theme-secondary: #60A5FA;
	--theme-accent: #93C5FD;
	
	&.visible {
		opacity: 1;
		transform: scale(1);
		pointer-events: auto;
	}
	
	&.floating {
		position: fixed;
		z-index: 999;
		top: 5%;
		right: 0;
		bottom: auto;
		left: auto;
		width: 60rpx;
		height: 720rpx;
		transform: translateY(0);
		transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
		border-radius: 20rpx 0 0 20rpx;
		box-shadow: -4rpx 0 20rpx rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(10px);
		cursor: pointer;
		
		&.collapsed {
			width: 60rpx;
			border-radius: 20rpx 0 0 20rpx;
			box-shadow: -6rpx 0 30rpx rgba(0, 0, 0, 0.15);
			background: rgba(255, 255, 255, 0.95);
			
			&:active {
				background: rgba(255, 255, 255, 0.6);
				transform: translateY(-2rpx);
			}
		}
		
		&:not(.collapsed) {
			width: 380rpx;
			box-shadow: -8rpx 0 40rpx rgba(0, 0, 0, 0.15);
		}
	}
}

.floating-strip {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 10;
	
	.strip-indicator {
		width: 6rpx;
		height: 60rpx;
		background: var(--theme-primary);
		border-radius: 3rpx;
		margin-bottom: 8rpx;
		animation: stripPulse 1.5s ease-in-out infinite;
	}
	
	.strip-playing {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #22c55e;
		margin-bottom: 8rpx;
		animation: dotBlink 1s ease-in-out infinite;
	}
	
	.strip-icon {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.7);
		transform: rotate(90deg);
	}
}

@keyframes stripPulse {
	0%, 100% { opacity: 0.4; }
	50% { opacity: 1; }
}

@keyframes dotBlink {
	0%, 100% { opacity: 0.3; }
	50% { opacity: 1; }
}

.collapse-btn {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	
	text {
		font-size: 24rpx;
		color: #666;
	}
	
	&:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}
}

.panel-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	padding-bottom: 140rpx;
	opacity: 0;
	transition: opacity 0.3s ease;
	
	.floating:not(.collapsed) &,
	.visible:not(.floating) & {
		opacity: 1;
	}
}

.panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 60rpx 32rpx 24rpx;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.panel-title {
	font-size: 40rpx;
	font-weight: 800;
	background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.panel-content {
	flex: 1;
	padding: 40rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 32rpx;
}

.bpm-display {
	display: flex;
	align-items: baseline;
	gap: 8rpx;
}

.bpm-value {
	font-size: 96rpx;
	font-weight: 900;
	background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	line-height: 1;
}

.bpm-unit {
	font-size: 28rpx;
	color: #999;
	font-weight: 500;
}

.play-btn {
	width: 140rpx;
	height: 140rpx;
	background: linear-gradient(135deg, #22c55e, #16a34a);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 16rpx 40rpx rgba(34, 197, 94, 0.5);
	transition: all 0.3s ease;
	margin: 20rpx 0;
	
	&.playing {
		background: linear-gradient(135deg, #ef4444, #dc2626);
		box-shadow: 0 16rpx 40rpx rgba(239, 68, 68, 0.5);
		animation: pulse-glow 2s infinite;
	}
	
	&:active { transform: scale(0.95); }
}

@keyframes pulse-glow {
	0%, 100% { box-shadow: 0 16rpx 40rpx rgba(239, 68, 68, 0.5); }
	50% { box-shadow: 0 16rpx 56rpx rgba(239, 68, 68, 0.7); }
}

.play-icon {
	font-size: 56rpx;
	color: #fff;
	margin-left: 6rpx;
}

.control-group {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.control-label {
	font-size: 24rpx;
	color: #888;
	text-transform: uppercase;
	letter-spacing: 2rpx;
	text-align: center;
}

.bpm-controls {
	display: flex;
	gap: 16rpx;
	justify-content: center;
}

.bpm-btn {
	width: 80rpx;
	height: 72rpx;
	background: #f5f7fa;
	border-radius: 12rpx;
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

.volume-control {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 0 16rpx;
}

.volume-icon { font-size: 32rpx; }

.volume-slider {
	flex: 1;
	height: 8rpx;
}

.volume-value {
	font-size: 24rpx;
	color: #667eea;
	font-weight: 600;
	width: 60rpx;
	text-align: right;
}

.time-signature-selector, .tone-selector {
	display: flex;
	gap: 12rpx;
	flex-wrap: wrap;
	justify-content: center;
}

.sig-btn, .tone-btn {
	padding: 14rpx 22rpx;
	background: #f5f7fa;
	border-radius: 10rpx;
	font-size: 24rpx;
	color: #555;
	font-weight: 500;
	transition: all 0.25s ease;
	
	&.active {
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		color: #fff;
		box-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.4);
	}
	
	&:active { transform: scale(0.96); }
}

.beat-indicator-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx 0;
	position: relative;
}

.beat-indicator {
	display: flex;
	gap: 20rpx;
	justify-content: center;
	align-items: center;
}

.beat-dot {
	width: 56rpx;
	height: 56rpx;
	background: linear-gradient(135deg, #e8ecf0, #d1d5db);
	border-radius: 50%;
	transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
	position: relative;
	box-shadow: inset 0 2rpx 4rpx rgba(255, 255, 255, 0.8), 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
	
	&.active {
		background: linear-gradient(135deg, #22c55e, #16a34a);
		transform: scale(1.5);
		box-shadow: 0 0 28rpx rgba(34, 197, 94, 0.8), 0 0 56rpx rgba(34, 197, 94, 0.4), inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.1);
	}
	
	&:first-child.active {
		background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
		box-shadow: 0 0 28rpx rgba(59, 130, 246, 0.8), 0 0 56rpx rgba(59, 130, 246, 0.4), inset 0 -2rpx 4rpx rgba(0, 0, 0, 0.1);
	}
}

.particles-container {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	pointer-events: none;
	z-index: 10;
}

.particle {
	position: absolute;
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	animation: particle-explode linear forwards;
}

@keyframes particle-explode {
	0% {
		transform: translate(-50%, -50%) scale(1);
		opacity: 1;
	}
	100% {
		transform: translate(-50%, -50%) scale(0);
		opacity: 0;
	}
}
</style>
