# 組織共済申込書入力・union-master 設計メモ

**作成目的:** kyosai-system 修正・Web入力フォーム実装の再開用  
**最終更新:** 2026-08-10  
**関連ファイル（Web）:** `soshiki-form-enter.html`, `data/union-master.json`（未作成）, `downloads.html`

---

## 1. Webサイト側の進捗（keijirodokyosai.github.io）

### 完了済み（ステップ1）

- `soshiki-form-enter.html` … 背景PDF（`images/soshiki-form-enter.png`）＋入力欄
- 申込日 … 用紙の上に `yyyy/mm/dd`（今日の日付を JS で自動入力）
- 組合名 … 背景PDF上に配置（位置は今後微調整可）
- `downloads.html` … ページ最下部に「組織共済申込書入力」セクション
  - 説明文:「組織共済申込書は、パソコンから入力できます。スマホ等からの入力は推奨していません。」
  - ボタン:「組織共済 申込書入力」
- **未 push** … 本番 https://keijirodokyosai.github.io/ には未反映

### 方針

- PCのみ想定。スマホ非推奨。
- 入力方式: **背景PDFに入力欄を重ねる（A案）**
- Access は Web から直接参照しない
- マスタは `data/union-master.json`（kyosai-system が出力）

### Web側の今後（再開時）

1. `data/union-master.json` を配置
2. 組合プルダウン（複数記憶可）
3. 組合選択 → 産別・支部・分会・掛金・各共済口数を自動入力
4. 項目を1つずつ追加（産別・支部・分会、共済チェック等）
5. （任意）申込日を背景の日付欄横に移動＋カレンダー
6. 確認画面・PDF出力・メール送信

---

## 2. union-master.json 仕様（確定）

### ファイル

```text
data/union-master.json
```

### 1組合あたりのフィールド

| JSON フィールド | 意味 | データソース |
|----------------|------|--------------|
| `code` | 9桁（産別3+支部3+分会3） | `industry`+`branch`+`subbranch`（文字列・ゼロ埋め） |
| `name` | 組合名 | `subbranch.KyosaikaiName` |
| `industry` | 産別 3桁 | `subbranch` / `Kyosai` |
| `branch` | 支部 3桁 | 同上 |
| `subbranch` | 分会 3桁 | 同上 |
| `kyosaiId` | 組合の Kyosai.Id | `Kyosai`（組合の親レコード） |
| `kakekinPerPerson` | 1人あたり月額掛金（申込書の掛金欄1つ） | **Σ (`Premi` × `Units`)** |
| `kyosai[]` | 加入共済の一覧 | `SetItem` + `Kyosai`（種類） |

### kyosai 配列の各要素

| フィールド | 意味 | ソース |
|-----------|------|--------|
| `itemKyosaiId` | 共済種類の Kyosai.Id | `SetItem.ItemKyosaiId` |
| `name` | 共済名 | `Kyosai.KyosaiName` |
| `kuchi` | 契約口数 | `SetItem.Units` |
| `premi` | 1口あたり掛金 | `Kyosai.Premi` |

### ビジネスルール

- 組合員は**全員一律同内容**で加入
- 口数は**共済ごとの契約口数**
- 掛金欄は申込書上1つ＝組織共済全体の**1人あたり月額**

### JSON サンプル

```json
{
  "updatedAt": "2026-08-10",
  "unions": [
    {
      "code": "001001001",
      "name": "〇〇共済会",
      "industry": "001",
      "branch": "001",
      "subbranch": "001",
      "kyosaiId": 71,
      "kakekinPerPerson": 2500,
      "kyosai": [
        { "itemKyosaiId": 18, "name": "組織医療", "kuchi": 20, "premi": 100 },
        { "itemKyosaiId": 33, "name": "中央慶弔②", "kuchi": 4, "premi": 50 },
        { "itemKyosaiId": 36, "name": "…", "kuchi": 2, "premi": 37 }
      ]
    }
  ]
}
```

---

## 3. Access DB 構造（現状の理解）

### subbranch

- `industry`, `branch`, `subbranch`（各3桁）
- `KyosaikaiName`（組合名）

### Kyosai テーブル（2種類のレコード）

1. **組合の親** … 9桁コードで Id が決まる（例: 001001001 → Id=71）
2. **共済の種類** … Id=1,2,3… / `KyosaiName`, `Premi`, `CategoryI` 等

### SetItem

| 列 | 意味 |
|----|------|
| `SetId` | 行の連番（PK） |
| `KyosaiId` | 組合の `Kyosai.Id` |
| `ItemKyosaiId` | 共済種類の `Kyosai.Id` |
| `Units` | 口数 |

例: KyosaiId=71 → ItemKyosaiId 18(20口), 33(4口), 36(2口)

### エクスポート手順（現状DB）

```text
FOR EACH subbranch:
  1. code, name を取得
  2. 9桁コードで Kyosai（組合親）の Id を取得 → kyosaiId
  3. SetItem WHERE KyosaiId = kyosaiId
  4. 各行: ItemKyosaiId → Kyosai（種類）で name, Premi
  5. kuchi = Units
  6. kakekinPerPerson += Premi × Units
  7. unions に追加
```

---

## 4. DB修正の決定事項

**方針: kyosai-system / Access を修正する**

### 検討結果

- 各組織に組織共済グループは **1つ**
- `Subbranch` に直接リンクを持たせる方がよい
- **推奨: `Subbranch.KyosaiId`**（組合の親 Kyosai.Id を保持）
- `Subbranch.SetId` は、SetItem の行ID（SetId）と混同しやすいため、セット共有が必要になるまで見送り

### kyosai-system でやること（次の作業）

1. **`subbranch` テーブルに `KyosaiId` 列を追加**
2. 既存データを埋める（9桁コード → Kyosai.Id の照合）
3. エクスポート処理を `subbranch.KyosaiId` 起点に簡略化
4. `data/union-master.json` を出力するプログラムを作成
5. 必要なら `keijirodokyosai.github.io/data/` へ配置（手動 or 自動）

### 修正後のエクスポート（目標）

```text
FOR EACH subbranch:
  1. code, name, kyosaiId (= subbranch.KyosaiId)
  2. SetItem WHERE KyosaiId = subbranch.KyosaiId
  3. （以下同じ: kyosai 配列、kakekinPerPerson 計算）
```

---

## 5. 再開時のチェックリスト

### kyosai-system 側

- [ ] `Subbranch.KyosaiId` 追加
- [ ] 既存データ移行
- [ ] union-master.json エクスポート実装
- [ ] 1組合分で検算（kakekinPerPerson = Σ Premi×Units）
- [ ] 全組合で出力テスト

### keijirodokyosai.github.io 側

- [ ] `data/union-master.json` 受け取り
- [ ] 組合プルダウン実装
- [ ] マスタ連動でフォーム自動入力
- [ ] downloads / 入力ページの push

---

## 6. 未決・後回し

- 申込日のカレンダー（PC向け・背景日付欄横に配置は将来）
- 組合名の localStorage 複数記憶（マスタJSONと併用するか）
- ItemKyosaiId → 申込書チェック欄へのマッピング表
- PDF保存・メール送信
- README への本機能の追記
