# 組織共済 WEB 受付 — 受付確認メール（本番運用）

**目的:** Web 送 信後の **受付確認メール**（Graph `sendMail`）の構成・確認手順・障害時の切り分けを1本にまとめる。  
**関連:** `docs/soshiki-form-submit-worker-graph.md` §6・§13.4、`docs/soshiki-m365-accounts.md`、`workers/soshiki-submit/README.md`。

**状態（2026-10-24）:** **本番稼働**。GitHub Pages → Worker → OneDrive **json** 保存 → **受付確認メール**（To: `union-contacts` の `ManagerEmail`、BCC: `FromEmail`）を **2026-10-24** のテスト送 信で確認済み。

---

## 1. 経路（採用済み）

| 段階 | 内容 |
|------|------|
| Web | `soshiki-form-enter.html` → `js/soshiki-form-submit.js` → POST `data/soshiki-form-submit-config.json` の Worker URL |
| Worker | OneDrive に `.json` PUT 後、`receiptMail.js` が Graph **`/users/{id}/sendMail`** |
| 宛先 To | OneDrive `設定/union-contacts.json` — `KyosaikaiCode` 照合の **`ManagerEmail`** |
| 控え BCC | `設定/soshiki-form-office-settings.json` の **`FromEmail`**（`info@keijirodokyosai.org`） |
| 差出人表示 | **admin** のメールボックス経由。Exchange **プライマリ SMTP = `info@`**（`docs/m365-tenant-and-mail.md`） |
| 申込者 UI | json 保存成功時は **送信成功のみ**（`mailSent: false` でもメール障害は表示しない） |
| 送信失敗時 | **`AdminEmail`** に Graph アラート（`FailureStage: ReceiptMail`）＋ Cloudflare ログ |

**採用しない:** 事務 Inbox からの自動メール（二重送信防止）。手動・再送は `Send-SoshikiFormReceiptEmail.ps1`（`-Send`）。

---

## 2. M365・Worker 前提

| 項目 | 内容 |
|------|------|
| ライセンス | **Business Standard ×1** → **admin**（Exchange メールボックスあり） |
| 対外窓口 | **`info@keijirodokyosai.org`**（admin のエイリアス・プライマリ SMTP） |
| OneDrive | **admin** 配下の **`組織共済WEB受付`**（`GRAPH_BASE_PATH`） |
| Entra アプリ | `組織共済WEB受付` — **`Files.ReadWrite.All`** + **`Mail.Send`（アプリケーション）** 管理者同意済み |
| Worker URL | `https://soshiki-submit.kjkyosaikai.workers.dev`（`data/soshiki-form-submit-config.json`） |
| `GRAPH_DRIVE_USER_ID` | **admin** のオブジェクト ID（OneDrive 所有者・sendMail ユーザー。`GRAPH_MAIL_USER_ID` 未設定時は同一） |

**注意:** `GRAPH_DRIVE_USER_ID` が Exchange のないユーザーだと `sendMail` は **`MailboxNotEnabledForRESTAPI`（404）** になる。`FromEmail` は **`info@keijirodokyosai.org`** にすること（旧 `kjkyosaikai@msn.com` はテナント外のため BCC 用設定としても不適切）。

---

## 3. OneDrive 設定ファイル

| ファイル | 必須フィールド | 役割 |
|----------|----------------|------|
| `設定/soshiki-form-office-settings.json` | **`FromEmail`** | BCC・事務控え（`info@keijirodokyosai.org`） |
| 同上 | **`AdminEmail`** | メール送信失敗の Graph 通知先（本番運用で事務用アドレスに揃える推奨） |
| `設定/union-contacts.json` | **`KyosaikaiCode`**, **`ManagerEmail`** | 受付確認の To |

JSON 形・export 手順: `docs/soshiki-form-enter.md` §5.10（union-contacts）。

---

## 4. 本番確認チェックリスト

- [x] admin に Exchange（Business Standard）・**`info@` プライマリ SMTP**
- [x] admin OneDrive に **`組織共済WEB受付/設定/`**（上記2 json）
- [x] **`FromEmail`** = `info@keijirodokyosai.org`
- [x] Cloudflare Secrets（`AZURE_*`, `GRAPH_DRIVE_USER_ID`, `GRAPH_BASE_PATH`, `SOSHIKI_SUBMIT_PASSWORD`）
- [x] 本番サイトからテスト送 信 — **json 保存**・担当 **`ManagerEmail` 受信**・**`info@` BCC**
- [ ] **`AdminEmail`** を障害通知用に最終確定（任意だが推奨）
- [ ] 事務 **Graph Inbox / PDF** 本番タスク（メールは Worker のみ — `docs/soshiki-form-submit-worker-graph.md` §13）

---

## 5. 動作確認手順

1. 事務 PC で `cd workers/soshiki-submit` → `npx wrangler tail`（ログ待ち）
2. [組織共済申込書（入力）](https://keijirodokyosai.github.io/soshiki-form-enter.html) でテスト組合を選び送 信
3. 成功画面の **受付 ID**、OneDrive `受付/{月}/json/` の新規ファイル
4. ネットワーク（Fetch/XHR）の Worker **POST 応答**: `"mailSent": true`（メール届いていれば実質 OK）
5. tail に `Receipt mail failed` / `sendMail:` が無いこと

テストのみメール省略: Secret **`SOSHIKI_SKIP_RECEIPT_MAIL`** = `1`（json 保存のみ）。

---

## 6. トラブルシュート

| 症状 | 確認 |
|------|------|
| json はあるがメールなし | `wrangler tail` の `sendMail` エラー。`GRAPH_DRIVE_USER_ID` が **admin（Exchange あり）** か |
| `No ManagerEmail for KyosaikaiCode=…` | `union-contacts.json` に該当コードの **`ManagerEmail`** |
| `FromEmail missing` | `soshiki-form-office-settings.json` の **`FromEmail`** |
| 担当に届くが差出人が `admin@` | Exchange で **太字 SMTP が `info@`**（`m365-tenant-and-mail.md` §6） |
| 申込者にエラー表示 | 想定外 — 通常は json 失敗時のみ。メール失敗は **`AdminEmail`** アラート |

---

**最終更新:** 2026-10-24（本番送 信・メール受信確認を反映）
