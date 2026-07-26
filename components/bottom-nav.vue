<template>
	<view class="bottom-nav" :style="navStyle">
		<view 
			v-for="item in navItems" 
			:key="item.key"
			class="nav-item"
			:class="{ 'active': currentTab === item.key }"
			@click="switchTab(item.key)"
		>
			<view class="nav-icon-wrapper">
				<text class="nav-icon">{{ item.icon }}</text>
				<view v-if="item.key === 'metronome' && isPlaying" class="playing-indicator"></view>
			</view>
			<text class="nav-label">{{ item.label }}</text>
			<view v-if="currentTab === item.key" class="active-indicator"></view>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			currentTab: {
				type: String,
				default: 'library'
			},
			isPlaying: {
				type: Boolean,
				default: false
			},
			theme: {
				type: Object,
				default: function() { return { primary: '#3B82F6', secondary: '#60A5FA', accent: '#93C5FD' }; }
			}
		},
		
		data() {
			return {
				navItems: [
					{ key: 'library', label: '乐谱', icon: '📖' },
					{ key: 'metronome', label: '节拍器', icon: '⚡' },
					{ key: 'settings', label: '设置', icon: '⚙️' }
				]
			}
		},
		
		computed: {
			navStyle() {
				return {
					'--theme-primary': this.theme.primary,
					'--theme-secondary': this.theme.secondary
				}
			}
		},
		
		methods: {
			switchTab(key) {
				this.$emit('change', key)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 120rpx;
		padding-bottom: env(safe-area-inset-bottom);
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		display: flex;
		justify-content: space-around;
		align-items: center;
		box-shadow: 0 -4rpx 30rpx rgba(0, 0, 0, 0.08);
		z-index: 500;
		--theme-primary: #3B82F6;
		--theme-secondary: #60A5FA;
	}
	
	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 10rpx 0;
		transition: all 0.3s ease;
		
		&.active {
			.nav-icon-wrapper {
				transform: scale(1.1);
			}
			
			.nav-icon {
				color: var(--theme-primary);
			}
			
			.nav-label {
				color: var(--theme-primary);
				font-weight: 600;
			}
		}
	}
	
	.nav-icon-wrapper {
		position: relative;
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	.nav-icon {
		font-size: 40rpx;
		color: #999;
		transition: color 0.3s ease;
	}
	
	.playing-indicator {
		position: absolute;
		top: 0;
		right: 0;
		width: 16rpx;
		height: 16rpx;
		background: #22c55e;
		border-radius: 50%;
		animation: pulse 1.5s infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
	}
	
	.nav-label {
		font-size: 22rpx;
		color: #666;
		margin-top: 6rpx;
		transition: all 0.3s ease;
	}
	
	.active-indicator {
		position: absolute;
		top: 8rpx;
		width: 8rpx;
		height: 8rpx;
		background: var(--theme-primary);
		border-radius: 50%;
	}
</style>
