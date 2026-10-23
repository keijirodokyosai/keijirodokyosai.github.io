# 組織共済 WEB 受付 — 本命ルート（自作フォーム + Cloudflare Workers + Graph）

**目的:** 別セッション・別担当が実装を続けられるよう、2026-10 時点の決定事項と未作業を1本にまとめる。  
**関連:** 入力 UI・JSON 仕様は `docs/soshiki-form-enter.md` §5.10 以降。M365 **1ライセンス・admin + `info@` エイリアス** は **`docs/soshiki-m365-accounts.md`**（技術手順は **`docs/m365-tenant-and-mail.md`**）。本ドキュメントは **送信バックエンド** 専用。

---

## 1. 決定した本命構成

```
[ブラウザ] soshiki-form-enter.html（自作・GitHub Pages）
    │ 送 信ボタン
    ▼ POST（password, unionName, fileNameDate, submission）
[Cloudflare Workers] 中継 API（秘密鍵・パスワードは環境変数のみ）
    │ Microsoft Graph（アプリケーション権限）
    ├─► OneDrive 受付/{storageFolder}/json/ に .json 保存
    └─► 受付確認メール（sendMail・PDF 添付なし・設定/union-contacts 参照）
    ▼ レスポンス { "ok": true, "receiptId": "…", "mailSent": … } → Web

[事務 PC] Graph delta ポール（推奨）または OneDrive 同期 + ローカル Inbox（§13）
    ① Excel テンプレ → PDF/ に PDF 保存（**メールは送らない**・二重送信防止）
    ② json を 処理済/ に移動（クラウド＋ローカル）
```

| 項目 | 内容 |
|------|------|
| フロント | 入力・検証・**submission JSON** 送信。組合向け PDF は **送信成功後**のブラウザ印刷（§5.9・保 存ボタンなし） |
| バックエンド | Cloudflare Worker **`workers/soshiki-submit`**（URL を config に書く） |
| 用紙 PDF | **共済会側**（Excel テンプレ＋ PowerShell / Python）。Web の html2canvas は **採用しない**（位置合わせ困難） |
| 返信メール | **Worker** が json 保存直後に Graph **sendMail**（**PDF は添付しない**）。失敗時は管理者アラート |
| 認証 | **Entra ID アプリ登録** + Client Secret（Worker Secrets）。**申込者の Microsoft ログインは不要** |
| Exchange / メール | **本番の受付確認は Worker**。事務 Inbox は **PDF のみ**（`Send-SoshikiFormReceiptEmail.ps1` は手動・再送用） |
| Power Automate | **送信用・保存用とも不要**（HTTP 受信は Premium。メールトリガーは REST／ライセンス問題） |

---

## 2. 採用しなかった経路（理由だけ）

| 経路 | 理由 |
|------|------|
| PA **HTTP 要求の受信時** → OneDrive | **Premium**（追加コスト回避のため破棄） |
| PA **メールが届いたとき** → 添付保存 | **Office 365 Outlook REST** 非対応（admin 等）。**Exchange 付きライセンス**もテナントに実質なし（Apps + PA Free のみ） |
| **Outlook.com（msn）** で送信／受信 | 個人アカウント。公式受付 `@keijikyosai` にならない。テナント外 |
| **Microsoft Forms** 埋め込み | 用紙レイアウト・`union-master`・PDF/JSON 仕様と不合。自作フォーム維持 |
| **PAD（デスクトップ）常駐** | 24h Web 受付向きでない |
| ブラウザから **Graph 直叩き** | Client Secret を公開できない → **Worker 必須** |

---

## 3. 京滋 M365 テナント（2026-10 時点の整理）

**運用の詳細:** [`docs/soshiki-m365-accounts.md`](soshiki-m365-accounts.md)（方針）・[`docs/m365-tenant-and-mail.md`](m365-tenant-and-mail.md)（DNS・Exchange）

| 事実 | 影響 |
|------|------|
| **Microsoft 365 Business Standard（Teams なし）× 1** → `admin@keijikyosai.onmicrosoft.com` に割当。Exchange メールボックスあり | **Graph ファイル保存**は引き続き本命。**Graph 送信メール**（分会通知など）も技術的には可能（Entra アプリ・権限は未設定） |
| 独自ドメイン **`keijirodokyosai.org`** セットアップ完了 | 事務 From **`info@`**（admin 箱の **プライマリ SMTP**。ライセンス 1） |
| **送 信・保存の本命**は Worker → Graph → OneDrive。**メール経由 PA は採用しない** | PA Free の Outlook REST 制限は残るが、受付保存には不要 |
| パターン B（`union-contacts.json` → 担当者通知） | Worker 実装後に **Graph `sendMail`** 等で検討。`info@` 差出人は Exchange 設定済み |
| パートナー: Ricoh（`zjc_o365helpdesk@jp.ricoh.com` 等） | Entra アプリ登録・管理者同意は管理者作業 |

