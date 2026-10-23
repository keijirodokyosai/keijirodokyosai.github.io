# 事務局 Microsoft 365・メール（`keijirodokyosai.org`）

**目的:** 京滋労働組合共済会の事務用 M365 テナント、独自ドメイン、事務局メール `info@` の現状を運用者向けに記録する。  
**最終更新:** 2026-10-24（Worker 受付確認メール本番を反映）

**関連:** 組織共済 WEB 受付は [`soshiki-form-submit-worker-graph.md`](soshiki-form-submit-worker-graph.md)。**1ライセンス・admin / `info@` 方針** は [`soshiki-m365-accounts.md`](soshiki-m365-accounts.md)。

---

## 1. テナント概要

| 項目 | 内容 |
|------|------|
| 初期ドメイン | `keijikyosai.onmicrosoft.com` |
| 独自ドメイン | `keijirodokyosai.org`（Microsoft 365 管理センターで **セットアップ完了**） |
| ドメイン登録 | お名前.com |
| DNS 運用 | お名前.com **DNSレコード設定**、ネームサーバー **`01.dnsv.jp`〜`04.dnsv.jp`** |
| グローバル管理者 | `admin@keijikyosai.onmicrosoft.com`（表示名: 京滋労働共済） |
| 代替メール（アカウント回復用） | `kjkyosaikai@msn.com`（Entra の「代替メールアドレス」） |

### 管理画面 URL

| 用途 | URL |
|------|-----|
| Microsoft 365 管理センター | https://admin.microsoft.com |
| Exchange 管理センター | https://admin.exchange.microsoft.com |
| Outlook Web | https://outlook.office.com |

---

## 2. ライセンス

| SKU | 数量 | 割当 |
|-----|------|------|
| **Microsoft 365 Business Standard（Teams なし）** | **1** | `admin@keijikyosai.onmicrosoft.com` |

**方針:** **第2ライセンスは追加しない。** メールボックスは **admin のみ**。`info@` は **別ユーザーではない**（同一箱の別アドレス）。

| 種別 | 値 |
|------|-----|
| **サインイン（UPN）** | `admin@keijikyosai.onmicrosoft.com`（変更不要） |
| **プライマリ SMTP（太字・既定の差出人）** | **`info@keijirodokyosai.org`** |
| **副 SMTP** | `admin@keijikyosai.onmicrosoft.com`（削除しない） |

---

## 3. DNS（`keijirodokyosai.org`）

お名前.com **DNSレコード設定**（`dnsv.jp`）に設定済み。

| 種別 | ホスト | 値（概要） |
|------|--------|------------|
| TXT | `@` | 所有権 `MS=ms…`、SPF（`v=spf1 include:spf.protection.outlook.com -all` 等） |
| MX | `@` | `keijirodokyosai-org.mail.protection.outlook.com`（優先度 0） |
| CNAME | `autodiscover` | `autodiscover.outlook.com` |

ネームサーバーは **`01.dnsv.jp`〜`04.dnsv.jp`**。`onamae.com` デフォルト NS のみだと検証が進まないことがある。

---

## 4. 事務局メール `info@keijirodokyosai.org`

### 4.1 いまの構成（2026-10-23）

| 項目 | 値 |
|------|-----|
| 対外の窓口 | `info@keijirodokyosai.org` |
| メールボックス | **admin 1 つ**（ライセンス 1） |
| 受信 | `info@` 宛は **admin で開く受信トレイ**に届く（引用の To も `info@` 表示） |
| 送信 | **新規・返信の既定差出人は `info@`**（OWA・デスクトップ Outlook 確認済み） |

### 4.2 Exchange で行った設定（再現用）

**A. エイリアス追加（必須・先行）**

1. M365 **ユーザー** → admin → **ユーザー名とメール アドレスの管理** で `info@` を追加してもよいが、**配信には Exchange 側が必須**。
2. **Exchange** → **受信者** → **メールボックス** → **京滋労働共済** → 右パネル **全般** → **メール アドレスの種類 mail の管理**。
3. **「+ メール アドレスの種類を追加」** → **SMTP** → `info` + `keijirodokyosai.org`。
4. 太字 **SMTP** の **「編集」** で `admin` を `info` に**書き換えない**（ログイン混同の恐れ）。

