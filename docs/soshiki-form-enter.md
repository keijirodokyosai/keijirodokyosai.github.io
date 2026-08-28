# 組織共済申込書（ブラウザ入力）設計書

**最終更新:** 2026-08-28  
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
* 申込書の口欄マッピングは **`KyosaiId` のみ**（`CategoryId` / `MinorCategory` は Web では使わない）

---

## 3. Web 側の進捗

### 完了

| 項目 | 内容 |
|------|------|
| 申込日 | 年（4 桁）・月・日。ページ読込時に今日の日付を JS でセット |
| 組合名 | 背景上に入力枠配置（日付欄と同系統の枠線・サイズ） |
| 背景 PNG | `pdf/soshiki-form-enter.pdf` から生成。㊞・不要な線を除去済み |
| `.gitignore` | `_site/` 等の Jekyll 生成物を除外 |
| ローカルプレビュー | `scripts/serve-open.ps1`（Jekyll 起動・URL 表示） |
| マスタ設計 | 本ドキュメント・`data/form-kyosai-map.json`（確定） |

### 未実装

* 産別・支部・分会コード欄
* 共済 **口** 欄・掛金欄（HTML 配置＋マスタ自動反映）
* `union-master.json` 連携（Enter 判定・自動反映）
* 組合名プルダウン（localStorage）
* 確認画面・PDF 出力・メール送信

---

## 4. ファイル構成（Web）

```text
soshiki-form-enter.html      … 入力ページ
js/soshiki-form-enter.js     … 日付初期値・（今後）マスタ連携
css/style.css                … .soshiki-form-* オーバーレイ用
images/soshiki-form-enter.png
pdf/soshiki-form-enter.pdf   … 原本 PDF
data/union-master.json       … 未作成（kyosai-system が出力）
data/form-kyosai-map.json    … 申込書口欄 ↔ KyosaiId 対応（確定）
scripts/serve-open.ps1       … ローカルプレビュー（起動 / -Stop で停止）
scripts/_jekyll-common.ps1   … serve-open 用ヘルパー
docs/soshiki-form-enter.md   … 本ドキュメント
```

---

## 5. 組合名・マスタ連携（確定仕様）

### 5.1 マスタの役割分担

| データ | 置き場所 | 役割 |
|--------|----------|------|
| **union-master.json** | サイト `data/` | 組合名完全一致 → コード・口数内訳・掛金を返す。**UI には一覧を出さない** |
| **form-kyosai-map.json** | サイト `data/` | 申込書の「口」欄と `KyosaiId` の対応、総合・抑制ルール |
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
    ├─ はい → 産別・支部・分会・口欄（7）・掛金を反映
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

## 6. 申込書の共済欄・掛金（確定仕様）

### 6.1 口欄（7 つ）

申込書には漢字の **「口」** がある欄が **7 つ** ある。チェックボックスは使わず、**「口」の位置に数字を表示**する。

| # | 申込書の欄 | formKey |
|---|-----------|---------|
| 1 | 団結共済（労働組合事故見舞共済） | `danketsu` |
| 2 | 組織生命 | `soshiki-seimei` |
| 3 | 組織医療 | `soshiki-iryo` |
| 4 | 組織交通 | `soshiki-kotsu` |
| 5 | 組織火災 | `soshiki-kasai` |
| 6 | 慶弔②（慶弔共済と同義） | `keicho` |
| 7 | 総合共済 | `sogo-kyosai` |

### 6.2 入力可否

| 欄 | 値の出所 | 手入力 |
|----|----------|--------|
| **口**（7 欄） | 組合名 Enter → マスタから計算してセット | **不可**（`readonly`） |
| **掛金** | `kakekinPerPerson` をそのまま表示 | **不可**（`readonly`） |

入力規則（桁数・整数のみなど）は設けないが、**ユーザーが編集することはできない**。

### 6.3 掛金（`kakekinPerPerson`）

* **Access エクスポート時**に `Σ(Premi × Units)` を計算し、`union-master.json` に書き込む
* Web は **表示のみ**（口欄の表示用数字から掛金を再計算しない）
* 表示口数の変換（KyosaiId 42 / 43 など）は掛金計算に使わない（掛金は常に生の `Units × Premi` の合計）

---

## 7. 口欄マッピング（KyosaiId・確定）

申込書の 6 口欄（団結〜慶弔②）は **`KyosaiId` でのみ** 振り分ける。`CategoryId` は Web では参照しない。