---

## 4. Web 側 — 実装済み

| 機能 | ファイル |
|------|----------|
| 入力フォーム | `soshiki-form-enter.html`、`_includes/soshiki-form-member-rows.html`、`css/style.css` |
| 送 信 POST | `js/soshiki-form-submit.js`（**JSON のみ**） |
| **組合 PDF** | 送 信成功後 **印刷 → PDF に保存**（ファイル名 `{組合名}_{yyyyMMdd}_{受付ID}.pdf`）。**事務用 PDF の正本は Excel 経路** |
| 設定 | `data/soshiki-form-submit-config.json` の `submitEndpointUrl` |

### POST ボディ（Worker が受け取る形）

**`pdfBase64` は受け付けない**（送ると 400）。OneDrive には **`.json` のみ** PUT。submission は §5.10.1（`SheetFooter` 等）。

```json
{
  "password": "ユーザー入力",
  "unionName": "サンプル労働組合",
  "fileNameDate": "20260903",
  "submission": { … }
}
```

### Web が期待するレスポンス

```json
{ "receiptId": "7f3a2b1c", "ok": true, "mailSent": true }
```

メール失敗でも json 保存済みのときは `ok: true` のまま `mailSent: false`（Web は成功表示のみ・メール障害は申込者に非表示）。

### 送 信条件（既存）

`validateSoshikiForm()` OK・組合名 Enter 確定・組合員1名以上・パスワード入力。

---

## 5. OneDrive 保存仕様（§5.10 と同一）

### フォルダ

```text
組織共済WEB受付/
  受付/
    yyyy年mm月/          … submission.storageFolder（例 2027年01月）
      json/              … 取込後削除（事務側）。PDF 後は 処理済/ に移動（Inbox 自動）
      PDF/
      処理済/            … PDF 済み json
  設定/
    union-contacts.json  … 非公開・受付確認メール To（Worker が `KyosaikaiCode` 照合）
```

### ファイル名

```text
{組合名}_{yyyyMMdd}_{受付ID}.json
```

事務バッチが生成する PDF は同 stem で `PDF/` に保存（§13）。Worker は **pdf を書かない**。

- `unionName`・`fileNameDate` は POST トップレベル  
- **受付 ID** は **Worker が生成**（旧設計の PA 生成の代わり）

### submission JSON

`docs/soshiki-form-enter.md` §5.10・**§5.10.1** に準拠。

**現行:** OneDrive の `.json` ファイル本文は **`submission` オブジェクトのみ**（`unionName`・`receiptId` はファイル名から取得）。  
**移行後（推奨）:** Worker が `{ receiptId, unionName, fileNameDate, submission }` を保存し、事務バッチの解析を単純化。

---

## 13. 事務側自動化（PDF）— 2026-10 決定・2026-10 更新

Web では **送 信 PDF を作らない**（html2canvas 経路は削除済み）。**受付確認メールは Worker**（§6）。事務 PC は **Excel → PDF** と **処理済** のみ。

### 13.1 処理順（1 json ＝ 1 ジョブ・事務 Inbox）

| 順 | 処理 | 備考 |
|----|------|------|
| 1 | **トリガー** | **推奨:** `Watch-SoshikiFormJsonInboxGraph.ps1`（Graph **delta**・既定 30 秒）。**代替:** OneDrive 同期 + `Register-SoshikiFormJsonInboxAutomation.ps1`（ローカル `json/` スキャン）。**両方同時は避ける** |
| 2 | **PDF 生成** | Excel テンプレ → `PDF/` に `{組合名}_{yyyyMMdd}_{受付ID}.pdf`（`Invoke-SoshikiFormJsonInboxFile`） |
| 3 | **処理済** | 成功または既存 PDF ありで `処理済/` に json 移動。Graph 経路はクラウド上の json も `処理済` へ PATCH |

初回 Graph delta は **ベースラインのみ**（既存 json を PDF 化しない）。`state/graph-inbox-delta.json` は Git 管理外。

### 13.2 実行環境

| 項目 | 内容 |
|------|------|
| 場所 | **事務 PC** または常時起動 Windows（OneDrive で受付フォルダ同期） |
| 手段 | `scripts/soshiki-form-office/` — **C#**（Excel `dynamic` COM）＋薄い PowerShell。`ExportAsFixedFormat` で PDF |
| Worker | **Excel は動かせない**。受付確認メールは Worker、**事務 PDF は Worker 外** |

