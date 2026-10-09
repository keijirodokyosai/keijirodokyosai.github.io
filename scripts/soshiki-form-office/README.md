# 組織共済 — 事務 Excel → PDF

OneDrive の受付 `.json` を **Excel テンプレ**に流し込み、**PDF** を出力します。  
セル対応: `data/soshiki-form-excel-cell-map.json`（仕様は `docs/soshiki-form-enter.md` §5.10.1）。

## 前提

- Windows + **Microsoft Excel**（デスクトップ）
- PowerShell 5.1+
- テンプレ `.xlsx`（用紙レイアウト済み・未記入セルは空）

## フォルダ構成（OneDrive）

```text
組織共済WEB受付/
  組織共済申込書（PDF化テンプレ）.xlsx   … テンプレ（受付 と同じ階層）
  受付/
    2026年11月/
      json/   … Worker が保存
      pdf/    … 本スクリプトの出力
```

テンプレ名は `data/soshiki-form-excel-cell-map.json` の `templateFileName`。  
**フルパスはスクリプトに書かない**（PC ごとの OneDrive パス差を吸収）。

## 使い方（おすすめ）

```powershell
cd scripts\soshiki-form-office

.\Export-SoshikiFormPdfFromJson.ps1 `
  -JsonPath "..\..\..\..\OneDrive - …\組織共済WEB受付\受付\2026年11月\json\合同互助会_20261109_abc12345.json"
```

`-TemplatePath` は **省略可**（json の位置からテンプレを自動解決）。  
上の JsonPath は例です。実際は **json へのパスだけ**渡せばよいです。

```powershell
# 受付フォルダ内で実行する例
cd "…\組織共済WEB受付\受付\2026年11月"
..\..\..\..\path\to\repo\scripts\soshiki-form-office\Export-SoshikiFormPdfFromJson.ps1 -JsonPath ".\json\合同互助会_20261109_abc12345.json"
```

手動でテンプレを指定する場合のみ `-TemplatePath` を付けます。

### 低レベル API

```powershell
.\Fill-SoshikiFormExcel.ps1 `
  -JsonPath "…\json\xxx.json" `
  -TemplatePath "…\組織共済申込書（PDF化テンプレ）.xlsx" `
  -OutputPdfPath "…\pdf\xxx.pdf"
```

`-UnionMasterPath` / `-KyosaiMapPath` を省略すると、リポジトリの `data/union-master.json` と `data/form-kyosai-map.json` を使います。  
本番マスタに差し替える場合はパスを指定してください。

デバッグ: `-LeaveExcelOpen` で Excel を開いたままにします。

## ファイル

| ファイル | 役割 |
|----------|------|
| `Fill-SoshikiFormExcel.ps1` | JSON 読込 → Excel COM → PDF |
| `Export-SoshikiFormPdfFromJson.ps1` | json → 同 stem の pdf（テンプレ自動） |
| `SoshikiFormOfficePaths.ps1` | 受付/json からテンプレ・pdf パス解決 |
| `SoshikiFormKuchi.ps1` | 口数・掛金（Web `computeFormKuchi` 相当） |

## JSON

Worker が保存する **submission オブジェクトのみ**（ファイル名から受付 ID を取る想定）。  
組合名・口欄・掛金は `union-master` + `form-kyosai-map` から再取得します。

## 未実装（今後）

- フォルダ監視・未処理 json の一括処理
- 処理済み json の移動・メール送信