| formKey | 申込書の欄 | kyosaiIds | 表示口数 |
|---------|-----------|-----------|----------|
| `danketsu` | 団結共済 | 1, 2 | `Units`（複数行は合算） |
| `soshiki-seimei` | 組織生命 | 6, 45 | 同上 |
| `soshiki-iryo` | 組織医療 | 3, 39, 47 | 同上 |
| `soshiki-kotsu` | 組織交通 | 7, 46 | 同上 |
| `soshiki-kasai` | 組織火災 | 5, 44 | 同上（§7.2 の抑制あり） |
| `keicho` | 慶弔② | 4, 40, 41, 42, 43 | 下表のとおり |

### 7.1 慶弔②の KyosaiId 別表示口数

| kyosaiId | 申込書に入れる口数 |
|----------|-------------------|
| 4, 40, 41 | `Units` |
| **42** | **`Units × 0.5`** |
| **43** | **`Units × 2`** |

### 7.2 KyosaiId 41 と 44 のセット（抑制ルール）

* **KyosaiId 41 があるとき**は、データ上 **KyosaiId 44 もセット**で入っている
* このとき **KyosaiId 44 の口数は口欄に載せない**（組織火災欄にも出さない）
* **KyosaiId 41** は慶弔②欄に `Units` を載せる
* **KyosaiId 44 のみ**（41 なし）のときは、通常どおり **組織火災** 欄に載せる

| kyosai[] の例 | 慶弔② | 組織火災 |
|---------------|-------|----------|
| 41(口A), 44(口B) | A | 空（44 は載せない） |
| 44(口B) のみ | — | B |

`form-kyosai-map.json` の `suppressKyosaiWhenPresent`: `{ "41": [44] }` で表現する。

### 7.3 総合共済

対象は約 **10 団体**。パッケージ内訳（KyosaiId 5, 40, 44, 46 など）は申込書に **載せず**、総合共済の口欄に **常に `1`** と表示する。

| 設定 | 内容 |
|------|------|
| `sogoCollectiveKyosaiIds` | 総合パッケージの `CollectiveKyosaiId` リスト（kyosai-system で確定後に列挙） |
| `sogoHiddenKyosaiIds` | `5, 40, 44, 46` — 総合パッケージ時に **6 口欄へ載せない** 種目 |
| 総合共済の口欄 | **常に `1`**（内訳の合算ではない） |

**§7 の 6 口欄マッピングは省略しない。** 総合と団結などが **同一パッケージに共存** し得る。

#### パターン A — 総合のみ（約 9 団体）

* 総合共済の口 ← `1`
* `sogoHiddenKyosaiIds` に該当する種目は 6 口欄に出さない
* その他の kyosaiId がなければ団結〜慶弔②は空
* 掛金 ← `kakekinPerPerson`

#### パターン B — 総合 ＋ 団結など（1 団体）

例: 総合内訳（5, 40, 44, 46）＋ 団結（KyosaiId 1 または 2 で 10 口）。

* 総合共済の口 ← `1`
* 5, 40, 44, 46 ← 6 口欄に出さない（`sogoHiddenKyosaiIds`）
* 団結共済など ← 上表の `kyosaiIds` で通常マッピング
* 掛金 ← パッケージ全体の `kakekinPerPerson`

---

## 8. Enter 確定後の反映フロー（口・掛金）

```
1. kyosai[] の各行について表示口数を計算
     - kyosaiDisplayRules（42→×0.5, 43→×2）
     - それ以外は Units
2. suppressKyosaiWhenPresent を適用
     - kyosaiId 41 がある → kyosaiId 44 は口欄マッピングから除外
3. collectiveKyosaiId ∈ sogoCollectiveKyosaiIds なら
     - sogoHiddenKyosaiIds（5,40,44,46）を 6 口欄マッピングから除外
4. 残りを form-kyosai-map の kyosaiIds で 6 口欄へ振り分け・合算
5. 総合パッケージなら 総合共済の口 ← "1"、でなければ空
6. 掛金 ← kakekinPerPerson
```

---

## 9. union-master.json 仕様

kyosai-system（Access）から出力。Web は fetch して照合のみ。

### 9.1 関連テーブル

**参照するテーブル**

| テーブル | 用途 |
|----------|------|
| **`Subbranch`** | 共済会（組合）。組合名・産別・支部・分会。**`CollectiveKyosaiId`** で採用パッケージを指す |
| **`CollectiveKyosai`** | 組織共済パッケージ（組合員一律の加入セット） |
| **`CollectiveKyosaiItem`** | パッケージ内訳（`KyosaiId` + 口数 `Units`） |
| **`Kyosai`** | 種目名（`KyosaiName`）、掛金（`Premi`） |

**使わないテーブル:** `UnionMemberKyosai` / `MemberKyosai`（個人の加入契約）

### 9.2 エクスポート経路

**`SetItem` は廃止済み。**

