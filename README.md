# Seed × TLG Linker — Japan On‑the‑Ground Support (静的HTML + サーバーレスAPI)

**やりたいこと**：フロント（`index.html`）からAIに問い合わせたいが、**APIキーは隠す**。  
**解決**：Vercelのサーバーレス関数 `/api/gemini` にキーを置き、フロントはそこだけを叩く。

---

## フォルダ構成
```
seed-linker-site/
├─ index.html            # あなたの公開ページ（静的）
├─ api/
│  └─ gemini.js         # サーバーレス関数（APIキーは環境変数で保持）
├─ .env.example         # 環境変数のサンプル（キーはここには書かない）
├─ package.json         # Vercel開発用スクリプト
├─ vercel.json          # (任意) Vercel設定
└─ .gitignore
```

## 手順（最短ルート）
### 1) ダウンロード→GitHubへアップロード
1. このプロジェクト一式をダウンロードして解凍。  
2. GitHubで新規リポジトリを作成し、ファイルをアップロード（またはローカルで `git push`）。

### 2) Vercelでデプロイ
1. https://vercel.com にログイン → **Add New… → Project** → GitHubのリポジトリを選択。  
2. **Environment Variables** に `GEMINI_API_KEY` を追加（Google AI Studioで取得したキーを貼る）。  
3. **Deploy** を押す。  
4. デプロイ後に表示されるURL（例：`https://your-project.vercel.app`）が公開URL。  
   - `https://your-project.vercel.app` → フロントページ（`index.html`）  
   - `https://your-project.vercel.app/api/gemini` → バックエンド（サーバーレスAPI）

> キーは**Vercelの環境変数にだけ**保存され、GitHubに漏れません。フロント側のHTMLには一切載りません。

### 3) 動作確認
- ブラウザで公開URLを開く。  
- 「✨ Get Dinner Recommendations」などを押して、モーダルでプロンプトを入力→**Generate**。  
- 画面は `/api/gemini` を叩き、Geminiの返答を表示します。

---

## よくある質問

### Q. Netlifyや他の環境でも使える？
はい。考え方は同じで、**フロントは `/api/...` を叩く**、**APIキーはサーバ側の環境変数**。  
（Netlify Functionsなら `netlify/functions/gemini.js` に置けばOK）

### Q. ローカルでテストしたい
- Vercel CLIを使う方法：
  ```bash
  npm i -g vercel
  vercel login
  vercel dev
  ```
  `.env` に `GEMINI_API_KEY=...` を入れておくと、ローカルでも `/api/gemini` が動きます。

### Q. セキュリティ上の注意
- APIキーは絶対に `index.html` に書かない。  
- 返答を `innerHTML` に入れる前に**サニタイズ**（本プロジェクトではクライアント側で最低限のホワイトリスト処理を実装）。
- さらに厳密にやるなら、サーバ側でホワイトリストHTMLを生成し、JSONで返す方式に切り替えるのがベスト。

---

## 編集ポイント
- Teamsリンクは `index.html` の該当 `href` を必要に応じて差し替え。  
- 施設の日本語住所は `index.html` 末尾の `facilityData` に追記可能。

以上。**GitHubに上げてVercelで環境変数を設定→Deploy** だけで、APIキーを隠したまま動きます。
