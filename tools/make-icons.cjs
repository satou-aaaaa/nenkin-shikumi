// アプリのアイコン（icon-192.png・icon-512.png）を作る。2階建ての年金（1階：国民年金・2階：厚生年金）を積み木で。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#f3efe4"/>
      <polygon points="50,10 84,32 16,32" fill="#b23a24"/>
      <rect x="24" y="34" width="52" height="22" rx="3" fill="#1f4f7a"/>
      <rect x="16" y="60" width="68" height="26" rx="3" fill="#123554"/>
      <text x="50" y="51" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" font-family="sans-serif">2</text>
      <text x="50" y="80" text-anchor="middle" font-size="18" font-weight="900" fill="#fff" font-family="sans-serif">1</text></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
