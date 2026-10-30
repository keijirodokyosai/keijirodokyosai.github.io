# 独自ドメイン公開（`keijirodokyosai.org`）

**正規 URL:** `https://keijirodokyosai.org`（www なし）  
**ホスティング:** GitHub Pages（リポジトリ `keijirodokyosai-web`）  
**初回構築完了:** 2026-10-24

**関連:** メール DNS 共存は [`m365-tenant-and-mail.md`](m365-tenant-and-mail.md) §3・§7。公開後の Worker・Search Console は [`custom-domain-post-setup.md`](custom-domain-post-setup.md)。

---

## 1. リポジトリ側（GitHub Pages）

| ファイル | 役割 |
|----------|------|
| `CNAME` | 1 行 `keijirodokyosai.org` |
| `_config.yml` | `url: "https://keijirodokyosai.org"`、`baseurl: ""` |
| `sitemap.xml` / `robots.txt` | 全 URL・Sitemap 行を `.org` |
| `_layouts/base.html` | `absolute_url` による canonical・OGP・JSON-LD |
| `_includes/breadcrumb-json-ld.html` | パンくず JSON-LD（`breadcrumb_name` 等。フロントマター直書き Liquid は不可） |
| `_includes/index-structured-data.html` / `contact-structured-data.html` | トップ・お問い合わせの JSON-LD（同上） |

GitHub **Settings → Pages**

- **Custom domain:** `keijirodokyosai.org`
- **Enforce HTTPS:** オン（DNS 反映・証明書発行後）

---

## 2. お名前.com DNS（メールは触らない）

**DNSレコード設定**（ネームサーバー `01.dnsv.jp`〜`04.dnsv.jp`）。**MX・SPF・autodiscover は削除しない。**

| 種別 | ホスト | 値 |
|------|--------|-----|
| A | `keijirodokyosai.org`（ルート） | GitHub Pages 用 4 IP（`185.199.108.153` 〜 `111.153`） |
| CNAME | `www.keijirodokyosai.org` | `keijirodokyosai.github.io` |

ホスト名を二重にしない（`keijirodokyosai.org.keijirodokyosai.org` は不可）。ルートは MX と同じ表記（`keijirodokyosai.org`）で A を 4 本追加。

---

## 3. 公開 URL（正規と GitHub ホスト名）

| URL / 名前 | 用途 |
|-----|------|
| `https://keijirodokyosai.org` | **正規**（対外・canonical・sitemap） |
| `keijirodokyosai.github.io` | **DNS の CNAME 先**（GitHub Pages のホスト名。リポジトリ slug とは別） |

リポジトリ名を `keijirodokyosai-web` に Rename したあとも、Custom domain と `CNAME` ファイルで `.org` 公開は継続する。ルート `https://keijirodokyosai.github.io/` を本番 URL として使わない。

組織共済フォームの Worker CORS は **`https://keijirodokyosai.org` のみ**（`workers/soshiki-submit/src/index.js`）。変更後は `deploy.ps1` 必須。

---

## 4. Google Search Console 用ファイル

所有権確認に **HTML ファイル方式**を使用（2026-10-24）。

| ファイル | 注意 |
|----------|------|
| リポジトリ直下 `googlea6db66c4e2f6a7d0.html` | **削除しない**（所有権維持）。`sitemap.xml` には載せない |

公開確認: `https://keijirodokyosai.org/googlea6db66c4e2f6a7d0.html`

---

## 5. Cloudflare（組織共済 Worker のみ）

- サイト DNS はお名前.com。Worker は Cloudflare。
- ダッシュボードログイン: **`info@keijirodokyosai.org`**（2026-10-24  Verified）
- API トークン: **Edit Cloudflare Workers** テンプレート、Account は当該アカウント。Zone で「Specific zone」エラー時は **All zones** またはカスタムトークン（Account → Workers Scripts → Edit のみ）。

---

## 6. 検索まわりの期待

独自ドメインと構造化データにより、検索のサイト名が「GitHub」ではなく組合名寄りになる**可能性**は高いが、反映は **数日〜数週間**。Search Console でサイトマップ・インデックス登録リクエスト済みでも即日変わらない。
