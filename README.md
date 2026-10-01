# 一封生日書信，附可查看及修改的邀約回覆表單。

公開網站：https://vansonlin81.github.io/small-project/

## 網站檔案

根目錄的 `index.html`、JavaScript、CSS、圖片與字型是可直接發布的靜態網站。GitHub Pages 使用 `main` 分支的 `/ (root)` 目錄。

完整 React 原始碼、建置設定、相依套件 lockfile 與後端程式參考，收在 `site-source.zip`。解壓縮後使用 Node.js 22.12 以上版本執行 `npm ci`、`npm run dev`；`npm run build` 會產生 `docs/`。更新本 repository 的發布檔案時，將 `docs/assets/` 裡的 JS 與 CSS 放到根目錄，並將 `docs/index.html` 中的 `/small-project/assets/` 改成 `/small-project/`。

## 回覆與通知

GitHub Pages 提供信件畫面；回覆透過原本網站的 `/api/reply` 儲存到同一份資料庫，因此可重新查看或修改。後端網站 https://october-letter-for-you.v0900173978.chatgpt.site/ 需要持續運作。

Gmail 通知沿用已設定的自動化，不在瀏覽器寄信。repository 不包含資料庫回覆、憑證或環境變數。

## 字型授權

使用 LXGW WenKai TC 與 Noto Serif TC 的字型子集，授權文字見 `LXGW-WenKai-TC-OFL.txt` 與 `Noto-Serif-TC-OFL.txt`。
