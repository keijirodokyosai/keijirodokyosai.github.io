# 組織共済 WEB 受付 — 受付確認メール（調査・未決定メモ）

**目的:** 2026-10 の本番準備で判明した事実と、次回セッションで決めることを1本に残す。  
**関連:** `docs/soshiki-form-submit-worker-graph.md` §6・§13、`docs/soshiki-form-enter.md` §5.10.1。

**状態:** 2026-10-13 **アカウント方針確定**（詳細は **`docs/soshiki-m365-accounts.md`**）。**info@keijirodokyosai.org** + Exchange 1 席・OneDrive 切替は **10/15 前後**。本番 `mailSent: true` は切替・deploy 後。

---

## 1. いま動いているもの

| 機能 | 状態 |
|------|------|
| Web → Worker → OneDrive **json 保存** | **OK**（`ok: true`・受付 ID） |
| Entra アプリ `組織共済WEB受付` | `Files.ReadWrite.All` + **`Mail.Send`（アプリケーション）** 管理者同意済み |
| Worker **deploy** | 実施済み（`soshiki-submit.kjkyosaikai.workers.dev`） |
| Cloudflare Secrets | `AZURE_*` / `GRAPH_DRIVE_USER_ID` / `GRAPH_BASE_PATH` / `SOSHIKI_SUBMIT_PASSWORD`。**`SOSHIKI_SKIP_RECEIPT_MAIL` なし** |
| 受付確認メール（Graph `sendMail`） | **`mailSent: false`**（json は保存される） |
| 事務 Graph Inbox（PDF） | コード初版あり。**本番タスク・ライセンス整理前** |
| Web 申込者向け `mailWarning` 表示 | **リポジトリで削除済み**（Pages push / Worker 再 deploy で反映） |

---

## 2. 判明した原因（本番テスト・`wrangler tail`）

```
Receipt mail failed: sendMail: 404 MailboxNotEnabledForRESTAPI
The mailbox is either inactive, soft-deleted, or is hosted on-premise.
Admin alert failed: （同じ sendMail 失敗）
```

| 項目 | 内容 |
|------|------|
| **送信に使っているユーザー** | `GRAPH_MAIL_USER_ID` 未設定 → **`GRAPH_DRIVE_USER_ID`（OneDrive Admin）** |
| Admin のライセンス | **Microsoft 365 Apps for business** + Power Automate Free のみ → **Exchange メールボックスなし** |
| **個人 MSN**（`kjkyosaikai@msn.com` 等） | **Entra ユーザー一覧に無い** → Graph **送信元に指定不可**（個人 MSA ≠ テナントユーザー） |
| **独自ドメイン** | 共済会として **未保有**。送信は **`@keijikyosai.onmicrosoft.com` 等で可**（Basic 契約時） |

**結論:** Worker 実装は動くが、**Exchange Online が有効なテナント内メールボックス 1 席**が無いと `sendMail` は必ず失敗する。**無料のみでは Graph 即時メールは成立しない**（旧 worker-graph §7「Exchange 不要」は誤り → 本 doc・§7 修正済み）。

---

## 3. 確定した構成（2026-10）

| 役割 | アカウント |
|------|------------|
| テナント管理 | **admin**（グローバル管理者。**通常事務は使わない**） |
| OneDrive（json・`設定/*.json`）・事務メール・sendMail 送信元 | **info@keijirodokyosai.org**（表示名: **京滋労働共済 事務局**） |
| Worker `GRAPH_DRIVE_USER_ID` / `GRAPH_MAIL_USER_ID` | **info** のオブジェクト ID（切替後） |

旧構成（Admin の OneDrive のみ・Mail ID 未設定）は **移行中**。全文は **`docs/soshiki-m365-accounts.md` §5**。

---

## 4. コスト・前提

| 項目 | 目安 |
|------|------|
| **Microsoft 365 Business Basic**（税抜・年払い目安） | 約 **1,049 円/月/ユーザー**（2026-07 改定後。Ricoh 契約で異なる） |
| Basic に **独自ドメインは付属しない** | `@onmicrosoft.com` のメールは可。独自ドメインは別途取得＋DNS 設定 |
| **Apps for business** | Office アプリ。**メールボックスは含まない** |

**前提の修正:** 「Graph 本命＝追加ライセンスなし」は **受付確認メールまで含めると成立しない**。

---

## 5. 代替案（次回の選択肢）

| 案 | 届く目安 | 事務 PC 常時 ON | 追加 M365 メール席 | 備考 |
|----|----------|-----------------|---------------------|------|
| **A. Worker + Graph**（現行コード） | **数秒〜30 秒** | **不要** | **要（1 席）** | Admin または新規ユーザーに Basic 等 |
| **B. 事務 Inbox + Outlook**（`Send-SoshikiFormReceiptEmail.ps1`） | **30 秒〜数分**（ポール 30s 等） | **要**（watcher 常駐） | **不要の可能性**（Outlook 設定次第） | 設計は「Inbox PDF のみ」から **メール復帰要検討** |
| **C. Worker + 外部 API**（Resend / SES 等） | 数秒前後 | メールのみなら不要 | **不要** | **未実装**。From ドメイン認証推奨 |
| **D. 手動メールのみ** | 不定 | 送るときだけ | 不要 | json 受付のみ本命 |

**「数秒」**は主に **案 A / C**。**案 B** は数秒ではなく **1 分前後〜**が現実的。

---

## 6. 本番切替チェックリスト（案 A＝Worker + Graph を採用）

- [x] 経路 **A**（Worker `sendMail`）— アカウントは **info** 一本（`docs/soshiki-m365-accounts.md`）  
- [ ] **10/15** — ドメイン `keijirodokyosai.org`・info に **Exchange 1 席**  
- [ ] info の OneDrive に **`組織共済WEB受付`**（Admin から移行）  
- [ ] Entra **info** のオブジェクト ID → `GRAPH_DRIVE_USER_ID`（＋必要なら `GRAPH_MAIL_USER_ID`）・**deploy**  
- [ ] `設定/soshiki-form-office-settings.json` — **`FromEmail`**: `info@keijirodokyosai.org`  
- [ ] テスト送 信 → **`mailSent: true`**・`wrangler tail` でエラーなし  
- [ ] 事務 **Graph Inbox** 本番タスク（**PDF のみ**・メールは Worker）

---

## 7. 運用メモ（申込者向け表示）

- json 保存成功時、**メール失敗を申込者に表示しない**（事務向けは Admin Graph アラート + ログ）。コード・README は 2026-10-13 時点で反映済み（**コミット・deploy は手動**）。

---

## 8. Ricoh / M365 依頼文（コピペ用・2026-10 確定版）

> 組織共済 Web 受付用に、ドメイン **keijirodokyosai.org** の追加と、ユーザー **info@keijirodokyosai.org**（表示名: 京滋労働共済 事務局）への **Exchange Online が含まれるライセンス 1 席**（例: Microsoft 365 Business Basic）の割り当てをお願いします。  
> このユーザーで **OneDrive** に受付フォルダ「組織共済WEB受付」を運用し、Graph **sendMail** の送信元とします。  
> 作成後、**info ユーザーの Entra オブジェクト ID** を共有ください（Cloudflare Worker 設定用）。  
> テナント管理用 **admin** には Exchange は不要です。

---

**最終更新:** 2026-10-13（info@ 方針確定・`docs/soshiki-m365-accounts.md`）
