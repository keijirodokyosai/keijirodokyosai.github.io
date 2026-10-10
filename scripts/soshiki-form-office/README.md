# 組織共済 — 事務 Excel → PDF

OneDrive の受付 `.json` を **Excel テンプレ**に流し込み、**PDF** を出力します。  
セル対応: `data/soshiki-form-excel-cell-map.json`（仕様は `docs/soshiki-form-enter.md` §5.10.1）。

## 前提

- Windows + **Microsoft Excel**（デスクトップ）
- PowerShell 5.1+
- **.NET 8 SDK**（開発・`dotnet run`・テスト）または `dist\SoshikiFormPdf.exe`（`Build-SoshikiFormPdf.ps1`・win-x64 単体 exe）
- テンプレ `.xlsx`（用紙レイアウト済み・未記入セルは空）

## フォルダ構成（OneDrive）

```text
組織共済WEB受付/
  組織共済申込書（PDF化テンプレ）.xlsx   … テンプレ（受付 と同じ階層）
  logs/
    soshiki-form-pdf.log                 … Inbox で -LogToWebRoot 時
  受付/
    2026年11月/
      json/   … Worker が保存（PDF 成功後 処理済 へ移動）
      pdf/    … 本ツールの出力
      処理済/  … PDF 作成済み json（Inbox 既定）
```

テンプレ名は `data/soshiki-form-excel-cell-map.json` の `templateFileName`。  
**フルパスはリポに書かない**（json の位置から相対解決）。

## 使い方

```powershell
cd scripts\soshiki-form-office
.\Verify-SoshikiOfficeScripts.ps1
```

**受付パスと json の場所（手入力しない）**

```powershell
.\Show-SoshikiFormReceptionLayout.ps1
```

`jsonInInbox` とフルパスが一覧される。OneDrive フォルダ名をコピペで組み立てない（改行で壊れやすい）。

**inbox の json を1件 PDF 化**

チャットの `...` や `cd "...\scripts"` は**そのまま実行しない**（パスが壊れて空行＋`>>` になる）。次のどちらかだけ使う。

```powershell
& "C:\Users\deus_\OneDrive\GitHub\keijirodokyosai.github.io\scripts\soshiki-form-office\Export-SoshikiFormPdfFromInboxJson.ps1"
```

（`cd` 不要。リポの場所が違うときは上の1行のパスだけ自分の `keijirodokyosai.github.io` に直す。）

エクスプローラー: `scripts\soshiki-form-office\Export-SoshikiFormPdfFromInboxJson.cmd` をダブルクリック。

すでに `scripts\soshiki-form-office` にいるときだけ: `.\Export-SoshikiFormPdfFromInboxJson.ps1`

inbox 内をすべて: 上と同じスクリプトに `-All`

**特定ファイル** — `Show-SoshikiFormReceptionLayout.ps1` に出たフルパスを `-JsonPath` に渡す（仮の `（ファイル名）` は使わない）。

