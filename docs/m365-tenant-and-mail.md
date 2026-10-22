# 事務局 Microsoft 365・メール（`keijirodokyosai.org`）

**目的:** 京滋労働組合共済会の事務用 M365 テナント、独自ドメイン、事務局メール `info@` の現状を運用者向けに記録する。  
**最終更新:** 2026-10-22（ドメイン完了・`info@` エイリアス・デスクトップ Outlook 接続まで）

**関連:** 組織共済 WEB 受付の送信バックエンドは [`soshiki-form-submit-worker-graph.md`](soshiki-form-submit-worker-graph.md)。Graph 保存はメール経路に依存しないが、**通知メール（パターン B）** や事務連絡では本ドキュメントの Exchange が使える。

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
| Exchange 管理センター | https://admin.exchange.microsoft.com （または M365 左下「すべて表示」→ Exchange） |
| Outlook Web | https://outlook.office.com |

---

## 2. ライセンス（2026-10-22）

| SKU | 数量 | 割当 |
|-----|------|------|
| **Microsoft 365 Business Standard（Teams なし）** | **1** | `admin@keijikyosai.onmicrosoft.com` |
| Power Automate Free | admin に付随 | — |

**運用上の制約**

- **ライセンス 1 つ = メールボックスを持つユーザーは実質 1 人（admin）**。
- `info@keijirodokyosai.org` 用に **別ユーザーを新規作成しライセンスを付けない**（未ライセンスユーザーに `info@` が付くと配信失敗の原因になる）。
- 事務局公開アドレスとして **`info@` は admin メールボックスのエイリアス** で運用（後述）。
- 将来 `info@` だけ別ログインしたい場合は **ライセンスを 1 つ追加**し、専用ユーザーを作成する（エイリアスは移行・整理が必要）。

---

## 3. DNS（`keijirodokyosai.org`）

お名前.com の **DNSレコード設定**（`dnsv.jp`）に、Microsoft のドメインウィザードに沿って設定済み。

| 種別 | ホスト | 用途（概要） |
|------|--------|----------------|
| TXT | `@` | ドメイン所有権（`MS=ms…`） |
| TXT | `@` | SPF（例: `v=spf1 include:spf.protection.outlook.com -all`） |
| MX | `@` | `keijirodokyosai-org.mail.protection.outlook.com`（優先度 0） |
| CNAME | `autodiscover` | `autodiscover.outlook.com` |

**注意:** ネームサーバーが **お名前.com デフォルト（`onamae.com`）** のままだと、Microsoft が **DNSレコード設定（dnsv.jp）** を参照せず検証が進まないことがある。ドメイン追加時は **dnsv.jp 系 NS とレコードの両方** が有効であることを確認する。

変更後は M365 **設定 → ドメイン → `keijirodokyosai.org`** で MX / SPF 等が **正常** と表示されること。

---

## 4. 事務局メール `info@keijirodokyosai.org`

### 4.1 構成（決定）

| 項目 | 値 |
|------|-----|
| 公開・事務連絡用アドレス | `info@keijirodokyosai.org` |
| 実体 | **admin と同一メールボックス**（エイリアス） |
| ログイン（サインイン） | **`admin@keijikyosai.onmicrosoft.com` のまま**（変更しない） |
| プライマリ SMTP（太字・既定） | `admin@keijikyosai.onmicrosoft.com` |

**受信:** `info@` に送ったメールは **admin で開く Outlook / OWA の受信トレイ** に入る（別受信トレイはない）。

**送信:** デスクトップ Outlook または OWA で **差出人（From）を `info@keijirodokyosai.org` に選択**して送れる（2026-10-22 にデスクトップ Outlook で接続・運用確認済み）。

### 4.2 設定手順の要点（再現用）

1. **M365 管理センター** → **ユーザー** → **admin** → **アカウント** → **ユーザー名とメール アドレスの管理**  
   - エイリアスとして `info@keijirodokyosai.org` を追加可能（UI に表示される）。

