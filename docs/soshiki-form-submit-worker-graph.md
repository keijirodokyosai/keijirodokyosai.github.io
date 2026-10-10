# 組織共済 WEB 受付 — 本命ルート（自作フォーム + Cloudflare Workers + Graph）

**目的:** 別セッション・別担当が実装を続けられるよう、2026-10 時点の決定事項と未作業を1本にまとめる。  
**関連:** 入力 UI・JSON 仕様の詳細は `docs/soshiki-form-enter.md` §5.10 以降。本ドキュメントは **送信バックエンド** 専用。

---

## 1. 決定した本命構成

```
[ブラウザ] soshiki-form-enter.html（自作・GitHub Pages）
    │ 送 信ボタン
    ▼ POST（password, unionName, fileNameDate, submission）
[Cloudflare Workers] 中継 API（秘密鍵・パスワードは環境変数のみ）
    │ Microsoft Graph（アプリケーション権限）
    ▼
[事務局 OneDrive] 組織共済WEB受付/受付/{storageFolder}/json/（＋移行完了後は pdf/ は事務側生成）
    │
    ▼ レスポンス { "ok": true, "receiptId": "…" } → Web に受付 ID 表示

[事務 PC・OneDrive 同期後] 未処理 json を1件ずつ処理（§13）
    ① 返信メール（受付確認・PDF 添付なし）
    ② Excel テンプレ → pdf/ に PDF 保存
```

| 項目 | 内容 |
|------|------|
| フロント | 入力・検証・**submission JSON** 送信。組合向け PDF は **送信成功後**のブラウザ印刷（§5.9・保 存ボタンなし） |
| バックエンド | Cloudflare Worker **`workers/soshiki-submit`**（URL を config に書く） |
| 用紙 PDF | **共済会側**（Excel テンプレ＋ PowerShell / Python）。Web の html2canvas は **採用しない**（位置合わせ困難） |
| 返信メール | **共済会側バッチ**（json 着信と同じトリガー）。**PDF は添付しない** |
| 認証 | **Entra ID アプリ登録** + Client Secret（Worker Secrets）。**申込者の Microsoft ログインは不要** |
| Exchange / メール | **Worker 経路では送らない**。事務 PC バッチから Graph / SMTP 等で送信（設計は §13） |
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

| 事実 | 影響 |
|------|------|
| 新規ユーザーに割り当て可能なのが **Power Automate Free** 中心。**Apps for business** は在庫 0（admin 等に割当済み） | **メールボックス用 SKU なし** → メール経路 PA は本命にしない |
| admin: **Apps for business + PA Free**。PA Outlook 接続で **REST API 非対応** | admin を監視用にしない |
| パターン B（受付→転送→監視用）も **REST OK の箱** が要るが未確保 | Graph 直保存で回避 |
| パートナー: Ricoh（`zjc_o365helpdesk@jp.ricoh.com` 等） | ライセンス追加は **Graph 本命では不要**。Entra アプリ登録・同意は管理者作業 |

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
{ "receiptId": "7f3a2b1c", "ok": true }
```

`js/soshiki-form-submit.js` は `receiptId` / `receipt_id` を読んで成功表示。

### 送 信条件（既存）

`validateSoshikiForm()` OK・組合名 Enter 確定・組合員1名以上・パスワード入力。

---

## 5. OneDrive 保存仕様（§5.10 と同一）

### フォルダ

```text
組織共済WEB受付/
  受付/
    yyyy年mm月/          … submission.storageFolder（例 2027年01月）
      json/              … 取込後削除（事務側）。PDF 後は 処理済み/ に移動（Inbox 自動）
      pdf/
      処理済み/          … PDF 済み json
  設定/
    union-contacts.json  … 非公開・返信メール宛先（送信は未実装・Preview-SoshikiFormReceiptEmail.ps1 で文面確認）
