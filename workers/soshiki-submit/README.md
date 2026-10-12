# 組織共済 WEB 受付 Worker（`soshiki-submit`）

Cloudflare Worker が GitHub Pages フォームからの POST を受け、Microsoft Graph で OneDrive に **JSON** を保存し、続けて **受付確認メール**（Graph `sendMail`・PDF 添付なし）を送ります。

仕様の正: [`docs/soshiki-form-submit-worker-graph.md`](../../docs/soshiki-form-submit-worker-graph.md)  
**事務用 PDF** は事務 PC（Graph delta または OneDrive 同期 + Inbox）。`pdfBase64` は **受け付けません**。

## 前提

- **Node.js LTS**（`node` / `npm` が PowerShell で通ること）。未導入例: `winget install OpenJS.NodeJS.LTS` → **ターミナルを開き直して** `node -v` を確認
- Wrangler は **グローバル不要**（本ディレクトリの `npm install` で `node_modules` に入る）
- Cloudflare API トークン: 環境変数 `CLOUDFLARE_API_TOKEN`（Windows ユーザー環境変数推奨）
- Entra アプリ登録・`Files.ReadWrite.All` と **`Mail.Send`** の管理者同意済み（手動で Graph 書き込み・送信確認済み想定）

## 初回セットアップ

```powershell
cd workers/soshiki-submit
npm install
```

### Secrets（値は GitHub に載せない）

各コマンド実行後、プロンプトで値を入力（貼り付け）します。

```powershell
wrangler secret put AZURE_TENANT_ID
wrangler secret put AZURE_CLIENT_ID
wrangler secret put AZURE_CLIENT_SECRET
wrangler secret put GRAPH_DRIVE_USER_ID
wrangler secret put GRAPH_BASE_PATH
wrangler secret put SOSHIKI_SUBMIT_PASSWORD
```

| Secret | 内容 |
|--------|------|
| `AZURE_TENANT_ID` | Entra ディレクトリ（テナント）ID |
| `AZURE_CLIENT_ID` | アプリのクライアント ID |
| `AZURE_CLIENT_SECRET` | クライアント シークレット |
| `GRAPH_DRIVE_USER_ID` | OneDrive 所有者のオブジェクト ID |
| `GRAPH_BASE_PATH` | 例: `組織共済WEB受付` |
| `SOSHIKI_SUBMIT_PASSWORD` | Web 送信用パスワード（事務と共有） |
| `GRAPH_MAIL_USER_ID`（任意） | `sendMail` の送信元ユーザー ID。省略時は `GRAPH_DRIVE_USER_ID` |
| `SOSHIKI_SKIP_RECEIPT_MAIL`（任意） | `1` のとき受付確認メールを送らない（json 保存のみ） |

OneDrive の `設定/soshiki-form-office-settings.json`（`FromEmail`・`AdminEmail`）と `設定/union-contacts.json`（`ManagerEmail`）を Worker が読みます（`SoshikiFormReceiptMail.ps1` 同等の文面）。

### レスポンス

成功時: `{ "ok": true, "receiptId": "…", "mailSent": true|false }`  
メール失敗時も Web は成功表示のみ（申込者向けにメール障害は出さない）。事務向けは管理者 Graph メール（`FailureStage: ReceiptMail`）と Cloudflare ログ。

### デプロイ

```powershell
wrangler deploy
```

または:

```powershell
.\deploy.ps1
```

表示された URL（例: `https://soshiki-submit.<account>.workers.dev`）を、リポジトリ直下の  
`data/soshiki-form-submit-config.json` の `submitEndpointUrl` に設定します。

## CORS

許可オリジン: `https://keijirodokyosai.github.io` のみ。

## 再デプロイ

コード変更後:

```powershell
cd workers/soshiki-submit
wrangler deploy
```

Secret の変更時は該当する `wrangler secret put` だけ再実行（デプロイ不要でも反映されますが、念のため deploy してもよい）。
