# 独自ドメイン公開後の作業（Worker・Search Console）

**正規 URL:** `https://keijirodokyosai.org`  
**前提:** [`custom-domain-setup.md`](custom-domain-setup.md) の DNS・GitHub Pages・HTTPS が完了している。

**関連:** DNS・メール共存は [`m365-tenant-and-mail.md`](m365-tenant-and-mail.md) §3・§7。Worker 仕様は [`soshiki-form-submit-worker-graph.md`](soshiki-form-submit-worker-graph.md)。

---

## 運用状況（2026-10-24）

| 項目 | 状態 |
|------|------|
| Worker `deploy.ps1`（CORS `.org`） | 本番デプロイ済み |
| Search Console プロパティ `https://keijirodokyosai.org` | 所有権確認済み（HTML ファイル） |
| サイトマップ `sitemap.xml` | 送信済み・**成功**（19 URL） |
| トップ URL ライブテスト | インデックス登録可能・リクエスト済み |
| 検索結果への反映 | クロール待ち（数日〜数週間） |

---

## 1. Cloudflare Worker の再デプロイ（組織共済フォーム）

`.org` からブラウザが POST すると `Origin` は `https://keijirodokyosai.org` になる。Worker の CORS 許可リストは `workers/soshiki-submit/src/index.js`。**本番へ `wrangler deploy` しないと反映されない。**

### 1.1 準備

| 項目 | 内容 |
|------|------|
| Node.js LTS | `npm` が使えること |
| Cloudflare API トークン | 環境変数 **`CLOUDFLARE_API_TOKEN`**（値は GitHub に載せない） |
| Secrets | 初回以外は不要。既に本番稼働済みならそのまま |

### 1.2 API トークン作成（再発行時）

1. [Cloudflare](https://dash.cloudflare.com/) → **My Profile** → **API Tokens** → **Create Token**。
2. **Edit Cloudflare Workers** → **Use template**。
3. **Account Resources:** Include → 当該アカウント（表示名が旧メールのままのことがある）。
4. **Zone Resources** で「Choose a zone resource」エラー → 中央を **All zones** にするか、**Create Custom Token** で **Account → Workers Scripts → Edit** のみ（Zone 行なし）。
5. 表示されたトークン文字列をコピー。**説明文や括弧を `$env:CLOUDFLARE_API_TOKEN` に入れない。**

### 1.3 デプロイ手順（Windows PowerShell）

```powershell
$env:CLOUDFLARE_API_TOKEN = "（Cloudflare からコピーしたトークン1行のみ）"

cd "C:\Users\deus_\OneDrive\GitHub\keijirodokyosai.github.io\workers\soshiki-submit"
.\deploy.ps1
```

成功時: `Deployed soshiki-submit` と `https://soshiki-submit.kjkyosaikai.workers.dev`。

### 1.4 フォーム動作確認

1. `https://keijirodokyosai.org/soshiki-form-enter.html` でテスト送信。
2. `Origin not allowed` → デプロイ未反映。`パスワードが正しくありません` → CORS は通過。

移行期間は `https://keijirodokyosai.github.io` からの送信も許可。不要になったら `github.io` をコードから外して再 deploy。

---

## 2. Google Search Console

### 2.1 プロパティ

- **URL プレフィックス:** `https://keijirodokyosai.org`
- ログインは **継続利用する Google アカウント**を事務で記録（`info@` は M365 のため Google ログイン用ではないことが多い）。

### 2.2 所有権の確認（本番: HTML ファイル）

1. Search Console が指定する **`google*.html`** をダウンロード。
2. リポジトリ **ルート**に配置（`index.html` と同じ階層）。**2026-10-24 時点のファイル名:** `googlea6db66c4e2f6a7d0.html`
3. `main` に push → `https://keijirodokyosai.org/googlea6db66c4e2f6a7d0.html` が開けることを確認 → Search Console で **確認**。
4. **確認後もファイルを削除しない。**

**代替:** HTML タグ（`_layouts/base.html`）または DNS TXT（メール用 TXT は削除せず **追加**）。

### 2.3 サイトマップ

1. **サイトマップ** → 送信: `sitemap.xml`（またはフル URL）。
2. 送信直後 **「取得できませんでした」** でも、ブラウザで `https://keijirodokyosai.org/sitemap.xml` が XML なら **数時間待ち or 再送信**で **成功**になり得る（2026-10-24: 19 ページ検出）。

### 2.4 URL 検査（トップ）

1. `https://keijirodokyosai.org/` → **公開 URL をテスト** → **インデックス登録をリクエスト**（1 日 1 回程度で十分）。
2. 「URL が Google に登録されていません」は新規プロパティでは普通。リクエスト後 **数日〜2 週間**待つ。

### 2.5 旧 `github.io`

- 別プロパティ `https://keijirodokyosai.github.io` は任意。canonical は `.org`。

### 2.6 期待

| 項目 | 目安 |
|------|------|
| サイトマップ「成功」 | 数時間〜1 日 |
| `site:keijirodokyosai.org` | インデックス後 |
| 検索結果の URL・サイト名 | 数日〜数週間（保証なし） |

---

## 3. QR コード（印刷物）

`scripts/generate-qr-codes.py` は `.org` URL。差し替え時:

```powershell
cd "C:\Users\deus_\OneDrive\GitHub\keijirodokyosai.github.io"
python scripts/generate-qr-codes.py
```

---

## チェックリスト（初回構築）

- [x] Worker `deploy.ps1` 成功（2026-10-24）
- [x] Search Console 所有権（HTML ファイル）
- [x] サイトマップ送信・成功（19 URL）
- [x] トップ URL ライブテスト・インデックス登録リクエスト
- [ ] フォーム本番テスト（組合・運用ルールに従い随時）
- [ ] パンフ・QR の URL を `.org` に差し替え（未更新分のみ）
