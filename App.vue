<script>
	export default {
		onLaunch: function() {
			console.log('FlipinBeat App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	page {
		background: linear-gradient(180deg, #fafaff 0%, #f0f2f8 50%, #e8ecf6 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	
	view, text {
		box-sizing: border-box;
	}
	
	.safe-area-bottom {
		padding-bottom: env(safe-area-inset-bottom);
	}
	
	::-webkit-scrollbar {
		width: 6rpx;
		height: 6rpx;
	}
	
	::-webkit-scrollbar-track {
		background: transparent;
	}
	
	::-webkit-scrollbar-thumb {
		background: rgba(59, 130, 246, 0.3);
		border-radius: 3rpx;
	}
	
	::-webkit-scrollbar-thumb:hover {
		background: rgba(59, 130, 246, 0.5);
	}
</style>
