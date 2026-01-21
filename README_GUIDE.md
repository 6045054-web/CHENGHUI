
# 🚀 成汇监理 App 打包保姆级教程

如果你想把这个系统安装到手机上，请按照以下步骤操作：

### 1. 环境准备 (只需做一次)
- 安装 [Node.js](https://nodejs.org/)
- 安装 [Android Studio](https://developer.android.google.cn/studio/)
- 在 Android Studio 里安装 **SDK Platform 34** 和 **Build Tools**

### 2. 获取代码并打包
1. 将本项目所有代码下载到你的电脑文件夹。
2. 打开电脑的“终端”或“命令提示符” (CMD)，进入该文件夹。
3. 输入以下命令并回车：
   ```bash
   npm run app:debug
   ```
4. 命令运行完后，Android Studio 会自动启动。

### 3. 生成安装包 (APK)
1. 在 Android Studio 里，等右下角的进度条（Gradle Sync）跑完。
2. 点击顶部菜单：**Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**。
3. 稍等片刻，点击右下角弹窗里的 **locate**。
4. 文件夹里的 `app-debug.apk` 就是你的手机安装包了！

### 4. 如何上架？
上架国内商店（华为、小米、OPPO 等）需要：
1. **软著**：计算机软件著作权登记证书。
2. **ICP 备案**：App 需要进行联网备案。
3. **签名证书**：在 Android Studio 里使用 `Generate Signed Bundle/APK` 生成正式版。

**遇到任何报错，请直接截图问我！**
