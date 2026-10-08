# 組織共済 WEB 受付 Worker（`soshiki-submit`）

Cloudflare Worker が GitHub Pages フォームからの POST を受け、Microsoft Graph で OneDrive に **JSON のみ** 保存します。

仕様の正: [`docs/soshiki-form-submit-worker-graph.md`](../../docs/soshiki-form-submit-worker-graph.md)  
**事務用 PDF・返信メール**は Worker 外（同 doc **§13**・`docs/soshiki-form-enter.md` §5.10.1）。`pdfBase64` は **受け付けません**。

## 前提

- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) が使える（`npm install -g wrangler` または本ディレクトリで `npm install`）
- Cloudflare API トークン: 環境変数 `CLOUDFLARE_API_TOKEN`（Windows ユーザー環境変数推奨）
- Entra アプリ登録・`Files.ReadWrite.All` 管理者同意済み（手動 C で Graph 書き込み確認済み想定）

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
