# 組織共済 WEB 受付 — 受付確認メール（調査・未決定メモ）

**目的:** 2026-10 の本番準備で判明した事実と、次回セッションで決めることを1本に残す。  
**関連:** `docs/soshiki-form-submit-worker-graph.md` §6・§13、`docs/soshiki-form-enter.md` §5.10.1。

**状態:** 2026-10-13 **一旦中断**。受付確認メールの本番経路は **未決定**（json 受付は稼働可能）。

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

## 3. 議論で整理した構成（方針 A）

| 役割 | アカウント |
|------|------------|
| OneDrive（json・`設定/*.json`） | **Admin**（共有用・既存 `GRAPH_DRIVE_USER_ID`） |
| メール送信（`sendMail`） | **別ユーザー** → Secret **`GRAPH_MAIL_USER_ID`** + settings **`FromEmail`** |

**Admin に Exchange を 1 席足す**（方針 B）でも可。ライセンス **1 席分のコストは同程度**。

検討した送信用 UPN 例: `keijikyosai@keijikyosai.onmicrosoft.com`（テナントの `*.onmicrosoft.com` を Entra「ドメイン名」で確認してから作成）。

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

## 6. 次回セッションで決めること（チェックリスト）

### 6.1 経路の決定（いずれか1つを本命に）

- [ ] **A** — M365 **Business Basic（または Exchange Online Plan 1）を 1 席**購入・割り当て  
  - 送信用: **新規 `keijikyosai@…onmicrosoft.com`** か **Admin に追加**か  
  - `FromEmail` / `GRAPH_MAIL_USER_ID`（Admin 一本なら Mail ID 省略可）  
  - Ricoh 見積（税込年額）  
- [ ] **B** — Worker メールは **オフ**（または失敗を許容）し、**Inbox で Outlook 送信**を復活させるか  
  - 遅延・PC 常時 ON を運用で許容するか  
- [ ] **C** — 外部メール API を **新規設計・実装**するか（ドメイン取得も含む）  
- [ ] **D** — 受付確認メール **自動化なし**

### 6.2 A を選んだ場合の残作業

- [ ] Entra で送信用ユーザー確認・**オブジェクト ID**  
- [ ] `wrangler secret put GRAPH_MAIL_USER_ID`（Admin 以外を送る場合）  
- [ ] OneDrive `設定/soshiki-form-office-settings.json` の **`FromEmail`** 整合  
- [ ] テスト送信 → **`mailSent: true`**・`wrangler tail` でエラーなし  
- [ ] GitHub Pages: `js/soshiki-form-submit.js`（mailWarning 非表示）**push**  
- [ ] Worker: `mailWarning` 削除版 **deploy**（未反映なら）  
- [ ] 事務 **Graph Inbox** 本番タスク（PDF・**メールは送らない**方針の確認）

### 6.3 ドキュメント

- [ ] 決定後 `docs/soshiki-form-submit-worker-graph.md` §6・§13 と `docs/soshiki-form-enter.md` §5.10.1 を **本命経路に合わせて更新**

---

## 7. 運用メモ（申込者向け表示）

- json 保存成功時、**メール失敗を申込者に表示しない**（事務向けは Admin Graph アラート + ログ）。コード・README は 2026-10-13 時点で反映済み（**コミット・deploy は手動**）。

---

## 8. Ricoh / M365 依頼文（案 A・コピペ用）

> 組織共済 Web 受付の Graph `sendMail` 用に、**Exchange Online が含まれるライセンスを 1 席**追加してください（**Microsoft 365 Business Basic** または **Exchange Online Plan 1**）。  
> 現状 OneDrive Admin は **Apps for business のみ**で `MailboxNotEnabledForRESTAPI` です。  
> OneDrive 受付は Admin のまま、送信は **別ユーザー**（例: `keijikyosai@keijikyosai.onmicrosoft.com`）または Admin への追加割り当てのいずれかで、**オブジェクト ID** と **From 用メールアドレス**を共有ください。

---

**最終更新:** 2026-10-13（セッション中断・次回決定待ち）