2. **Exchange 側の proxy アドレス**  
   - 上記だけでは **配信できない事例あり**（NDR: `info が keijirodokyosai.org で見つかりません` / DSN 5.1.0）。
   - **Exchange 管理センター** → **受信者** → **メールボックス** → **京滋労働共済** を選択 → 右パネル **全般** → **メール アドレス** 下の **「メール アドレスの種類 mail の管理」**  
   - **「+ メール アドレスの種類を追加」** → **SMTP** → `info` + `keijirodokyosai.org`  
   - 一覧で **太字の既定は `admin@…onmicrosoft.com` のまま**、追加行は **`smtp:info@keijirodokyosai.org`**（小文字 smtp = 追加アドレス）。

3. **やってはいけない操作**  
   - 既存 **SMTP（太字）** の **「編集」** で `admin` を `info` に書き換えない → プライマリ／ログイン ID が変わる恐れ。  
   - **「+ 追加」** で別名を足すのが正しい。

### 4.3 クライアント

| 環境 | 状態（2026-10-22） |
|------|---------------------|
| Outlook on the web | `admin` で利用可 |
| Outlook デスクトップ（Windows） | **admin アカウント追加済み・問題なし** |
| `info@` 専用プロファイル | **不要**（同一メールボックス） |

Outlook デスクトップ追加: **ファイル → アカウントの追加** → `admin@keijikyosai.onmicrosoft.com` → Microsoft 365 / Exchange としてサインイン。

差出人 `info@`: 新規メールで **差出人** を表示し、`info@keijirodokyosai.org` を選択。既定にする場合は OWA **設定 → メール → 作成と返信** の「既定の差出人」。

### 4.4 動作確認のしかた

| テスト | 期待結果 |
|--------|----------|
| admin の Outlook から `info@` 宛（手入力） | 同じ受信トレイに届く（表示名はどちらも「京滋労働共済」になりやすい） |
| 外部（MSN 等）から `info@` 宛 | admin の受信トレイに届く |
| 失敗時 | 受信トレイに NDR。Exchange **メッセージ トレース**で理由確認 |

---

## 5. 未実施・将来

| 項目 | 備考 |
|------|------|
| Cloudflare Worker + Graph 送信 | [`soshiki-form-submit-worker-graph.md`](soshiki-form-submit-worker-graph.md) のとおり **未デプロイ**（`submitEndpointUrl` 空） |
| Entra アプリ登録（Graph アプリ権限） | Worker 実装時に管理者作業 |
| DKIM / DMARC の強化 | ドメイン認証は M365 ウィザード分は済。必要に応じて Defender ポータルで DKIM 有効化 |
| `info@` 専用ユーザー | ライセンス追加時 |
| `union-contacts.json` による分会通知 | 設計は `soshiki-form-enter.md` §5.10 付近。Graph 送信メールが可能になったテナント状態 |

---

## 6. トラブルシュート早見表

| 症状 | 確認 |
|------|------|
| `info@` に届かない（テナント内） | Exchange で admin に `smtp:info@keijirodokyosai.org` があるか。M365 エイリアスだけでは不足のことがある |
| 外からだけ届かない | お名前.com の MX が Outlook Protection を向いているか。M365 ドメインの DNS 状態 |
| `info` ユーザーを作った | ライセンスなしなら削除し、admin のエイリアスに一本化 |
| 管理画面のリンクが押せない | 通常ブラウザで再試行。Exchange は **メールボックス一覧 → 右パネル** から操作 |
| ログインできなくなった | プライマリ SMTP を `info@` に変更していないか。Exchange で既定を `admin@…onmicrosoft.com` に戻す／Entra で UPN 確認 |

---

## 7. サイト公開ドメインとの関係

| 名前 | 役割 |
|------|------|
| `keijirodokyosai.github.io` | 静的サイト（GitHub Pages） |
| `keijirodokyosai.org` | 事務メール・将来の公式メール／DNS 拡張用（**現時点で Web ホスティングは GitHub Pages のまま**） |

メール用 MX と Web 用 CNAME/A は **別レコード**として共存できる。Web を `keijirodokyosai.org` に載せ替える場合は別タスクで DNS を追加する。
