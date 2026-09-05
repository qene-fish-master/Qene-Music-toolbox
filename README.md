# 青魚工具箱 🐟

一個以「青魚」為主題的 PWA 工具箱，主打**影片／音檔背景播放**，另外附上工具商店、計時器與隨手記等小工具。

## 功能

### 🎧 背景播放器（主功能）
- 點一下或拖曳，匯入多個影片／音檔（存在裝置的 IndexedDB，重新整理頁面也不會不見）
- 兩種播放模式，可自由切換：
  - **背景播放**：離開分頁、鎖螢幕、切到其他 App，聲音仍會繼續播放；並透過 Media Session API 在鎖定畫面／通知列顯示播放資訊與上一首／播放暫停／下一首控制。
  - **卡拉OK模式**：畫面保持開啟並鎖定螢幕不熄滅（Wake Lock），影片維持顯示，適合跟著唱；切到背景會自動暫停並提醒。
- 可開關「循環播放」，播完清單自動從頭開始
- 播放清單可刪除單曲、顯示目前播放中的曲目

### 🛍️ 工具商店
一個「輸入代碼解鎖才能下載」的小工具商店，每個工具都是**獨立的單一 HTML 檔案**，解鎖後可直接下載，下載下來的檔案雙擊就能開啟使用，不需要安裝、不需要網路。

已解鎖紀錄存在瀏覽器的 localStorage，同一台裝置下次再開不用重新輸入代碼。

> ⚠️ 這是純前端的「趣味代碼鎖」，代碼直接寫在 `js/store.js` 裡，適合自用或分享給朋友的兌換小遊戲，**不是**真正的付費或安全機制（懂技術的人打開原始碼就看得到代碼）。想換代碼，直接編輯 `js/store.js` 裡 `STORE_ITEMS` 每個項目的 `code` 欄位即可。

目前上架的 6 個工具與代碼：

| 工具 | 說明 | 代碼 |
|---|---|---|
| 🍅 番茄鐘 | 25 分鐘專注／5 分鐘休息，含循環與提示音 | `AOYU-TOMATO` |
| 🌊 海浪白噪音 | 白噪音／粉紅噪音／海浪聲／雨聲，可混音 | `AOYU-WAVE` |
| 🎲 骰子＆抽籤 | 擲骰子，或貼上名單抽一個 | `AOYU-DICE` |
| 🔐 密碼產生器 | 自訂長度與字元組合，一鍵複製 | `AOYU-LOCK` |
| 📏 單位換算器 | 長度／重量／溫度快速換算 | `AOYU-UNIT` |
| ⚖️ BMI 小算盤 | 輸入身高體重看 BMI 區間 | `AOYU-BMI` |

代碼不分大小寫。

### ⏱️ 計時器
常用分鐘數快選或自訂分鐘數，時間到會用音效＋震動提醒（音效用 Web Audio API 即時產生，不需外部檔案）。

### 📝 隨手記
簡單的文字筆記，存在瀏覽器的 localStorage。

## 如何使用

1. 解壓縮這個 zip
2. 這是純前端專案（沒有後端），需要用**本機伺服器**開啟（不能直接雙擊 index.html，否則 Service Worker／IndexedDB 可能無法正常運作）：

   ```bash
   # 在專案資料夾內執行，任選一種
   python3 -m http.server 8080
   # 或
   npx serve .
   ```

   然後用瀏覽器開啟 `http://localhost:8080`

3. 想安裝成 App：在瀏覽器選單點「加入主畫面」或網址列的安裝圖示即可。

## 部署到正式環境

把整個資料夾放到任何支援 HTTPS 的靜態網站託管（GitHub Pages、Vercel、Netlify、Cloudflare Pages 都可以）即可。**PWA 的 Service Worker 與部分背景播放特性需要 HTTPS（或 localhost）才能運作**。

## 技術重點 / 已知限制

- 背景播放利用瀏覽器原生的音訊播放機制與 Media Session API；實際能否在鎖屏下持續播放，會依裝置與瀏覽器（iOS Safari／Android Chrome）而略有差異，建議先在目標裝置實測。
- 卡拉OK模式的螢幕防熄滅（Wake Lock API）目前主要在 Chrome／Edge／較新版 Safari 支援；不支援的瀏覽器會自動略過，不影響其他功能。
- 影音檔案是存在使用者裝置本機的 IndexedDB，不會上傳到任何伺服器。
- 圖示為單色系向量魚形，之後可自行替換 `icons/` 內的 PNG 成喜歡的圖案（記得同時更新 `manifest.json` 裡的尺寸設定）。

## 檔案結構

```
aoyu-toolbox/
├─ index.html          # 首頁（工具箱）
├─ player.html         # 背景播放器／卡拉OK模式
├─ timer.html          # 計時器
├─ notes.html          # 隨手記
├─ store.html          # 工具商店（代碼解鎖下載）
├─ tool-pomodoro.html  # 【商店】番茄鐘（獨立檔案）
├─ tool-noise.html     # 【商店】海浪白噪音（獨立檔案）
├─ tool-dice.html      # 【商店】骰子＆抽籤（獨立檔案）
├─ tool-password.html  # 【商店】密碼產生器（獨立檔案）
├─ tool-unit.html      # 【商店】單位換算器（獨立檔案）
├─ tool-bmi.html       # 【商店】BMI 小算盤（獨立檔案）
├─ manifest.json       # PWA 設定
├─ sw.js               # Service Worker（離線快取 App 外殼）
├─ css/style.css       # 共用主題樣式
├─ js/
│  ├─ app.js           # 共用邏輯（SW 註冊、toast）
│  ├─ db.js            # IndexedDB 影音檔儲存
│  ├─ player.js        # 播放器核心邏輯
│  ├─ timer.js         # 計時器邏輯
│  ├─ notes.js         # 隨手記邏輯
│  └─ store.js         # 工具商店邏輯（代碼清單在這裡）
└─ icons/              # PWA 圖示
```