### 13.3 用紙 PDF のデータ源

詳細は `docs/soshiki-form-enter.md` §5.10.1。

| 用紙の領域 | データ源 |
|------------|----------|
| 申込日・コード・組合員 | `submission`（現行どおり） |
| 組合名・口欄7・1人あたり掛金 | **`union-master.json`** ＋ **`form-kyosai-map.json`**（Web の `computeFormKuchi` 相当をバッチで再現） |
| フッター（ページ枚数・前月残・備考） | **`submission.SheetFooter`**（Web 送 信時に含める・**実装済み**） |
| 当月（月）・月計 | バッチで **再計算**（`ApplicationDate` / `CoverageMonth`・`Members[].Transfer`・`SheetFooter.PriorMonthHeadcount`） |
| 住所の町村域結合印字 | バッチで Web の `computeTownAreaPrintJoin` 相当、または表示用フィールドを JSON に含める |

### 13.4 返信メール（Worker 本番・事務は手動補助）

| 項目 | 内容 |
|------|------|
| 宛先 | OneDrive **`設定/union-contacts.json`** の `ManagerEmail`（`KyosaikaiCode` 照合） |
| 本番送信 | **Worker** `workers/soshiki-submit/src/receiptMail.js`（Graph **sendMail**・Entra **`Mail.Send`**） |
| 送信元 | 同 **`FromEmail`**（settings）。任意 Secret **`GRAPH_MAIL_USER_ID`**（未設定時は `GRAPH_DRIVE_USER_ID`） |
| BCC | **`FromEmail` と同一**（事務局への送信通知） |
| 失敗時 | 管理者 **`AdminEmail`** に Graph メール（`FailureStage: ReceiptMail`）。Web は申込者向けにメール失敗を表示しない |
| 件名・本文 | `SoshikiFormReceiptMail.ps1` 同等（`組織共済WEB受付_{yyyyMMdd}` 等） |
| 手動・再送 | 事務 PC: `Send-SoshikiFormReceiptEmail.ps1`（`-Send`・Outlook）。**Inbox 自動では送らない** |
| PDF 失敗通知 | `Send-SoshikiFormAdminAlertEmail.ps1`（`-Send`）— 事務 Inbox の Excel 失敗時 |

### 13.5 事務バッチ実装チェックリスト

- [ ] Excel テンプレ（A4 横・印刷範囲・用紙どおり）— 事務側で配置
- [x] JSON → セルマップ・マスタ参照・月計再計算 — `scripts/soshiki-form-office/csharp` + `data/soshiki-form-excel-cell-map.json`
- [x] 手動・一括 PDF — `Export-SoshikiFormPdfFromJson.ps1` / `Process-SoshikiFormJsonInbox.ps1`（既存 `PDF\` はスキップ）
- [x] Inbox 自動（ローカル同期）・Graph delta（`Process-SoshikiFormJsonInboxGraph.ps1`）・PDF 後 `処理済/` 移動
- [ ] 事務 PC への自動タスク登録（Graph  watcher またはローカル Automation・本番で一度設定）
- [x] 返信メール — **Worker 本番稼働**（2026-10-24）。PS は手動・再送用
- [x] 処理済管理（`処理済/` 移動・`-KeepInJson` で無効化可）
- [x] Web: `SheetFooter` 送付・Worker: **JSON のみ**（`pdfBase64` 非対応）

---

## 6. Worker 実装（`workers/soshiki-submit`）

リポジトリ内実装。手順は `workers/soshiki-submit/README.md`。

| 項目 | 実装 |
|------|------|
| POST・CORS | 正規 `https://keijirodokyosai.org`、移行期は `https://keijirodokyosai.github.io` も許可。OPTIONS 対応 |
| Body 上限 | 2MB（JSON のみ） |
| 保存 | `受付/{storageFolder}/json/` に **`.json` 1 件**のみ |
| `pdfBase64` | **拒否**（旧クライアントは再読み込みを促す 400） |
| パスワード | `SOSHIKI_SUBMIT_PASSWORD`（Secret） |
| 受付 ID | `crypto.randomUUID()` の先頭 8 文字（16進） |
| Graph | client_credentials → 所有者 drive に PUT（中間フォルダは Graph が作成） |
| 受付確認メール | PUT 成功後 `sendMail`（settings + union-contacts を drive から GET） |
| エラー | `{ "ok": false, "message": "…" }`（Web は `message` を表示）。保存成功・メール失敗は `ok: true` + `mailSent: false` |
| レート制限 | 未実装（後回し可） |

### Worker 環境変数（例）