**B. プライマリ SMTP を `info@` にする（差出人・返信の既定）**

1. 同じ **メール アドレスの種類** 一覧で、**`info@keijirodokyosai.org`（smtp 行）の「編集」**。
2. **プライマリ／既定の返信アドレス** をオン（UI の文言は環境により異なる）。
3. 一覧で **太字 SMTP が `info@`**、`admin@…onmicrosoft.com` が **小文字 smtp** になっていることを確認。
4. **保存**。

**サインインは UPN のまま**（`admin@…onmicrosoft.com`）。M365 管理センターで **「プライマリ＝ユーザー名を info に変更」** とセットの画面は **使わない**。

**管理者 PowerShell（UI に既定が無い場合）:**

```powershell
Connect-ExchangeOnline -UserPrincipalName admin@keijikyosai.onmicrosoft.com
Set-Mailbox -Identity admin@keijikyosai.onmicrosoft.com -EmailAddresses @{
  remove = "SMTP:admin@keijikyosai.onmicrosoft.com"
  add    = "SMTP:info@keijirodokyosai.org","smtp:admin@keijikyosai.onmicrosoft.com"
}
```

### 4.3 Outlook クライアント

| 環境 | 状態 |
|------|------|
| **Outlook on the web** | admin でログイン。新規・返信の差出人 **`info@`** |
| **Outlook デスクトップ（Windows）** | プライマリ変更**後**も差出人が `admin@` のまま残ることがある → **京滋の Microsoft 365 アカウントだけ削除し、`admin@` で再追加**（他アカウントは触らない）。再追加後 **新規・返信とも `info@`**（2026-10-23 確認済み） |
| 再追加時の入力 | **メール アドレスは `admin@keijikyosai.onmicrosoft.com`**（`info@` ではない）。Outlook.com 新規作成リンクは使わない |

OWA の **設定 → メール → 作成** に「既定の差出人」が無い版でも、**プライマリ SMTP が `info@` なら返信差出人は `info@`** になる。

### 4.4 動作確認

| テスト | 期待結果 |
|--------|----------|
| 外部から `info@` 宛 | 受信トレイに届く。返信画面の To（引用）が **`info@`** |
| 返信・新規 | 差出人 **`info@keijirodokyosai.org`** |
| ログイン | **`admin@keijikyosai.onmicrosoft.com`** のまま |

---

## 5. 未実施・将来

| 項目 | 備考 |
|------|------|
| Worker 受付確認メール | **本番稼働（2026-10-24）** — `docs/soshiki-form-receipt-mail-status.md` |
| `soshiki-form-office-settings.json` の **`AdminEmail`** 最終化 | 障害通知先（任意だが推奨） |
| DKIM / DMARC の強化 | 任意（Defender ポータル） |
| `contact.html` の mailto を `info@` に | サイト側・別タスク |

※ Web 送信用 Worker URL は `data/soshiki-form-submit-config.json` に設定済み（`https://soshiki-submit.kjkyosaikai.workers.dev`）。

---

## 6. トラブルシュート

| 症状 | 対処 |
|------|------|
| `info@` に届かない | Exchange に `smtp:info@…` があるか。MX／ドメイン健全性 |
| 受信は `info@` 表示だが返信差出人が `admin@` | Exchange で **太字 SMTP が `info@` か**。デスクトップは **M365 行の再追加** |
| 差出人に `info@` が出ない | プライマリ未反映。Exchange 一覧を確認 |
| ログインできない | Entra の **ユーザー名（UPN）** が誤って `info@` に変わっていないか。UPN は `admin@…` に戻す |
| M365 の「メール」タブのリンクが押せない | **Exchange** → メールボックス一覧 → **右パネル** → **メール アドレスの種類 mail の管理** |

---

## 7. サイト公開ドメインとの関係

| 名前 | 役割 |
|------|------|
| `keijirodokyosai.github.io` | 静的サイト（GitHub Pages） |
| `keijirodokyosai.org` | 事務メール（Web ホスティングは当面 GitHub Pages のまま） |
