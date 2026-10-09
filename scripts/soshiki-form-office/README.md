# 組織共済 — 事務 Excel → PDF

OneDrive の受付 `.json` を **Excel テンプレ**に流し込み、**PDF** を出力します。  
セル対応: `data/soshiki-form-excel-cell-map.json`（仕様は `docs/soshiki-form-enter.md` §5.10.1）。

## 前提

- Windows + **Microsoft Excel**（デスクトップ）
- PowerShell 5.1+
- **.NET 8 SDK**（開発・`dotnet run`）または `dist\SoshikiFormPdf.exe`（`Build-SoshikiFormPdf.ps1` で作成）
- テンプレ `.xlsx`（用紙レイアウト済み・未記入セルは空）

## フォルダ構成（OneDrive）

```text
組織共済WEB受付/
  組織共済申込書（PDF化テンプレ）.xlsx   … テンプレ（受付 と同じ階層）
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
.\Process-SoshikiFormJsonInbox.ps1 -ReceptionRoot "（受付 フォルダのフルパス）"
```

定期実行の例（5 分間隔・要管理者権限は環境による）:

```powershell
.\Register-SoshikiFormJsonInboxTask.ps1 -ReceptionRoot "（受付 フォルダのフルパス）"
```

SDK が無い事務 PC 向けに exe を置く場合:

```powershell
.\Build-SoshikiFormPdf.ps1
# → dist\SoshikiFormPdf.exe（Invoke は exe を優先）
```

## アーキテクチャ

| 層 | 役割 |
|----|------|
| `Export-*.ps1` / `Process-*.ps1` | パス解決・一括・タスク登録（薄い PS） |
| `Invoke-SoshikiFormPdf.ps1` | `dist\*.exe` または `dotnet run` |
| `csharp/` | json 読込・口数・Excel COM（dynamic）・PDF |

C# は Office PIA に依存せず `dynamic` で Excel を操作します（GAC の古い Interop と Excel 16 の不一致を避ける）。

## ファイル一覧

| ファイル | 役割 |
|----------|------|
| `csharp/` | `SoshikiFormPdf` コンソール（本体） |
| `Invoke-SoshikiFormPdf.ps1` | C# 起動の共通入口 |
| `Export-SoshikiFormPdfFromJson.ps1` | 1 件 json → pdf |
| `Process-SoshikiFormJsonInbox.ps1` | 受付配下をスキャン |
| `Register-SoshikiFormJsonInboxTask.ps1` | スケジュールタスク登録例 |
| `Build-SoshikiFormPdf.ps1` | `dist\SoshikiFormPdf.exe` を publish |
| `SoshikiFormOfficePaths.ps1` | json からテンプレ・pdf パス（Inbox 用） |
| `Verify-SoshikiOfficeScripts.ps1` | パース検証 + `dotnet build` |

## JSON

Worker が保存する **submission オブジェクトのみ**。  
組合名・口欄・掛金は `data/union-master.json` + `data/form-kyosai-map.json` から再計算します。