```

### ファイル名

```text
{組合名}_{yyyyMMdd}_{受付ID}.json
```

事務バッチが生成する PDF は同 stem で `pdf/` に保存（§13）。Worker は **pdf を書かない**。

- `unionName`・`fileNameDate` は POST トップレベル  
- **受付 ID** は **Worker が生成**（旧設計の PA 生成の代わり）

### submission JSON

`docs/soshiki-form-enter.md` §5.10・**§5.10.1** に準拠。

**現行:** OneDrive の `.json` ファイル本文は **`submission` オブジェクトのみ**（`unionName`・`receiptId` はファイル名から取得）。  
**移行後（推奨）:** Worker が `{ receiptId, unionName, fileNameDate, submission }` を保存し、事務バッチの解析を単純化。

---

## 13. 事務側自動化（PDF・返信メール）— 2026-10 決定

Web では **送 信 PDF を作らない**（html2canvas 経路は削除済み）。取込用 JSON を正とし、**共済会側**で PDF とメールを自動化する。

### 13.1 処理順（1 json ＝ 1 ジョブ）

| 順 | 処理 | 備考 |
|----|------|------|
| 1 | **トリガー** | OneDrive 同期後、事務 PC の **Inbox 自動**（`Register-SoshikiFormJsonInboxAutomation.ps1`：ログオン 60 秒ポール ＋ 1 分タスク）が `json/` をスキャン |
| 2 | **返信メール** | 受付確認（受付 ID・共済会名・申込日など）。**PDF は添付しない** |
| 3 | **PDF 生成** | Excel テンプレに値を書き込み → `pdf/` に `{組合名}_{yyyyMMdd}_{受付ID}.pdf` |
| 4 | **処理済み** | PDF 成功後 `処理済み/` に json 移動（`Invoke-SoshikiFormJsonInboxFile` 既定） |

メールを PDF より先に送るのは **Excel 失敗時も受付通知を届ける**ため。文面に PDF 添付を約束しない。

### 13.2 実行環境

| 項目 | 内容 |
|------|------|
| 場所 | **事務 PC** または常時起動 Windows（OneDrive で受付フォルダ同期） |
| 手段 | `scripts/soshiki-form-office/` — **C#**（Excel `dynamic` COM）＋薄い PowerShell。`ExportAsFixedFormat` で PDF |
| Worker | **Excel は動かせない**。PDF・メールは Worker 外 |

### 13.3 用紙 PDF のデータ源

詳細は `docs/soshiki-form-enter.md` §5.10.1。

| 用紙の領域 | データ源 |
|------------|----------|
| 申込日・コード・組合員 | `submission`（現行どおり） |
| 組合名・口欄7・1人あたり掛金 | **`union-master.json`** ＋ **`form-kyosai-map.json`**（Web の `computeFormKuchi` 相当をバッチで再現） |
| フッター（ページ枚数・前月残・備考） | **`submission.SheetFooter`**（Web 送 信時に含める・**実装済み**） |
| 当月（月）・月計 | バッチで **再計算**（`ApplicationDate` / `CoverageMonth`・`Members[].Transfer`・`SheetFooter.PriorMonthHeadcount`） |
| 住所の町村域結合印字 | バッチで Web の `computeTownAreaPrintJoin` 相当、または表示用フィールドを JSON に含める |

### 13.4 返信メール

| 項目 | 内容 |
|------|------|
| 宛先 | **`union-contacts.json`** の `ManagerEmail`（`KyosaikaiCode` 照合）。Web フォームにメール欄は無い |
| 送信 | **Outlook デスクトップ**（事務 PC）。組合向け: `Send-SoshikiFormReceiptEmail.ps1`（`-Send`）。管理者 PDF 失敗: `Send-SoshikiFormAdminAlertEmail.ps1`（`-Send`） |
| 送信元 | `設定/soshiki-form-office-settings.json` の **`FromEmail`**（Outlook `SendUsingAccount`。環境変数 `SOSHIKI_OFFICE_FROM_EMAIL` で上書き可） |
| 管理者宛先 | 同ファイルの **`AdminEmail`**（`SOSHIKI_OFFICE_ADMIN_EMAIL` で上書き可） |
| BCC | 受付確認メールのみ **`FromEmail` と同一**（事務局への送信通知） |
| 件名 | `組織共済WEB受付_{yyyyMMdd}`（共済会名は含めない） |
| 本文 | 担当者姓・受付完了・**受付 ID**・**共済会**（ラベル）・申込日・署名（京滋労働組合共済会／事務局）。OneDrive パスは記載しない |
| 添付 | **なし**（PDF は `pdf/` にのみ保管） |

### 13.5 事務バッチ実装チェックリスト

- [ ] Excel テンプレ（A4 横・印刷範囲・用紙どおり）— 事務側で配置
- [x] JSON → セルマップ・マスタ参照・月計再計算 — `scripts/soshiki-form-office/csharp` + `data/soshiki-form-excel-cell-map.json`
- [x] 手動・一括 PDF — `Export-SoshikiFormPdfFromJson.ps1` / `Process-SoshikiFormJsonInbox.ps1`（既存 pdf はスキップ）
- [x] Inbox 自動（`Register-SoshikiFormJsonInboxAutomation.ps1`）・PDF 後 `処理済み/` 移動
- [ ] 事務 PC への自動タスク登録（本番 OneDrive パスで一度実行）
- [x] 返信メール送信スクリプト — `Send-SoshikiFormReceiptEmail.ps1`（Inbox からの自動送信は未）
- [x] 処理済み管理（`処理済み/` 移動・`-KeepInJson` で無効化可）
- [x] Web: `SheetFooter` 送付・Worker: **JSON のみ**（`pdfBase64` 非対応）

---

## 6. Worker 実装（`workers/soshiki-submit`）

リポジトリ内実装。手順は `workers/soshiki-submit/README.md`。

| 項目 | 実装 |
|------|------|
| POST・CORS | `https://keijirodokyosai.github.io` のみ。OPTIONS 対応 |
| Body 上限 | 2MB（JSON のみ） |
| 保存 | `受付/{storageFolder}/json/` に **`.json` 1 件**のみ |
| `pdfBase64` | **拒否**（旧クライアントは再読み込みを促す 400） |
| パスワード | `SOSHIKI_SUBMIT_PASSWORD`（Secret） |
| 受付 ID | `crypto.randomUUID()` の先頭 8 文字（16進） |
| Graph | client_credentials → 所有者 drive に PUT（中間フォルダは Graph が作成） |
| エラー | `{ "ok": false, "message": "…" }`（Web は `message` を表示） |
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

