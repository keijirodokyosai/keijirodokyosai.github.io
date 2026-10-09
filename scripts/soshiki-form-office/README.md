# 組織共済 — 事務 Excel → PDF

OneDrive の受付 `.json` を **Excel テンプレ**に流し込み、**PDF** を出力します。  
セル対応: `data/soshiki-form-excel-cell-map.json`（仕様は `docs/soshiki-form-enter.md` §5.10.1）。

## 前提

- Windows + **Microsoft Excel**（デスクトップ）
- PowerShell 5.1+
- テンプレ `.xlsx`（用紙レイアウト済み・未記入セルは空）

## 使い方

```powershell
cd scripts\soshiki-form-office

.\Fill-SoshikiFormExcel.ps1 `
  -JsonPath "D:\OneDrive\組織共済WEB受付\受付\2026年11月\json\合同互助会_20261109_abc12345.json" `
  -TemplatePath "D:\templates\組織共済申込書.xlsx" `
  -OutputPdfPath "D:\OneDrive\組織共済WEB受付\受付\2026年11月\pdf\合同互助会_20261109_abc12345.pdf"
```

`-UnionMasterPath` / `-KyosaiMapPath` を省略すると、リポジトリの `data/union-master.json` と `data/form-kyosai-map.json` を使います。  
本番マスタに差し替える場合はパスを指定してください。

デバッグ: `-LeaveExcelOpen` で Excel を開いたままにします。

## ファイル

| ファイル | 役割 |
|----------|------|
| `Fill-SoshikiFormExcel.ps1` | JSON 読込 → Excel COM → PDF |
| `SoshikiFormKuchi.ps1` | 口数・掛金（Web `computeFormKuchi` 相当） |

## JSON

Worker が保存する **submission オブジェクトのみ**（ファイル名から受付 ID を取る想定）。  
組合名・口欄・掛金は `union-master` + `form-kyosai-map` から再取得します。

## 未実装（今後）

- フォルダ監視・未処理 json の一括処理
- 処理済み json の移動・メール送信
