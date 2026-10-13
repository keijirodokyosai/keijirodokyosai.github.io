# 組織共済 WEB 受付 — M365 アカウント・ドメイン（運用仕様）

**目的:** 京滋 M365 テナント上の **管理用 admin** と **事務用 info** の役割、メール・OneDrive・Worker 設定を1本に固定する。  
**関連:** `docs/soshiki-form-submit-worker-graph.md`（Worker・Graph）、`docs/soshiki-form-receipt-mail-status.md`（メール本番の切替・障害）、`scripts/soshiki-form-office/README.md`（事務 PDF）。

**状態:** 2026-10 決定。**ドメイン `keijirodokyosai.org`・Exchange は 10/15 前後で有効化予定。** 切替作業は未完了の項目あり（§5）。

---

## 1. 2 アカウントの役割

| アカウント | 用途 | グローバル管理者 | 通常の事務 |
|------------|------|------------------|------------|
| **admin** | Entra / M365 **テナント管理**（ユーザー作成、ライセンス、ドメイン、Entra アプリの管理者同意、Worker 用オブジェクト ID の確認） | **付与** | **使わない** |
| **info** | **事務局**の実運用（メール、OneDrive 受付、Outlook での確認） | **付けない** | **使う** |

- **admin** で日常のメール送受信・受付 json の閲覧は **しない**（管理センターにログインするためだけ）。
- **申込 Web** は組合担当者のブラウザから送る。**Microsoft ログインは不要**（送信用パスワードのみ）。

---

## 2. 事務局ユーザー（info）— 決定値

| 項目 | 値 |
|------|-----|
| **メールアドレス（UPN / プライマリ SMTP）** | `info@keijirodokyosai.org` |
| **表示名** | `京滋労働共済 事務局` |
| **ドメイン** | `keijirodokyosai.org`（10/15 前後取得・テナントに追加） |
| **ライセンス** | **Exchange Online を含む** SKU（例: Microsoft 365 Business Basic）**1 席** |

### 2.1 info が担うもの

- **通常の事務メール**（対外窓口としての `info@`）
- **組織共済 WEB 受付**の受付確認メール **送信元（From）**（Worker Graph `sendMail`）
- **OneDrive** 上の **`組織共済WEB受付`**（`受付/{月}/json/`、`PDF/`、`設定/`、Excel テンプレなど）
- 将来 **お問い合わせページ**（`contact.html`）の `mailto` を msn から `info@` に寄せる候補（移行タイミングは別途）

### 2.2 受付確認メール

- **宛先（To）:** OneDrive `設定/union-contacts.json` の `ManagerEmail`（`KyosaikaiCode` 照合）
- **送信元・BCC:** `設定/soshiki-form-office-settings.json` の **`FromEmail`** ＝ `info@keijirodokyosai.org`
- **PDF 添付:** **なし**（用紙 PDF は事務 Inbox → Excel、§13 worker-graph）

---

## 3. 管理用（admin）

| 項目 | 内容 |
|------|------|
| 名称 | テナント内の **admin**（表示名は「管理者」等で可） |
| 役割 | **グローバル管理者**＝テナント管理は **このアカウントで OK** |
| OneDrive 受付 | **移行後は使わない**（旧 `GRAPH_DRIVE_USER_ID` が admin の場合は info に切替） |
| メール | 管理用のみ。受付確認の From に **しない** |

**多要素認証（MFA）** を admin に必須化すること。

---

## 4. Worker（Entra アプリ）とユーザーの関係

Worker は **人ではなく** Entra アプリ **「組織共済WEB受付」** の権限で Graph を呼ぶ。

| Secret / 設定 | 移行後（本命） |
|---------------|----------------|
| `GRAPH_DRIVE_USER_ID` | **info** ユーザーのオブジェクト ID |
| `GRAPH_MAIL_USER_ID` | **省略可**（未設定時は Drive と同じ ID）。info 一本なら **info の ID** |
| `GRAPH_BASE_PATH` | 例: `組織共済WEB受付` |
| OneDrive `FromEmail` | `info@keijirodokyosai.org` |

申込者は Graph にログインしない。保存・sendMail はすべて **アプリ権限**＋上記ユーザー ID。

---

## 5. 10/15 前後の切替チェックリスト

### 5.1 admin（テナント管理）

- [ ] ドメイン **`keijirodokyosai.org`** をテナントに追加・DNS 確認  
- [ ] ユーザー **info** 作成（UPN `info@keijirodokyosai.org`、表示名 **京滋労働共済 事務局**）  
- [ ] info に **Exchange 付きライセンス** 1 席  
- [ ] Entra アプリの **管理者の同意**（`Files.ReadWrite.All`・`Mail.Send`）— 済みなら再確認のみ  

### 5.2 info（データ・運用）

- [ ] OneDrive に **`組織共済WEB受付`** を配置（Admin から **移動 or コピー**）  
- [ ] `設定/soshiki-form-office-settings.json` — **`FromEmail`**: `info@keijirodokyosai.org`、**`AdminEmail`**: 障害通知先  
- [ ] `設定/union-contacts.json` — kyosai-system から export・配置  
- [ ] Excel テンプレ `組織共済申込書（PDF化テンプレ）.xlsx`  

### 5.3 Worker・Web

- [ ] `wrangler secret put GRAPH_DRIVE_USER_ID` → **info のオブジェクト ID**  
- [ ] （任意）`GRAPH_MAIL_USER_ID` → 同じ ID または削除して Drive 既定  
- [ ] `wrangler deploy`  
- [ ] テスト送 信 → json が **info の OneDrive** に保存、**`mailSent: true`**  

### 5.4 事務 PC

- [ ] `soshiki-form-office-settings.json` の **`ReceptionRoot` / `WebRoot`** を info 側パスに合わせる  
- [ ] Graph Inbox watcher またはローカル Inbox タスクを **1 系統だけ** 本番登録（`scripts/soshiki-form-office/README.md`）  

---

## 6. 移行前（現状の注意）

- Worker の `GRAPH_DRIVE_USER_ID` が **旧 Admin** のままの場合、json は **Admin の OneDrive** に保存される。  
- **mailSent: false** のときは `docs/soshiki-form-receipt-mail-status.md`（Exchange 未割当・`MailboxNotEnabledForRESTAPI` 等）。  
- 切替完了まで **二重保存**（Admin と info 両方に Worker を向けない）。

---

## 7. ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| `docs/soshiki-form-submit-worker-graph.md` | POST・OneDrive パス・§13 事務 PDF |
| `docs/soshiki-form-enter.md` | 入力 UI・submission・§5.10.1 |
| `docs/soshiki-form-receipt-mail-status.md` | メール障害・経路選択・Ricoh 依頼文 |
| `workers/soshiki-submit/README.md` | Worker Secrets・deploy |
| `scripts/soshiki-form-office/README.md` | Excel PDF・Inbox・設定 JSON |

---

**最終更新:** 2026-10-13（info@ / 表示名 / admin 役割分離を確定）