---

## 7. Azure / Entra — 管理者チェックリスト

- [ ] **アプリ登録**（単一テナント推奨）  
- [ ] **アプリケーション権限** — 例: `Files.ReadWrite.All`（またはサイト限定で可能なら最小化）  
- [ ] **管理者の同意**  
- [ ] **Client Secret** 発行 → Worker にのみ設定  
- [ ] **保存先の決定** — 特定ユーザーの OneDrive か SharePoint ドキュメント ライブラリか（Graph パス・ドライブ ID）  
- [ ] （任意）秘密のローテーション手順  

**Exchange Online ライセンスはこの経路では不要。**

---

## 8. 未実装・後回し

| 項目 | 備考 |
|------|------|
| **事務バッチ**（§13） | Excel PDF **初版済**。返信メール **送信スクリプト済**（Inbox 連携は未） |
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
| **0〜3** | Entra・Worker・本番 json 受付 — **完了想定** |
| **4** | ~~Web: `SheetFooter`・Worker JSON のみ~~ **完了**。残: json ラップ（任意） |
| **5** | 事務バッチ: メール → Excel PDF（§13） |
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
workers/soshiki-submit/                 … Worker（src/index.js, README, deploy.ps1）
```

---

## 11. 返信メール件名（事務バッチ・案）

確定: `組織共済WEB受付_{yyyyMMdd}`（旧案: `組織共済WEB申込_{組合名}_{yyyyMMdd}`）。  
**Worker POST ではメールを送らない**。送信は §13 の事務 PC バッチ。

---

## 12. コミット

リポジトリルール: **コミットは手動**。Worker コードをこの repo に置く場合も同様。

---

**最終更新:** 2026-10-10（§13 PDF 初版・返信メールプレビュー PS、Web 送 信 PDF 廃止済）
