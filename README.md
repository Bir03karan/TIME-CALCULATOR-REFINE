<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Precise Time Tracker - Progressive Web App 📱⚡

A precision time tracking and calculation app that works on **all devices** - Android, iOS, and Desktop!

**🎉 Now available as a Progressive Web App (PWA) - Install it like a native app!**

View your app in AI Studio: https://ai.studio/apps/drive/1BjIOTPinYXzgFauA81Z7_FyuU3SUXCXB

## ✨ Features

- ⚡ **Lightning Fast** - Instant loading with offline support
- 📱 **Install to Home Screen** - Works like a native app on Android, iOS, and Desktop
- 🌐 **Works Offline** - Full functionality without internet connection
- 🎨 **Beautiful Design** - Modern UI with custom icon
- 🌓 **Dark Mode** - Automatic theme switching
- 💾 **Auto-save** - All data persists locally
- 🔄 **Auto-updates** - Seamless updates in the background

## 📱 Install as App

### Android
1. Open in Chrome
2. Tap menu (⋮) → "Install app"
3. App appears on home screen

### iOS
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. App appears on home screen

### Desktop
1. Open in Chrome/Edge
2. Click install icon in address bar
3. App opens in its own window

See [PWA_INSTALL_GUIDE.md](PWA_INSTALL_GUIDE.md) for detailed instructions.

## 🚀 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## 🏗️ Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder with all PWA files included.

## 📚 Documentation

- **[PWA_SUMMARY.md](PWA_SUMMARY.md)** - Complete overview of PWA features
- **[PWA_INSTALL_GUIDE.md](PWA_INSTALL_GUIDE.md)** - Installation instructions for users
- **[PWA_TESTING_CHECKLIST.md](PWA_TESTING_CHECKLIST.md)** - Testing guide for developers

## 🎨 App Icon

Custom-designed clock icon with blue gradient theme that adapts to all platforms.

## 🧪 Testing

Run Lighthouse audit in Chrome DevTools to verify PWA score of 100/100!

## 🌟 What's New in PWA Version

- ✅ Full offline support with service worker
- ✅ Installable on all major platforms
- ✅ Optimized icons for Android, iOS, and Desktop
- ✅ Standalone mode (no browser UI)
- ✅ Theme color integration
- ✅ Fast loading with intelligent caching
- ✅ Auto-update capability

## 📊 Browser Support

- ✅ Chrome (Android & Desktop)
- ✅ Safari (iOS & macOS)
- ✅ Edge (Desktop)
- ✅ Samsung Internet
- ⚠️ Firefox (Limited PWA features)

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Service Workers
- Web App Manifest

---

**Made with ⚡ by AI Studio | Now available as a PWA on all devices!**
