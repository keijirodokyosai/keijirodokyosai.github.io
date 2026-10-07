# 組織共済 WEB 受付 — 本命ルート（自作フォーム + Cloudflare Workers + Graph）

**目的:** 別セッション・別担当が実装を続けられるよう、2026-10 時点の決定事項と未作業を1本にまとめる。  
**関連:** 入力 UI・JSON 仕様の詳細は `docs/soshiki-form-enter.md` §5.10 以降。本ドキュメントは **送信バックエンド** 専用。

---

## 1. 決定した本命構成

```
[ブラウザ] soshiki-form-enter.html（自作・GitHub Pages）
    │ 送 信ボタン
    ▼ POST JSON（password, unionName, fileNameDate, submission, pdfBase64）
[Cloudflare Workers] 中継 API（秘密鍵・パスワードは環境変数のみ）
    │ Microsoft Graph（アプリケーション権限）
    ▼
[事務局 OneDrive / SharePoint] 組織共済WEB受付/受付/{storageFolder}/json|pdf/
    │
    ▼ レスポンス { "ok": true, "receiptId": "…" } → Web に受付 ID 表示
```

| 項目 | 内容 |
|------|------|
| フロント | **変更最小**。`js/soshiki-form-submit.js` は既存 POST 形式のまま。URL は `data/soshiki-form-submit-config.json` の `submitEndpointUrl` |
| バックエンド | **新規** Cloudflare Worker（リポジトリ外でも可。URL を config に書く） |
| 認証 | **Entra ID アプリ登録** + Client Secret（Worker Secrets）。**申込者の Microsoft ログインは不要** |
| Exchange / メール | **不要**（メール → Power Automate 経路は採用しない） |
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
| 送 信 POST | `js/soshiki-form-submit.js` |
| PDF（送信・pdf-lib） | `js/soshiki-form-pdf-fill.js`（座標は `data/soshiki-form-pdf-layout.json`） |
| **保 存** | ブラウザ **印刷 → PDF に保存**（`js/soshiki-form-enter.js`）。送信 PDF とは別経路の調整が継続中の可能性あり |
| 設定 | `data/soshiki-form-submit-config.json` → **`submitEndpointUrl` は空**。Worker デプロイ後に URL を設定 |

### POST ボディ（Worker が受け取る形・変更しない）

```json
{
  "password": "ユーザー入力",
  "unionName": "サンプル労働組合",
  "fileNameDate": "20260903",
  "submission": { … },
  "pdfBase64": "…"
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
      json/              … 取込後削除（事務側）
      pdf/
  設定/
    union-contacts.json  … 非公開・Web に載せない（通知は後述・未実装）
```

### ファイル名

```text
{組合名}_{yyyyMMdd}_{受付ID}.json
{組合名}_{yyyyMMdd}_{受付ID}.pdf
```

- `unionName`・`fileNameDate` は POST トップレベル  
- **受付 ID** は **Worker が生成**（旧設計の PA 生成の代わり）

### submission JSON

`docs/soshiki-form-enter.md` §5.10「submission JSON（確定）」に準拠。組合名は POST の `unionName` のみ（submission 内に含めない）。

---

## 6. Worker 実装タスク（未実装）

1. **POST 受信** — CORS（GitHub Pages オリジン）、Body サイズ（PDF Base64）上限の確認  
2. **パスワード照合** — Worker Secret（例: `SOSHIKI_SUBMIT_PASSWORD`）。GitHub に置かない  
3. **受付 ID 生成** — 推測困難な短い ID（UUID 等）  
4. **Graph 認証** — Client ID + Client Secret（または証明書）でトークン取得  
5. **アップロード** — `json` と `pdf` を所定パスに PUT/CREATE（フォルダ無ければ作成）  
6. **エラー** — 4xx/5xx と JSON `{ "ok": false, "message": "…" }` など（Web の挙動に合わせて調整）  
7. **レート制限** — 任意だが推奨（公開 URL）

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
| Cloudflare Worker 本体 | 別リポジトリでも可 |
| `submitEndpointUrl` 設定 | デプロイ後 |
| 送 信 PDF と **保 存（印刷）** の見た目一致 | `soshiki-form-pdf-fill.js` / 座標調整（§9.0.3） |
| **union-contacts.json** による担当者通知 | 旧 PA 案。Graph でメール送信 or 別バッチ |
| Access 取込 | kyosai-system 側 |
| `docs/soshiki-form-enter.md` §5.10 本文の全面差し替え | 本 doc を正とし、§5.10 はリンク済み |

---

## 9. 実装フェーズ案（次の Cursor 用）

| フェーズ | 内容 |
|----------|------|
| **0** | 管理者: Entra アプリ + 保存先 OneDrive/SharePoint 決定 |
| **1** | Worker: トークン取得 + テストファイル1つアップロード（手動 curl） |
| **2** | Worker: POST 受信・パスワード・`receiptId`・json/pdf 保存 |
| **3** | Web: `submitEndpointUrl` 設定・本番テスト |
| **4** | 送 信 PDF 品質・ドキュメント §5.10 整理・通知（任意） |

---

## 10. リポジトリ内キーファイル一覧

```text
soshiki-form-enter.html
js/soshiki-form-submit.js
js/soshiki-form-pdf-fill.js
js/soshiki-form-enter.js          … 保 存＝印刷
data/soshiki-form-submit-config.json
data/soshiki-form-pdf-layout.json
docs/soshiki-form-enter.md        … §5.10
docs/soshiki-form-submit-worker-graph.md  … 本ファイル
```

---

## 11. メール件名ルール（参考・Graph 本命では不使用）

PA メール経路を検討していた際の案: `組織共済WEB申込_{組合名}_{yyyyMMdd}`、フィルター `組織共済WEB申込`。  
**Worker + Graph ではメールを経由しない**ため、送 信実装では不要。外部へ説明用に残す。

---

## 12. コミット

リポジトリルール: **コミットは手動**。Worker コードをこの repo に置く場合も同様。

---

**最終更新:** 2026-10-07（本命ルート合意・引き継ぎ用初版）
