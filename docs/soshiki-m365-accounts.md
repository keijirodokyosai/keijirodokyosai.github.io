# 組織共済 WEB 受付 — M365 アカウント・運用方針

**目的:** 京滋 M365 テナント上の **管理（admin）** と **事務窓口（`info@`）** の役割、メール・OneDrive・Worker 設定を1本に固定する。  
**関連:** [`m365-tenant-and-mail.md`](m365-tenant-and-mail.md)（ドメイン・DNS・Exchange エイリアス手順）、[`soshiki-form-submit-worker-graph.md`](soshiki-form-submit-worker-graph.md)（Worker・Graph）、[`soshiki-form-receipt-mail-status.md`](soshiki-form-receipt-mail-status.md)（受付メール本番・障害）、[`scripts/soshiki-form-office/README.md`](../scripts/soshiki-form-office/README.md)（事務 PDF）。

**状態（2026-10-23 確定）**

- **Microsoft 365 Business Standard（Teams なし）× 1** のみ。**第2ライセンス・`info` 専用ユーザーは採用しない。**
- 技術上のメールボックスは **admin 1 つ**。対外アドレス **`info@keijirodokyosai.org`** は同一箱の代表アドレス（Exchange **プライマリ SMTP**）。`admin@…onmicrosoft.com` は副アドレス。
- **「admin を日常メールに使わない」** ＝ **`admin@keijikyosai.onmicrosoft.com` を対外に出さず、送受信の表向きは常に `info@`**。Outlook / OWA のサインインは **admin**（ライセンス上他に選択がない）だが、**事務作業は事務局メール（`info@`）として行う**。

---

## 1. ライセンス方針

| 項目 | 決定 |
|------|------|
| 契約席数 | **1**（増席しない） |
| 割当 | `admin@keijikyosai.onmicrosoft.com` |
| `info@` | **別ユーザーではない**。エイリアス（同一受信トレイ） |
| やらないこと | ライセンスなしの `info` ユーザー作成、共有メールボックスへの載せ替え（現状のエイリアス運用を維持） |

---

## 2. 役割の分け方（論理と技術）

| 論理上の役割 | 技術上の実体 | グローバル管理者 | 事務の送受信 |
|--------------|--------------|------------------|--------------|
| **テナント管理** | **admin**（UPN `admin@keijikyosai.onmicrosoft.com`） | **付与** | **対外は `admin@` を使わない** |
| **事務局窓口** | **`info@keijirodokyosai.org`**（admin の **プライマリ SMTP**） | — | **From・名刺・サイトは `info@` のみ** |

- **申込 Web** は組合担当者のブラウザから送る。**Microsoft ログインは不要**（送信用パスワードのみ）。
- **管理センター**（ユーザー・ドメイン・ライセンス・Entra アプリの同意）は **admin** でブラウザログイン。**テナント設定のときだけ admin を使う**運用とする。

---

## 3. 管理用（admin）

| 項目 | 内容 |
|------|------|
| サインイン ID | `admin@keijikyosai.onmicrosoft.com` |
| 役割 | **グローバル管理者**（テナント管理） |
| 対外公開 | **`admin@…onmicrosoft.com` は掲載・署名・返信先に使わない** |
| OneDrive | **組織共済WEB受付** の保存先（Worker `GRAPH_DRIVE_USER_ID` は **admin のオブジェクト ID**） |
| メール（技術） | ライセンス付きメールボックスは admin のみ。`info@` はこの箱への別名 |

**多要素認証（MFA）** を admin に必須化すること。

---

## 4. 事務用（`info@`）

| 項目 | 値 |
|------|-----|
| **対外メールアドレス** | `info@keijirodokyosai.org` |
| **表示名（推奨）** | 京滋労働共済 事務局（差出人表示は Outlook 設定に依存） |
| **ログイン** | **専用 UPN はない**。Outlook / OWA は **admin でサインイン**し、差出人・受信は **`info@` として扱う** |
| **受信** | `info@` 宛は **admin と同じ受信トレイ**に届く |
| **送信** | Exchange で **プライマリ SMTP = `info@`**（手順は [`m365-tenant-and-mail.md`](m365-tenant-and-mail.md) §4.2）。デスクトップで差出人が `admin@` のままなら **京滋 M365 行だけ削除→`admin@` で再追加** |

### 4.1 事務で担うもの

- **通常の事務メール**（対外窓口としての `info@`）
- **組織共済 WEB 受付**の受付確認メール **送信元（From）**（Worker Graph `sendMail`）
- **OneDrive** 上の **`組織共済WEB受付`**（`受付/{月}/json/`、`PDF/`、`設定/`、Excel テンプレなど）— **admin の OneDrive**
- 将来 **お問い合わせページ**（`contact.html`）の `mailto` を msn から `info@` に寄せる候補