```text
Subbranch（KyosaikaiName, industry, branch, subbranch, CollectiveKyosaiId）
  → CollectiveKyosai
  → CollectiveKyosaiItem（KyosaiId, Units）
  → Kyosai（KyosaiName, Premi）
```

### 9.3 1 組合あたりのフィールド

| JSON フィールド | 意味 |
|----------------|------|
| `code` | 9 桁（産別 3 + 支部 3 + 分会 3） |
| `name` | 組合名（`Subbranch.KyosaikaiName`）— **完全一致キー** |
| `industry` / `branch` / `subbranch` | 各 3 桁 |
| `collectiveKyosaiId` | 組織共済パッケージ ID（総合判定に使用） |
| `kakekinPerPerson` | 1 人あたり月額掛金 = **Σ (Premi × Units)**（エクスポート時に確定） |
| `kyosai[]` | 加入共済の内訳 |

### 9.4 `kyosai[]` の各要素（Web が使用するもの）

| フィールド | 必須 | 意味 |
|-----------|------|------|
| `kyosaiId` | ○ | 種目 ID（口欄マッピングのキー） |
| `kuchi` | ○ | 契約口数（`CollectiveKyosaiItem.Units`） |
| `premi` | ○ | 1 口あたり掛金（エクスポート・検算用） |
| `name` | △ | `Kyosai.KyosaiName`（デバッグ用） |

`categoryId` / `minorCategory` は Access 内部用としてよいが、**Web の口欄反映では使わない**。

### 9.5 サンプル

```json
{
  "updatedAt": "2026-08-28",
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
          "kyosaiId": 3,
          "name": "組織医療",
          "kuchi": 20,
          "premi": 100
        }
      ]
    }
  ]
}
```

### 9.6 ビジネスルール

* 組合員は **全員一律** 同内容で加入
* 申込書の掛金欄 1 つ = 組織共済全体の **1 人あたり月額**

---

## 10. form-kyosai-map.json

機械可読な定義は [`data/form-kyosai-map.json`](../data/form-kyosai-map.json) を正とする。

| キー | 用途 |
|------|------|
| `formFields[].kyosaiIds` | 各口欄に載せる KyosaiId 一覧 |
| `formFields[].kyosaiDisplayRules` | KyosaiId ごとの表示口数変換（慶弔②の 42, 43） |
| `suppressKyosaiWhenPresent` | 41 存在時に 44 を口欄から除外 |
| `sogoCollectiveKyosaiIds` | 総合パッケージ ID リスト |
| `sogoHiddenKyosaiIds` | 総合パッケージ時に 6 口欄へ載せない KyosaiId |
| `sogo-kyosai.displayKuchi` | 総合欄の固定表示値 `1` |

---

## 11. kyosai-system 側の作業

| # | 内容 |
|---|------|
| 1 | `Subbranch.CollectiveKyosaiId` 起点で内訳を取得するエクスポート実装 |
| 2 | `kyosai[]` に `kyosaiId`, `kuchi`, `premi` を出力 |
| 3 | `kakekinPerPerson = Σ(Premi×Units)` をエクスポート時に計算 |
| 4 | 総合扱いの `CollectiveKyosaiId` を確定し、`sogoCollectiveKyosaiIds` に連携 |
| 5 | 1 組合分で検算 → 全組合で出力テスト |
| 6 | `keijirodokyosai.github.io/data/` へ配置 |

詳細は `kyosai-system` の `docs/COLLECTIVE_KYOSAI.md` を参照。

---

## 12. Web 側の今後（実装順）

1. 産別・支部・分会の入力枠を背景に追加
2. `data/union-master.json` を受け取り、Enter 判定・自動反映
3. 共済 **口** 欄（7）・掛金欄を配置し、`form-kyosai-map.json` に従って自動反映（`readonly`）
4. 組合名プルダウン（localStorage）・追加確認・削除 UI
5. 確認画面・PDF 出力・メール送信（任意・後回し可）

---

## 13. ローカルプレビュー

```powershell
.\scripts\serve-open.ps1
```

Jekyll をバックグラウンドで起動し、プレビュー URL を表示して終了する。

**Browser で開く:** ターミナルに表示された URL を **Ctrl+クリック**。

停止:

```powershell
.\scripts\serve-open.ps1 -Stop
```

ブラウザ: `http://127.0.0.1:4000/soshiki-form-enter.html`

* CSS 変更後は **Ctrl+Shift+R** で再読み込み
* `_site/` は `.gitignore` 対象

---

## 14. 関連 PDF

| ファイル | 用途 |
|----------|------|
| `pdf/soshiki-form.pdf` | ダウンロード用（従来） |
| `pdf/soshiki-form-enter.pdf` | 入力ページ背景の原本 |