| 名前 | 内容 |
|------|------|
| `AZURE_TENANT_ID` | 京滋テナント ID |
| `AZURE_CLIENT_ID` | アプリ登録のアプリ ID |
| `AZURE_CLIENT_SECRET` | シークレット（Workers Secrets） |
| `GRAPH_DRIVE_USER_ID` または `GRAPH_SITE_ID` | 保存先（設計時に1つ決定） |
| `GRAPH_BASE_PATH` | 例: `組織共済WEB受付` |
| `SOSHIKI_SUBMIT_PASSWORD` | Web 送信用パスワード（事務と共有） |
| `GRAPH_MAIL_USER_ID`（任意） | sendMail 送信元ユーザー ID |
| `SOSHIKI_SKIP_RECEIPT_MAIL`（任意） | `1` でメール省略（テスト用） |

---

## 7. Azure / Entra — 管理者チェックリスト

**アカウント方針（確定）:** **`docs/soshiki-m365-accounts.md`**

- [x] **admin** — グローバル管理者・OneDrive **`組織共済WEB受付`** のオーナー（**対外メールアドレスは使わない**）  
- [x] **`info@keijirodokyosai.org`** — admin の **プライマリ SMTP**（事務 From・窓口。手順は `m365-tenant-and-mail.md`）  
- [x] **アプリ登録**（単一テナント推奨）・`Files.ReadWrite.All` + **`Mail.Send`** の管理者同意  
- [x] **Client Secret** → Worker Secrets のみ  
- [x] Worker **`GRAPH_DRIVE_USER_ID`**（＋任意 **`GRAPH_MAIL_USER_ID`）** → **admin のオブジェクト ID**  
- [x] OneDrive `設定/soshiki-form-office-settings.json` の **`FromEmail`** ＝ `info@keijirodokyosai.org`  
- [ ] （任意）秘密のローテーション手順  

**受付確認メール:** Graph `sendMail` は **admin のメールボックス**から **`info@` 差出人**。**本番確認済み（2026-10-24）** — 運用・障害切り分けは **`docs/soshiki-form-receipt-mail-status.md`**。方針は **`docs/soshiki-m365-accounts.md`**。

---

## 8. 未実装・後回し

| 項目 | 備考 |
|------|------|
| **事務バッチ**（§13） | Excel PDF **初版済**。Graph Inbox **初版済**。受付確認メール **Worker 本番稼働**（`docs/soshiki-form-receipt-mail-status.md`） |
| ~~Web **`SheetFooter`** 送付~~ | **完了**（§5.10.1） |
| ~~Worker **JSON のみ**・Web **html2canvas 削除**~~ | **完了** |
| Worker 保存 JSON ラップ | 未実装（本文は `submission` のみ） |
| **union-contacts.json** export | kyosai-system → OneDrive `設定/` |
| Access 取込 | kyosai-system 側 |
| レート制限（Worker） | 後回し可 |

**完了済み（参考）:** Entra・Graph 手動テスト・Worker deploy・`submitEndpointUrl`・OneDrive **json のみ**保存。

---

## 9. 実装フェーズ案（次の Cursor 用）

| フェーズ | 内容 |
|----------|------|
| **0〜3** | Entra・Worker・本番 json 受付 — **完了** |
| **4** | ~~Web: `SheetFooter`・Worker JSON のみ~~ **完了**。残: json ラップ（任意） |
| **5** | ~~受付確認メール（Worker + Graph）~~ **本番稼働（2026-10-24）**。残: Graph Inbox 本番化・`AdminEmail` 最終化 |
| **6** | Access 取込・json 削除運用 |

---

## 10. リポジトリ内キーファイル一覧

```text
soshiki-form-enter.html
js/soshiki-form-submit.js
js/soshiki-form-enter.js          … 送信後印刷（§5.9）
data/soshiki-form-submit-config.json
data/soshiki-form-pdf-layout.json
docs/soshiki-form-enter.md        … §5.10
docs/soshiki-form-submit-worker-graph.md  … 本ファイル
docs/soshiki-m365-accounts.md             … admin / info・ドメイン・切替
docs/soshiki-form-receipt-mail-status.md  … 受付確認メール本番運用・障害切り分け
workers/soshiki-submit/                 … Worker（src/index.js, README, deploy.ps1）
```

---

## 11. 返信メール件名（事務バッチ・案）

確定: `組織共済WEB受付_{yyyyMMdd}`（旧案: `組織共済WEB申込_{組合名}_{yyyyMMdd}`）。  
**本番送信は Worker POST 直後**（§6）。事務 Inbox は PDF のみ。

---

## 12. コミット

リポジトリルール: **コミットは手動**。Worker コードをこの repo に置く場合も同様。

---

**最終更新:** 2026-10-24（受付確認メール本番・§7 チェックリスト更新）