一括（pdf が無い `json\` だけ処理。成功後は `処理済\` に移動）:

エクスプローラーで `Process-SoshikiFormJsonInbox.cmd` をダブルクリック（**チャットから長い1行を貼ると改行が入り、空行＋`>>` に見える**のを避ける）。

PowerShell で1行だけ（コピー後メモ帳で**1行か確認**してから貼る）:

```powershell
& "C:\Users\deus_\OneDrive\GitHub\keijirodokyosai.github.io\scripts\soshiki-form-office\Process-SoshikiFormJsonInbox.ps1"
```

ログ付き: 上の末尾に `-LogToWebRoot` を付ける。すでに `scripts\soshiki-form-office` にいるときだけ `.\Process-SoshikiFormJsonInbox.ps1`。

`ReceptionRoot` は省略可。`設定/soshiki-form-office-settings.json` の **`ReceptionRoot`**（`…\組織共済WEB受付\受付`）または **`WebRoot`**（`…\組織共済WEB受付`）を読む。事務 M365 では OneDrive ルートが `OneDrive - 京滋労働組合共済会` のことが多い（`examples/soshiki-form-office-settings.example.json`）。JSON にパスが無い場合は `%USERPROFILE%\OneDrive*` 配下から `組織共済WEB受付\受付` を自動検出（1 件だけ見つかったとき）。上書き: `SOSHIKI_OFFICE_RECEPTION_ROOT`、`-ReceptionRoot`。

```powershell
# 引数で明示する例
.\Process-SoshikiFormJsonInbox.ps1 -ReceptionRoot "（受付 フォルダのフルパス）" -LogToWebRoot
```

`-KeepInJson` … PDF 後も `json\` に残す（デバッグ用）。  
`-PreviewReceiptMail` … PDF の直前に受付確認メール下書き（送信なし）。

**自動発火（事務 PC・OneDrive 同期済み）**

```powershell
# ログオン常駐（60 秒ポール）＋ 1 分間隔の予備タスクをまとめて登録
.\Register-SoshikiFormJsonInboxAutomation.ps1
```

個別登録: `Register-SoshikiFormJsonInboxWatcherTask.ps1`（ログオン） / `Register-SoshikiFormJsonInboxTask.ps1`（1 分間隔・`-LogToWebRoot` 付き）。

タスク登録で **アクセスが拒否** される場合: 通常ユーザーで実行（管理者昇格は不要な想定）。それでも失敗する PC ではタスク スケジューラを開き手動作成するか、ログオン後に `Watch-SoshikiFormJsonInbox.ps1` を常駐させる。

`exported=0` かつ `jsonInInbox=0` のときは `ReceptionRoot` が実際の `受付` フォルダと一致しているか確認（出力行の `reception=` を見る）。

SDK が無い事務 PC:

```powershell
.\Build-SoshikiFormPdf.ps1
# → dist\SoshikiFormPdf.exe（SoshikiFormOffice.ps1 内の Invoke が exe を優先）
```

## アーキテクチャ

| 層 | 役割 |
|----|------|
| `Export-*.ps1` / `Process-*.ps1` | CLI 入口（薄い） |
| `SoshikiFormOffice.ps1` | パス解決・ログ・C# 起動 |
| `csharp/` | json・口数・Excel dynamic・PDF |
| `tests/` | 口数の回帰テスト（Excel 不要） |

C# は Office PIA に依存せず `dynamic` で Excel を操作します。

## リポ内ファイル

| パス | 役割 |
|------|------|
| `SoshikiFormOffice.ps1` | 共有関数（本体） |
| `SoshikiFormOfficePaths.ps1` | 上記への互換 dot-source |
| `csharp/` | `SoshikiFormPdf` コンソール |
| `tests/SoshikiFormPdf.Tests/` | xUnit（`KuchiCalculator`） |
| `Export-SoshikiFormPdfFromJson.ps1` | 1 件 |
| `Process-SoshikiFormJsonInbox.ps1` | 一括 |
| `Watch-SoshikiFormJsonInbox.ps1` | ポール常駐 |
| `Register-SoshikiFormJsonInboxWatcherTask.ps1` | ログオンタスク |
| `Register-SoshikiFormJsonInboxTask.ps1` | 1 分間隔タスク |
| `Register-SoshikiFormJsonInboxAutomation.ps1` | 上記 2 つを一括登録 |
| `Build-SoshikiFormPdf.ps1` | publish → `dist/` |
| `SoshikiFormReceiptMail.ps1` | 受付確認メール文面 |
| `Preview-SoshikiFormReceiptEmail.ps1` | 受付確認メールプレビュー（送信なし） |
| `Send-SoshikiFormReceiptEmail.ps1` | 受付確認メール送信（`-Send`） |
| `Invoke-SoshikiFormOutlook.ps1` | Outlook COM（`FromEmail`・任意 `Bcc`） |
| `SoshikiFormPdf.sln` | C# + テストを一括ビルド |
| `Verify-SoshikiOfficeScripts.ps1` | PS パース + `dotnet test` |

## JSON

Worker が保存する **submission オブジェクトのみ**。  
組合名・口欄・掛金は `data/union-master.json` + `data/form-kyosai-map.json` から再計算します。

## OneDrive 設定（リポジトリ外）

| ファイル | 用途 |
|----------|------|
| `設定/union-contacts.json` | 受付確認メール To（`ManagerEmail`） |
| `設定/soshiki-form-office-settings.json` | `AdminEmail`・`FromEmail`・**`ReceptionRoot` または `WebRoot`**（Inbox 自動の受付パス） |

例: `examples/soshiki-form-office-settings.example.json`  
環境変数: `SOSHIKI_OFFICE_ADMIN_EMAIL` / `SOSHIKI_OFFICE_FROM_EMAIL` があれば各キーより優先。

## 返信メール（組合担当者）

```powershell
.\Preview-SoshikiFormReceiptEmail.ps1 -JsonPath '（json フルパス）'

# Outlook で下書き表示（送信しない）
.\Send-SoshikiFormReceiptEmail.ps1 -JsonPath '…'

# 送信（BCC = FromEmail）
.\Send-SoshikiFormReceiptEmail.ps1 -JsonPath '…' -Send
```

`FromEmail` は Outlook に登録済みの SMTP アドレスと一致させる（`SendUsingAccount`）。

## 管理者アラート（PDF 失敗など）

```powershell
.\Preview-SoshikiFormAdminAlertEmail.ps1 -JsonPath '（json フルパス）' -ErrorMessage "（エラー内容）"

# Outlook で下書き表示（送信しない）
.\Send-SoshikiFormAdminAlertEmail.ps1 -JsonPath '…' -ErrorMessage '…'

# 送信
.\Send-SoshikiFormAdminAlertEmail.ps1 -JsonPath '…' -ErrorMessage '…' -Send
```

Outlook **Classic**（COM）が必要です。Inbox からの自動連携は別途実装予定。

## 開発（C#）

```powershell
dotnet test SoshikiFormPdf.sln -c Release
```