### 4.2 受付確認メール

- **宛先（To）:** OneDrive `設定/union-contacts.json` の `ManagerEmail`（`KyosaikaiCode` 照合）
- **送信元・BCC:** `設定/soshiki-form-office-settings.json` の **`FromEmail`** ＝ `info@keijirodokyosai.org`
- **PDF 添付:** **なし**（用紙 PDF は事務 Inbox → Excel、worker-graph §13）

### 4.3 事務 PC の運用ルール

1. 名刺・Web・署名は **`info@keijirodokyosai.org` だけ**（`admin@…onmicrosoft.com` は出さない）。
2. **サインインは admin**、**送受信の表向きは `info@`**（プライマリ SMTP 設定済み。2026-10-23 OWA／デスクトップで新規・返信とも `info@` 確認済み）。
3. Outlook に **他アカウント（MSN 等）と併用**する場合、京滋の行は **`admin@` で再接続**したプロファイルを使う（`info@` 用の第2ログインは不要）。
4. **admin.microsoft.com** はテナント設定時のみ。

---

## 5. Worker（Entra アプリ）とユーザー ID

Worker は **人ではなく** Entra アプリ **「組織共済WEB受付」** の権限で Graph を呼ぶ。

| Secret / 設定 | 1 ライセンス運用（確定） |
|---------------|--------------------------|
| `GRAPH_DRIVE_USER_ID` | **admin** ユーザーのオブジェクト ID（OneDrive のオーナー） |
| `GRAPH_MAIL_USER_ID` | **省略可**（未設定時は Drive と同じ）。sendMail も **admin のメールボックスから `info@` 差出人** |
| `GRAPH_BASE_PATH` | 例: `組織共済WEB受付` |
| OneDrive `FromEmail` | `info@keijirodokyosai.org` |

申込者は Graph にログインしない。保存・sendMail はすべて **アプリ権限**＋上記ユーザー ID。メールボックスの **プライマリ SMTP が `info@`** であることが From に整合する。

---

## 6. セットアップ・本番チェックリスト

### 6.1 ドメイン・事務メール（完了）

- [x] ドメイン・DNS・Exchange **`info@`**・**プライマリ SMTP = `info@`**・OWA／Outlook 差出人（[`m365-tenant-and-mail.md`](m365-tenant-and-mail.md)）

### 6.2 OneDrive・事務データ（admin 配下）

- [x] OneDrive（**admin**）に **`組織共済WEB受付`** を配置
- [x] `設定/soshiki-form-office-settings.json` — **`FromEmail`**: `info@keijirodokyosai.org`、**`AdminEmail`**: 障害通知先（`AdminEmail` の最終値は本番運用で調整可）
- [x] `設定/union-contacts.json` — 配置済み（kyosai-system からの定期 export は運用で継続）
- [ ] Excel テンプレ `組織共済申込書（PDF化テンプレ）.xlsx`

### 6.3 Worker・Web

- [x] `wrangler secret put GRAPH_DRIVE_USER_ID` → **admin のオブジェクト ID**
- [x] （任意）`GRAPH_MAIL_USER_ID` → 未設定で Drive と同一で可
- [x] `wrangler deploy`（本番 URL 設定済み）
- [x] テスト送 信 → json が **admin の OneDrive** に保存、受付確認メール届く（**2026-10-24** 確認）

### 6.4 事務 PC

- [ ] `soshiki-form-office-settings.json` の **`ReceptionRoot` / `WebRoot`** を事務環境に合わせる
- [x] Outlook: **admin で接続**、新規・返信の差出人 **`info@`**（プライマリ変更後は M365 行の再追加が必要な場合あり）
- [ ] Graph Inbox watcher またはローカル Inbox タスクを **1 系統だけ** 本番登録（`scripts/soshiki-form-office/README.md`）

---

## 7. 採用しない構成（参考）

過去に検討した **admin 管理専用 + info 専用ユーザー（第2ライセンス）** は **コスト方針により不採用**。ログイン ID を完全に分離する必要が出た場合のみ、ライセンス増席を別議題とする。

---

## 8. ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| `docs/m365-tenant-and-mail.md` | DNS・Exchange エイリアス手順・トラブルシュート |
| `docs/soshiki-form-submit-worker-graph.md` | POST・OneDrive パス・§13 事務 PDF |
| `docs/soshiki-form-enter.md` | 入力 UI・submission・§5.10 |
| `docs/soshiki-form-receipt-mail-status.md` | 受付確認メール本番運用・障害切り分け |
| `workers/soshiki-submit/README.md` | Worker Secrets・deploy |
| `scripts/soshiki-form-office/README.md` | Excel PDF・Inbox・設定 JSON |

---

**最終更新:** 2026-10-24（Worker 受付確認メール本番確認を反映）
