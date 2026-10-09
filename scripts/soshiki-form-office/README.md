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
      json/   … Worker が保存
      pdf/    … 本ツールの出力
      processed/  … 任意（Inbox で -MoveToProcessed 時のみ）
```

テンプレ名は `data/soshiki-form-excel-cell-map.json` の `templateFileName`。  
**フルパスはリポに書かない**（json の位置から相対解決）。

## 使い方

```powershell
cd scripts\soshiki-form-office
.\Verify-SoshikiOfficeScripts.ps1

.\Export-SoshikiFormPdfFromJson.ps1 -JsonPath "（json のフルパス）"
```

一括（pdf が無い json だけ処理）:

```powershell
.\Process-SoshikiFormJsonInbox.ps1 -ReceptionRoot "（受付 フォルダのフルパス）" -LogToWebRoot -PreviewReceiptMail
```

`-PreviewReceiptMail` は PDF 出力の直前に受付確認メール下書きを表示（§13 のメール→PDF の順のリハーサル。送信はしない）。

定期実行の例（5 分間隔）:

```powershell
.\Register-SoshikiFormJsonInboxTask.ps1 -ReceptionRoot "（受付 フォルダのフルパス）"
```

（タスクからログを残す場合は `Register-*.ps1` の引数に `-LogToWebRoot` を足すか、タスクの引数を手で編集。）

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
| `Register-SoshikiFormJsonInboxTask.ps1` | タスク登録例 |
| `Build-SoshikiFormPdf.ps1` | publish → `dist/` |
| `Preview-SoshikiFormReceiptEmail.ps1` | 受付確認メール下書き（送信なし） |
| `SoshikiFormPdf.sln` | C# + テストを一括ビルド |
| `Verify-SoshikiOfficeScripts.ps1` | PS パース + `dotnet test` |

## JSON

Worker が保存する **submission オブジェクトのみ**。  
組合名・口欄・掛金は `data/union-master.json` + `data/form-kyosai-map.json` から再計算します。

## 返信メール（プレビューのみ）

送信は未実装。OneDrive に `設定/union-contacts.json` がある前提で文面を確認:

```powershell
.\Preview-SoshikiFormReceiptEmail.ps1 -JsonPath "（json のフルパス）"
```

## 開発（C#）

```powershell
dotnet test SoshikiFormPdf.sln -c Release
```
