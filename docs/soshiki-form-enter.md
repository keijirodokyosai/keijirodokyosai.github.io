# 組織共済申込書（ブラウザ入力）設計書

**最終更新:** 2026-08-27  
**関連リポジトリ:** [keijirodokyosai.github.io](https://github.com/keijirodokyosai/keijirodokyosai.github.io)（Web）、`kyosai-system`（Access・マスタ出力）

---

## 1. 概要

組織共済申込書を、公式用紙（PDF）の見た目に合わせて **PC ブラウザ上で入力** する機能。

| 項目 | 内容 |
|------|------|
| 入力ページ | `/soshiki-form-enter.html` |
| 導線 | `downloads.html` 最下部「組織共済申込書入力」 |
| 入力方式 | 背景 PNG（`images/soshiki-form-enter.png`）＋ HTML 入力欄を重ねる |
| 対象端末 | **PC のみ**（スマホは非推奨） |
| 有料ソフト | 不要 |
| Access 直結 | しない（マスタ JSON 経由） |

---

## 2. 設計方針

* 項目は **1 つずつ** 追加し、位置・見た目を都度調整する
* 全組合の一覧プルダウンは **出さない**（関係ない組合を選べないようにする）
* 組合名の正否・自動反映は **`union-master.json`**（裏で読み込み）が担当
* よく使う組合名だけ **ブラウザ localStorage** に記憶（PC ごと）
* 申込書の欄名と DB 種目名は **1 対 1 ではない** → 別途マッピング表を持つ

---

## 3. Web 側の進捗

### 完了（2026-08-27 時点）

| 項目 | 内容 |
|------|------|
| 申込日 | 年（4 桁）・月・日。ページ読込時に今日の日付を JS でセット |
| 組合名 | 背景上に入力枠配置（日付欄と同系統の枠線・サイズ） |
| 背景 PNG | `pdf/soshiki-form-enter.pdf` から生成。㊞・不要な線を除去済み |
| `.gitignore` | `_site/` 等の Jekyll 生成物を除外 |

### 未実装

* 産別・支部・分会コード欄
* 共済チェック欄・口数・掛金欄
* `union-master.json` 連携（Enter 判定・自動反映）
* 組合名プルダウン（localStorage）
* 確認画面・PDF 出力・メール送信

---

## 4. ファイル構成（Web）

```text
soshiki-form-enter.html    … 入力ページ
js/soshiki-form-enter.js   … 日付初期値・（今後）マスタ連携
css/style.css              … .soshiki-form-* オーバーレイ用
images/soshiki-form-enter.png
pdf/soshiki-form-enter.pdf … 原本 PDF
data/union-master.json     … 未作成（kyosai-system が出力）
data/form-kyosai-map.json  … 未作成（申込書欄 ↔ CategoryId 対応）
docs/soshiki-form-enter.md … 本ドキュメント
```

---

## 5. 組合名・マスタ連携（確定仕様）

### 5.1 マスタの役割分担

| データ | 置き場所 | 役割 |
|--------|----------|------|
| **union-master.json** | サイト `data/` | 組合名完全一致 → コード・加入内容・掛金を返す。**UI には一覧を出さない** |
| **form-kyosai-map.json** | サイト `data/` | DB/VBA 名と申込書チェック欄の対応（1 対 1 でない部分） |
| **localStorage** | 各 PC のブラウザ | よく使う組合名だけ記憶。正しさは union-master が担当 |

※ 公開 GitHub Pages でも URL を知れば JSON は取得可能。目的は「画面上で全組合を選べないこと」であり、ファイル自体の秘匿ではない。

### 5.2 組合名の入力 UI

* 初回: **手入力**
* 2 回目以降: **プルダウン**（localStorage に保存した組合名のみ）
* 誤って記憶した名前は **1 件削除 / 全削除** できる UI を付ける

### 5.3 Enter キー確定時の動作

```
組合名を Enter
    ↓
union-master.json の name と完全一致？
    ├─ はい → 産別・支部・分会・加入内容・掛金を反映
    │         記憶リストに未登録なら「組合リストに追加しますか？」
    │         ├─ はい → localStorage に追加
    │         └─ いいえ → 今回だけ使う
    └─ いいえ → 「その組合名は京滋労働共済に登録されていません」
                OK で閉じる
                組合名＋関連項目をすべてクリア
```

* 判定タイミングは **Enter のみ**（blur では行わない）
* 一致時に保存する組合名は、可能なら **マスタ上の正式名称** を使う

---

## 6. union-master.json 仕様

kyosai-system（Access）から出力。Web は fetch して照合のみ。

### 6.1 関連テーブル（整理）

**組織共済申込書の入力 HTML および `union-master.json` 出力で参照するテーブル**

| テーブル | 用途 |
|----------|------|
| **`Subbranch`** | 共済会（組合）。組合名・産別・支部・分会。**`CollectiveKyosaiId`** で採用パッケージを指す |
| **`CollectiveKyosai`** | 組織共済パッケージ（組合員一律の加入セット） |
| **`CollectiveKyosaiItem`** | パッケージ内訳（`KyosaiId` + 口数 `Units`） |
| **`Kyosai`** | 種目名（`KyosaiName`）、掛金（`Premi`）、分類（`CategoryId`） |

**この入力 HTML では使わないテーブル**

| テーブル | 理由 |
|----------|------|
| **`UnionMemberKyosai`** | 組合員ごとの加入契約。申込書入力時点では未確定の個人データ |
| **`MemberKyosai`** | 組合員ごとの共済内訳契約。同上 |

申込書 Web 入力が扱うのは **組合（Subbranch）単位のマスタ**（その組合が採用する組織共済パッケージの内容）であり、組合員個人の加入状態は対象外。

### 6.2 エクスポート経路

**`SetItem` は廃止済み。** 次の経路で出力する。

```text
Subbranch（KyosaikaiName, industry, branch, subbranch, CollectiveKyosaiId）
  → CollectiveKyosai
  → CollectiveKyosaiItem（KyosaiId, Units）
  → Kyosai（KyosaiName, Premi, CategoryId）
```

### 6.3 1 組合あたりのフィールド

| JSON フィールド | 意味 |
|----------------|------|
| `code` | 9 桁（産別 3 + 支部 3 + 分会 3） |
| `name` | 組合名（`Subbranch.KyosaikaiName`）— **完全一致キー** |
| `industry` / `branch` / `subbranch` | 各 3 桁 |
| `collectiveKyosaiId` | 組織共済パッケージ ID |
| `kakekinPerPerson` | 1 人あたり月額掛金 = **Σ (Premi × Units)** |
| `kyosai[]` | 加入共済の内訳 |

### 6.4 `kyosai[]` の各要素

| フィールド | 意味 |
|-----------|------|
| `kyosaiId` | 種目 ID |
| `name` | `Kyosai.KyosaiName` |
| `categoryId` | `Kyosai.CategoryId`（マッピング補助） |
| `kuchi` | 契約口数（`CollectiveKyosaiItem.Units`） |
| `premi` | 1 口あたり掛金 |
| `formKey` | 申込書欄 ID（`form-kyosai-map.json` と対応。エクスポート時または Web 側で付与） |

### 6.5 サンプル

```json
{
  "updatedAt": "2026-08-27",
  "unions": [
    {
      "code": "001001001",
      "name": "〇〇労働組合",
      "industry": "001",
      "branch": "001",
      "subbranch": "001",
      "collectiveKyosaiId": 42,
      "kakekinPerPerson": 2500,
      "kyosai": [
        {
          "kyosaiId": 18,
          "name": "組織医療",
          "categoryId": 13,
          "kuchi": 20,
          "premi": 100,
          "formKey": "soshiki-iryo"
        }
      ]
    }
  ]
}
```

### 6.6 ビジネスルール

* 組合員は **全員一律** 同内容で加入
* 口数は **共済種目ごと** の契約口数
* 申込書の掛金欄 1 つ = 組織共済全体の **1 人あたり月額**

---

## 7. form-kyosai-map.json 仕様

申込書 PDF の欄名と、DB の `CategoryId` / `KyosaiId` を結ぶ **固定表**（Web 側で保守）。

### 7.1 1 対 1 でない理由

| 名称の種類 | 例 |
|------------|-----|
| 申込書の欄 | 団結共済、組織交通、慶弔② |
| DB `KyosaiName` | 組織医療、中央慶弔② |
| VBA 集計名（異動実績用） | 労組見舞全、組織火災 など |

VBA 名は申込書反映には **使わない**。`CategoryId` または `KyosaiId` で申込書欄にマップする。

### 7.2 サンプル

```json
{
  "formFields": [
    { "formKey": "danketsu",       "label": "団結共済",  "match": { "categoryIds": [11, 12] } },
    { "formKey": "soshiki-seimei", "label": "組織生命",  "match": { "categoryIds": [16] } },
    { "formKey": "soshiki-iryo",   "label": "組織医療",  "match": { "categoryIds": [13] } },
    { "formKey": "soshiki-kotsu",  "label": "組織交通",  "match": { "categoryIds": [17] } },
    { "formKey": "soshiki-kasai",  "label": "組織火災",  "match": { "categoryIds": [15] } },
    { "formKey": "keicho2",        "label": "慶弔②",     "match": { "categoryIds": [14] } }
  ]
}
```

※ `categoryIds` の具体値は Access の `KyosaiCategory` と目視照合して確定する。

---

## 8. kyosai-system 側の作業

| # | 内容 |
|---|------|
| 1 | `Subbranch.CollectiveKyosaiId` 起点で内訳を取得するエクスポート実装（`UnionMemberKyosai` / `MemberKyosai` は参照しない） |
| 2 | `union-master.json` 出力 |
| 3 | 1 組合分で `kakekinPerPerson = Σ(Premi×Units)` を検算 |
| 4 | 全組合で出力テスト |
| 5 | `keijirodokyosai.github.io/data/` へ配置（手動 or 自動） |

詳細は `kyosai-system` の `docs/COLLECTIVE_KYOSAI.md` を参照。

---

## 9. Web 側の今後（実装順）

1. 産別・支部・分会の入力枠を背景に追加
2. `data/union-master.json` を受け取り、Enter 判定・自動反映
3. `data/form-kyosai-map.json` を作成し、共済チェック欄を追加
4. 組合名プルダウン（localStorage）・追加確認・削除 UI
5. 確認画面・PDF 出力・メール送信（任意・後回し可）

---

## 10. ローカルプレビュー

リポジトリ直下で:

```powershell
.\scripts\serve-open.ps1
```

Jekyll をバックグラウンドで起動し、プレビュー URL を表示して **終了**する。

**Browser で開く:** ターミナルに表示された URL を **Ctrl+クリック**。

停止:

```powershell
.\scripts\serve-open.ps1 -Stop
```

### 手動

```bash
jekyll serve
```

ブラウザ: `http://127.0.0.1:4000/soshiki-form-enter.html`

* CSS 変更後は **Ctrl+Shift+R** で再読み込み
* `_site/` は `.gitignore` 対象（コミットしない）

---

## 11. 関連 PDF

| ファイル | 用途 |
|----------|------|
| `pdf/soshiki-form.pdf` | ダウンロード用（従来） |
| `pdf/soshiki-form-enter.pdf` | 入力ページ背景の原本 |
