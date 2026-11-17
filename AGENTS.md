# AGENTS.md

年金のしくみ：架空の人の場面（学生・会社員・自営業・会社員の配偶者・パートなど）から、国民年金の第何号かを当てる1日5問の学習ゲーム。正解したら2段目で「保険料の払い方」「入る年金」「届け出の先」「合う制度」のどれかも選ぶ。`index.html` と `data.js`（問題の種類）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（27種類×3000問：第何号と2段目の答えが資料の表どおり・出典・金額を出さない）・今日の5問と上級（3年分）・とことん・通しで遊ぶ・続きから・2段目・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 中身は日本年金機構のページ（`data.js` の `SRC`）で確かめたことだけ（2026-11-17 に読んだ）。種類を足すときもページを読み、`src` に出典を付け、`qa/run.mjs` の `TB`（別に書いた資料の表）にも足す。
- 保険料・年金の金額は年ごとに変わるので、答えにも問題にも出さない（QA が見る）。給与明細よみ（kyuyo-meisai：天引きの額）・お金のきほん（okane-kihon）と重ねず、制度のしくみだけを扱う。
- 年金の相談にしない：遊び方と「このゲームについて」と README に、年金の相談・公式の情報の代わりではないこと、年金事務所・ねんきんダイヤルを置く（QA が見る）。
- 人はすべて架空で、性別を決めない名前に「さん」。配偶者は「配偶者」と書き、家のことを性別で決めない。
- 1段目は第1号〜第3号の3つ（並びは固定）。2段目は種類ごとの聞き方（`asks`）から1つで、選び肢は3つ（合う制度は5つから3つ）。2回目のヒントはちがう答えを1つ消す。
- 今日の5問（やさしい → やさしい → ふつう → ひねり → まとめ、種類は重ねない）・上級（ひねり3、今日のひねりと別）は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。乱数は `sort` の比較の中で引かない。`KINDS`・言い回し・名前の並びは最後に足すだけ（QA の `PIN` が第1回の1問目を見る）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。とことん（`runs.e`）はまちがえても続き、「ここで降りる」で終わる。
- 1問を深くする：`depth.js` と `qa/depth-check.mjs` は shared-workflows `template/` の写しで、ここでは直さない。自信あり・2段目・復習（1→3→7日後）。記録 `nenkin-v1`・文字 `nenkin-fs`・復習 `nenkin-depth`。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない。感想は Issue フォーム（`.github/ISSUE_TEMPLATE/feedback.yml`）を開くだけ。応援は Ko-fi へのただのリンクだけ。
- 外へ通信しない（CSP の `connect-src 'self'` を広げない）。見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）と引き継ぎ（`transfer.js`・`qa/transfer-check.mjs`）は shared-workflows `template/` の写しで、ここでは直さない。
- 画面の土台は眠りのコツ（nemuri-kotsu）から写した。写し元の言葉が残っていないかを QA が見る。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
