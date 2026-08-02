<div align="center">

# FlipinBeat

**翻页节拍器 — 让练琴更专注**

一个基于 uni-app 的跨平台乐谱阅读与节拍器应用，支持 PDF 乐谱翻页、节拍器、深色模式等功能。

</div>

---

## 目录

- [功能概览](#功能概览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境准备](#环境准备)
- [HBuilderX 开发指南](#hbuilderx-开发指南)
- [服务器部署](#服务器部署)
- [平台适配说明](#平台适配说明)
- [常见问题](#常见问题)

---

## 功能概览

### 乐谱阅读

| 功能 | 说明 |
|------|------|
| PDF 导入 | 支持从设备文件、聊天记录（微信）导入 PDF 乐谱 |
| 纸质翻页 | 3D `rotateY` 手势跟随翻页，触碰边缘即刻翻起 |
| 双指缩放 | 双指捏合 1×~5× 缩放，双击快速 2× 放大/还原 |
| 预渲染 | 下一页离屏 Canvas 预渲染，翻页零延迟 |
| 服务器加密 | PDF 以 AES-256-GCM 加密存储，下载时动态解密 |

### 节拍器

| 功能 | 说明 |
|------|------|
| BPM 调节 | ±1 / ±10 微调 |
| 拍号 | 11 种拍号（2/4、3/4、4/4、5/4、6/4、7/4、3/8、6/8、9/8、12/8、2/2） |
| 音色 | Click / Wood / Bell / Digital 四种音色（H5 端通过 Web Audio API 振荡器实现） |
| 粒子爆破 | 节拍触发粒子动画，强/弱拍颜色区分，跟随主题色 |
| 悬浮模式 | 查看乐谱时以半透明悬浮条收起，点击展开 |

### 外观与主题

| 功能 | 说明 |
|------|------|
| 主题色 | 天蓝色 / 紫色 / 浅绿色，CSS 变量动态切换 |
| 深色模式 | 一键切换深/亮色模式，全 UI 元素适配 |
| 自定义背景 | 支持上传竖屏图片作为全局背景（含乐谱阅读页） |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | uni-app (Vue 2) |
| 构建工具 | HBuilderX |
| PDF 渲染 | pdf.js（renderjs + Canvas，APP/H5 端） |
| 节拍器音频 | Web Audio API（H5）/ InnerAudioContext 音频池（APP/小程序） |
| 后端 | Node.js + Koa 2 |
| 加密 | AES-256-GCM |
| 文件上传 | @koa/multer |

---

## 项目结构

```
FlipinBeat/
├── pages/
│   ├── index/
│   │   └── index.vue          # 主页面（乐谱列表、节拍器、设置、PDF阅读）
│   └── pdf-viewer/
│       ├── pdf-viewer.html    # 独立 PDF 查看器（备用）
│       └── pdf.min.js         # pdf.js 本地副本
├── components/
│   ├── bottom-nav.vue         # 底部导航栏
│   ├── metronome-panel.vue    # 节拍器面板（含粒子动画）
│   └── metronome-sheet.vue    # 节拍器底部弹出层（备用）
├── server/
│   ├── server.js              # Koa 后端服务
│   ├── package.json           # 服务器依赖
│   └── deploy.sh              # CentOS 一键部署脚本
├── static/
│   ├── click1.wav             # 节拍器音效
│   ├── app-plus/
│   │   └── pdf.min.js         # APP 专用 pdf.js（避免微信编译报错）
│   └── logo.png
├── utils/
│   └── score-storage.js       # 乐谱存储工具（服务器 API + 本地缓存）
├── App.vue
├── main.js
├── pages.json                 # 页面路由配置
├── manifest.json              # uni-app 应用配置
└── index.html
```

---

## 环境准备

### 必需软件

| 软件 | 版本要求 | 下载 |
|------|---------|------|
| **HBuilderX** | 3.8+ | [https://www.dcloud.io/hbuilderx.html](https://www.dcloud.io/hbuilderx.html) |
| **微信开发者工具** | 最新稳定版 | [https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) |
| **Node.js** | 16+（服务器端） | [https://nodejs.org](https://nodejs.org) |

### HBuilderX 插件

打开 HBuilderX → 工具 → 插件安装，确认以下插件已安装：

- **uni-app(Vue2) 编译**
- **scss/sass 编译**
- **微信小程序编译**

---

## HBuilderX 开发指南

### 1. 导入项目

1. 打开 HBuilderX
2. 文件 → 打开目录 → 选择 `FlipinBeat` 项目根目录
3. 等待索引完成（左下角进度条结束）

### 2. 运行到各平台

#### H5 端（浏览器调试）

```
菜单栏 → 运行 → 运行到浏览器 → Chrome
```

- 默认端口 `5173`
- 节拍器使用 Web Audio API（支持 4 种音色）
- PDF 使用 renderjs + pdf.js 渲染

#### APP 端（真机调试）

```
菜单栏 → 运行 → 运行到手机或模拟器 → 运行到Android App基座
```

- 需要连接 Android 设备（开启 USB 调试）或安装模拟器
- 首次运行会自动安装「标准基座」APK
- 节拍器使用 InnerAudioContext 音频池

#### 微信小程序

```
菜单栏 → 运行 → 运行到小程序模拟器 → 微信开发者工具
```

- 需提前安装微信开发者工具并登录
- HBuilderX 会自动编译到 `unpackage/dist/build/mp-weixin/`
- 首次运行需在微信开发者工具中导入项目

> **微信开发者工具设置**：
> 详情 → 本地设置 → 勾选以下两项：
> - ✅ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
> - ✅ 不校验合法域名

### 3. 清除编译缓存

遇到代码修改不生效时：

```
菜单栏 → 运行 → 运行到小程序模拟器 → 微信开发者工具
```

如果仍有旧代码，手动操作：

1. 关闭微信开发者工具
2. 删除 `unpackage/dist/build/mp-weixin/` 目录
3. 重新运行

### 4. 修改服务器地址

如需修改服务器地址，编辑 [utils/score-storage.js](file:///g:/HBuilderProjects/FlipinBeat/utils/score-storage.js) 第 7 行：

```javascript
const SERVER_BASE = 'http://your-server-ip:1092'
```

### 5. 云打包发布 APP

```
菜单栏 → 发行 → 原生App-云打包
```

- Android: 选择使用公共测试证书（测试阶段）
- iOS: 需上传开发证书

---

## 服务器部署

### 方式一：一键脚本部署（推荐）

将 `server/` 目录上传到 CentOS 服务器后执行：

```bash
cd /path/to/server
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：安装 Node.js 18 → 创建目录 → 安装依赖 → screen 后台启动 → 生成信息文件。

### 方式二：手动部署

```bash
# 1. 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 2. 创建目录并复制文件
sudo mkdir -p /opt/flipinbeat-server/data/scores
sudo cp server.js package.json /opt/flipinbeat-server/

# 3. 安装依赖
cd /opt/flipinbeat-server
sudo npm install --production

# 4. 启动服务
screen -dmS flipinbeat bash -c 'cd /opt/flipinbeat-server && FLIPINBEAT_KEY="FlipinBeat2026SecretKey32Bytes!!" node server.js'
```

### 常用运维命令

| 操作 | 命令 |
|------|------|
| 进入后台查看日志 | `screen -r flipinbeat` |
| 退出后台（保持运行） | `Ctrl+A` 然后按 `D` |
| 停止服务 | `screen -S flipinbeat -X quit` |
| 重启服务 | `screen -S flipinbeat -X quit && screen -dmS flipinbeat bash -c 'cd /opt/flipinbeat-server && FLIPINBEAT_KEY="FlipinBeat2026SecretKey32Bytes!!" node server.js'` |
| 健康检查 | `curl http://localhost:1092/api/health` |
| 查看部署信息 | `cat /opt/flipinbeat-server/information.txt` |

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/upload` | POST | 上传 PDF（AES-256-GCM 加密存储） |
| `/api/download/:id` | GET | 下载并解密 PDF |
| `/api/list` | GET | 获取乐谱列表 |
| `/api/score/:id` | DELETE | 删除乐谱 |
| `/api/health` | GET | 健康检查 |

---

## 平台适配说明

### 条件编译对照表

| 功能 | H5 | APP-PLUS | MP-WEIXIN |
|------|:--:|:--------:|:---------:|
| PDF 渲染 | renderjs + Canvas | renderjs + Canvas | `uni.openDocument` |
| 节拍器音频 | Web Audio API | InnerAudioContext 池 | InnerAudioContext 池 |
| 文件导入 | `<input type="file">` | Android Intent | `uni.chooseMessageFile` |
| PDF 翻页动画 | ✅ 3D rotateY | ✅ 3D rotateY | ❌ 微信原生查看器 |
| 双指缩放 | ✅ | ✅ | ❌ 微信原生查看器 |

### 关键适配点

1. **pdf.js 位置**：`static/app-plus/pdf.min.js`（仅 APP 端加载，避免微信编译器解析 `globalThis`/`??=` 报错）

2. **renderjs 条件编译**：`<!-- #ifndef MP-WEIXIN -->` 包裹 renderjs `<script>` 块，微信小程序自动剥离

3. **节拍器音频**：
   - H5：`window.AudioContext` 振荡器（支持 4 种音色频率）
   - APP/小程序：3 个 `InnerAudioContext` 实例预加载轮换（`obeyMuteSwitch = false`）

4. **微信小程序域名**：
   - 开发阶段：勾选「不校验合法域名」
   - 正式发布：需在微信公众平台配置合法域名（必须 HTTPS）

---

## 常见问题

### Q: 微信小程序白屏？

**A:** 检查步骤：
1. 删除 `unpackage/dist/build/mp-weixin/` 目录
2. 重新编译运行
3. 打开微信开发者工具 Console 查看错误信息

### Q: 节拍器没有声音？

**A:** 按平台排查：
- **微信小程序**：确认 `/static/click1.wav` 文件存在；查看 Console 是否有 `Beat audio error`
- **H5**：确认浏览器未静音；Chrome 需用户交互后才能播放音频（点击播放按钮即可）
- **APP**：确认设备未静音

### Q: PDF 打不开？

**A:** 按平台排查：
- **微信小程序**：确认服务器正常运行（`curl http://49.232.71.68:1092/api/health`）；确认勾选了「不校验合法域名」
- **APP/H5**：查看 Console 是否有 `PDF load failed` 错误

### Q: 修改代码后不生效？

**A:** 清除缓存：
1. HBuilderX 菜单 → 运行 → 清除编译缓存
2. 手动删除 `unpackage/dist/` 目录
3. 重新编译

### Q: 服务器上传的 PDF 在哪？

**A:** 加密存储在服务器 `/opt/flipinbeat-server/data/scores/` 目录，文件以 `.enc` 后缀存储，即使服务器被入侵也无法直接读取 PDF 内容。

---

<div align="center">

**FlipinBeat v1.0.0**

Made with uni-app

</div>
