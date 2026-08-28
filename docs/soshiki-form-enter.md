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
| 背景 PNG | `pdf/soshiki-form-enter.pdf` から生成。㊞除去済み。組合員欄の郵便番号用 **背景ハイフン** 除去済み（§9.7） |
| `.gitignore` | `_site/` 等の Jekyll 生成物を除外 |
| ローカルプレビュー | `scripts/serve-open.ps1`（Jekyll 起動・URL 表示） |
| マスタ設計 | 本ドキュメント・`data/form-kyosai-map.json`（確定） |
| 産別・支部・分会 | 背景上に 3 桁×3 の入力枠（`readonly`）・Enter でマスタ反映 |
| Enter 連携 | `union-master.json` 読込・組合名判定・コード・口欄（7）・掛金を自動反映 |
| 共済口欄（7）・掛金 | HTML 配置完了（配置確認用仮表示あり） |

### 未実装

* 組合員各欄の **CSS 位置の最終調整**（現状は初期値・要微調整）
* 組合名プルダウン（localStorage）・追加確認・削除 UI
* `validateSoshikiForm()` の確認画面・送信ボタンへの **配線**
* 開発用仮表示（§14）の **本番前削除**
* 確認画面・PDF 出力・メール送信
* 本番用 `union-master.json` の kyosai-system からの出力・配置

### 完了（組合員入力・2026-08-28）

| 項目 | 内容 |
|------|------|
| 異動内容 | 5行×（新規／解約／変更）トグル。実線枠・再クリックで解除 |
| 組合員各欄 | コード・氏名・生年月日・性別・郵便番号・住所（HTML/CSS 配置済み） |
| 半角制限 | カナ・コード・生年月日・郵便番号 |
| blur 処理 | コード左0埋め、月日2桁化、生年月日の実在日チェック |
| 郵便番号 | zipcloud API で住所自動入力（任意） |
| 必須チェック | `validateSoshikiForm()`（確認画面用・未配線） |

---

## 4. ファイル構成（Web）

```text
soshiki-form-enter.html      … 入力ページ
js/soshiki-form-enter.js     … 日付初期値・マスタ連携（Enter 判定・口・掛金反映）
js/soshiki-form-members.js   … 組合員5行・異動トグル・半角制限・郵便番号検索
_includes/soshiki-form-member-rows.html … 組合員行マークアップ
css/style.css                … .soshiki-form-* オーバーレイ用
images/soshiki-form-enter.png
pdf/soshiki-form-enter.pdf   … 原本 PDF
data/union-master.json       … 開発用サンプル（kyosai-system 本番出力で置換）
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

#### 名称一致のキー（確定）

組合名の正否判定は、Access **`Subbranch` テーブルの `KyosaikaiName`** に対して行う。

| 項目 | 内容 |
|------|------|
| Access | `Subbranch.KyosaikaiName` |
| エクスポート | `union-master.json` の **`name`** フィールド |
| Web の照合 | 入力欄の文字列と **`name`（= `KyosaikaiName`）の完全一致** |
| 照合方式 | 部分一致・あいまい検索は **しない** |
| 正規化 | 前後の空白のみ `trim`（全角半角変換・大文字小文字変換はしない） |

一致時は、入力欄の表記ゆれを避けるため **`KyosaikaiName`（`name`）の値で組合名欄を上書き**する。

```
組合名を Enter
    ↓
入力文字列（trim 後）と union-master.json の name（= Subbranch.KyosaikaiName）が完全一致？
    ├─ はい → 産別・支部・分会・口欄（7）・掛金を反映
    │         組合名欄 ← KyosaikaiName（name）
    │         記憶リストに未登録なら「組合リストに追加しますか？」
    │         ├─ はい → localStorage に追加
    │         └─ いいえ → 今回だけ使う
    └─ いいえ → 「その組合名は京滋労働共済に登録されていません」
                OK で閉じる
                組合名＋関連項目をすべてクリア
```

* 判定タイミングは **Enter のみ**（blur では行わない）
* localStorage に保存する組合名も **`KyosaikaiName`（`name`）** を使う

### 5.4 産別・支部・分会コード

| 項目 | 内容 |
|------|------|
| 桁数 | 各 **3 桁**（`industry` / `branch` / `subbranch`） |
| 入力 | **手入力不可**（`readonly`） |
| 反映 | 組合名 Enter 確定時に `union-master.json` からセット |
| 縦位置・高さ | 共済口欄と同じ（`top: 28.5%` / `height: 2.8%`） |
| 幅 | 各 **`5.7%`** |
| 字間・字位置 | `letter-spacing: 0.52em` / `text-indent: 0.27em` / `font-variant-numeric: tabular-nums` |
| 横位置（`left`） | 産別 **`6%`** / 支部 **`11.7%`** / 分会 **`17.4%`**（枠同士は隙間なく接続） |
| 背景 | **透明**（`background: transparent`） |
| HTML id | `industry-code` / `branch-code` / `subbranch-code` |

### 5.5 共済口欄・掛金（CSS 配置・確定）

口欄・掛金もコード欄と同じ行（`top: 28.5%` / `height: 2.8%`）。背景は透明。

**口欄（幅 `3.1%`）**

| formKey | 申込書の欄 | `left` |
|---------|-----------|--------|
| `danketsu` | 団結共済 | 29.7% |
| `soshiki-seimei` | 組織生命 | 35.4% |
| `soshiki-iryo` | 組織医療 | 41.1% |
| `soshiki-kotsu` | 組織交通 | 46.8% |
| `soshiki-kasai` | 組織火災 | 52.5% |
| `keicho` | 慶弔② | 58.2% |
| `sogo-kyosai` | 総合共済 | 63.9% |

**掛金**

| 項目 | 値 |
|------|-----|
| HTML id | `kakekin-per-person` |
| `left` | **81.9%** |
| `width` | **7.75%**（団結口欄幅 3.1% の 2.5 倍） |
| 文字揃え | 右寄せ（`text-align: right`） |

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
| `sogoCollectiveKyosaiIds` | 総合パッケージの **`CollectiveKyosaiId`** リスト（確定）: **19, 41, 44, 55, 57, 58, 88, 95, 97, 98** |
| `sogoHiddenKyosaiIds` | **`KyosaiId`** `5, 40, 44, 46` — 総合パッケージ時に **6 口欄へ載せない** 種目 |
| 総合共済の口欄 | **常に `1`**（内訳の合算ではない） |

※ `sogoCollectiveKyosaiIds` の **41, 44** は **パッケージ ID**（`union.collectiveKyosaiId` と比較）。§7.2 の **KyosaiId 41 / 44** や `sogoHiddenKyosaiIds` の **44** は **種目 ID** であり、別物。

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

## 9. 組合員入力（最大5名・確定仕様）

1画面に **5行** まで入力できる。完全に空の行は無視する。

### 9.1 異動内容

| 項目 | 内容 |
|------|------|
| 選択肢 | **新規** / **解約** / **変更**（1行につき0または1つ） |
| 操作 | クリックで実線の楕円枠。別の選択肢で切替。同じ選択肢の再クリックで解除 |
| 値 | `shinki` / `kaiyaku` / `henkou`（hidden input） |

### 9.2 必須項目

**申込全体:** 申込日（年・月・日）、組合名（マスタ一致済み）

**行に1項目でも入力がある場合:**

| 必須 | 任意 |
|------|------|
| 異動内容、漢字姓・名、半角カナ姓・名、生年月日（年4桁・月・日）、性別 | 組合員コード、住所（〒・番地） |

### 9.3 半角・正規化（blur 時）

| 欄 | 入力制限 | blur 時 |
|----|----------|---------|
| カナ姓・名 | 半角カナのみ（全角カナ・ひらがな・漢字は除去） | — |
| 組合員コード | 半角数字、最大6桁 | 左0埋めで6桁表示 |
| 生年月日 | 半角数字。全角数字は半角に変換 | 月・日は2桁化。年・月・日が揃えば実在日チェック |
| 郵便番号 | 半角数字7桁、表示は `123-4567` | 7桁そろえば zipcloud で住所候補を自動入力 |

### 9.4 性別・郵便番号

* 性別: 男（`1`）/ 女（`2`）。再クリックで解除可
* 郵便番号: **1枠**・値は `123-4567` 形式。7桁連続入力可
* 郵便番号 API: `https://zipcloud.ibsnet.co.jp/api/search?zipcode=`（方式1・外部API。API には数字7桁のみ渡す）

### 9.5 CSS 配置（初期値・要調整）

| 変数 | 値 |
|------|-----|
| 1行目 `top` | `37.45%`（PNG 実測） |
| 行間 | `7.66%` |
| 行の高さ | `7.55%` |

### 9.6 バリデーション

確認画面・送信前に `validateSoshikiForm()`（`js/soshiki-form-members.js`）を呼ぶ。現状は **関数のみ実装**（UI 未配線）。

### 9.7 背景 PNG の郵便番号ハイフン除去（2026-08-28 完了）

旧来紙の `〒 [___]-[____]` 形式に合わせて PDF 由来 PNG に印刷されていた **背景の `-`（ハイフン）** を、HTML 入力欄の **1 枠郵便番号**（§9.4）に合わせて除去した。

| 項目 | 内容 |
|------|------|
| 対象ファイル | `images/soshiki-form-enter.png` |
| 除去対象 | 各組合員行の住所欄・郵便番号行に印刷されていた横棒（**画面中央寄り・郵便番号入力枠の直左**） |
| 画像上の位置（1684×1191px 基準） | 横 **約 71.0%〜71.8%**、縦は行ごとに **y ≈ 465 / 556 / 648 / 739 / 831** 付近（±2px） |
| 触れないもの | **〒**（約 60.9%）、縦罫線（約 64.7%）、住所欄の横罫線、その他の枠線 |
| 注意 | **62〜64% 付近**にも旧 2 枠間の小さな `-` があるが、画面上で目立つのは **71% 付近** の方。CSS オーバーレイで隠す方式は使わない（PNG を直接編集する） |
| キャッシュ | `soshiki-form-enter.html` の PNG URL にクエリ（例 `?v=20260828-hyphen-71pct`）。変更後は **Ctrl+Shift+R** |

---

## 10. union-master.json 仕様

kyosai-system（Access）から出力。Web は fetch して照合のみ。

### 10.1 関連テーブル

**参照するテーブル**

| テーブル | 用途 |
|----------|------|
| **`Subbranch`** | 共済会（組合）。組合名・産別・支部・分会。**`CollectiveKyosaiId`** で採用パッケージを指す |
| **`CollectiveKyosai`** | 組織共済パッケージ（組合員一律の加入セット） |
| **`CollectiveKyosaiItem`** | パッケージ内訳（`KyosaiId` + 口数 `Units`） |
| **`Kyosai`** | 種目名（`KyosaiName`）、掛金（`Premi`） |

**使わないテーブル:** `UnionMemberKyosai` / `MemberKyosai`（個人の加入契約）

### 10.2 エクスポート経路

**`SetItem` は廃止済み。**

```text
Subbranch（KyosaikaiName, industry, branch, subbranch, CollectiveKyosaiId）
  → CollectiveKyosai
  → CollectiveKyosaiItem（KyosaiId, Units）
  → Kyosai（KyosaiName, Premi）
```

### 10.3 1 組合あたりのフィールド

| JSON フィールド | 意味 |
|----------------|------|
| `code` | 9 桁（産別 3 + 支部 3 + 分会 3） |
| `name` | 組合名 — **`Subbranch.KyosaikaiName` をそのまま出力**。Enter 時の **完全一致キー** |
| `industry` / `branch` / `subbranch` | 各 3 桁 |
| `collectiveKyosaiId` | 組織共済パッケージ ID（総合判定に使用） |
| `kakekinPerPerson` | 1 人あたり月額掛金 = **Σ (Premi × Units)**（エクスポート時に確定） |
| `kyosai[]` | 加入共済の内訳 |

### 10.4 `kyosai[]` の各要素（Web が使用するもの）

| フィールド | 必須 | 意味 |
|-----------|------|------|
| `kyosaiId` | ○ | 種目 ID（口欄マッピングのキー） |
| `kuchi` | ○ | 契約口数（`CollectiveKyosaiItem.Units`） |
| `premi` | ○ | 1 口あたり掛金（エクスポート・検算用） |
| `name` | △ | `Kyosai.KyosaiName`（デバッグ用） |

`categoryId` / `minorCategory` は Access 内部用としてよいが、**Web の口欄反映では使わない**。

### 10.5 サンプル

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

### 10.6 ビジネスルール

* 組合員は **全員一律** 同内容で加入
* 申込書の掛金欄 1 つ = 組織共済全体の **1 人あたり月額**

---

## 11. form-kyosai-map.json

機械可読な定義は [`data/form-kyosai-map.json`](../data/form-kyosai-map.json) を正とする。

| キー | 用途 |
|------|------|
| `formFields[].kyosaiIds` | 各口欄に載せる KyosaiId 一覧 |
| `formFields[].kyosaiDisplayRules` | KyosaiId ごとの表示口数変換（慶弔②の 42, 43） |
| `suppressKyosaiWhenPresent` | 41 存在時に 44 を口欄から除外 |
| `sogoCollectiveKyosaiIds` | 総合パッケージ **`CollectiveKyosaiId`** リスト（19, 41, 44, 55, 57, 58, 88, 95, 97, 98） |
| `sogoHiddenKyosaiIds` | 総合パッケージ時に 6 口欄へ載せない KyosaiId |
| `sogo-kyosai.displayKuchi` | 総合欄の固定表示値 `1` |

---

## 12. kyosai-system 側の作業

| # | 内容 |
|---|------|
| 1 | `Subbranch.CollectiveKyosaiId` 起点で内訳を取得するエクスポート実装 |
| 2 | `kyosai[]` に `kyosaiId`, `kuchi`, `premi` を出力 |
| 3 | `kakekinPerPerson = Σ(Premi×Units)` をエクスポート時に計算 |
| 4 | ~~総合扱いの `CollectiveKyosaiId` を確定し、`sogoCollectiveKyosaiIds` に連携~~ → **確定済み**（Web 側 `form-kyosai-map.json` に反映） |
| 5 | 1 組合分で検算 → 全組合で出力テスト |
| 6 | `keijirodokyosai.github.io/data/` へ配置 |

詳細は `kyosai-system` の `docs/COLLECTIVE_KYOSAI.md` を参照。

---

## 13. Web 側の今後（実装順）

1. ~~産別・支部・分会の入力枠を背景に追加~~ → **完了**
2. ~~`data/union-master.json` を受け取り、Enter 判定・コード・口欄・掛金反映~~ → **完了**
3. ~~組合員5行（異動内容・氏名・生年月日・性別・住所）・半角制限・郵便番号検索~~ → **完了**（位置は要微調整）
4. ~~背景 PNG の郵便番号ハイフン除去~~ → **完了**（§9.7）
5. 組合員欄 CSS の最終調整・開発用仮表示の削除
6. 組合名プルダウン（localStorage）・追加確認・削除 UI
7. `validateSoshikiForm()` の配線 → 確認画面・PDF 出力・メール送信（任意・後回し可）

---

## 14. ローカルプレビュー

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

### 配置調整時の仮表示（開発用）

枠の位置合わせのため、`soshiki-form-enter.html` の `value` に仮の1文字を入れている。**本番前に削除**する。

| 欄 | 仮表示 |
|----|--------|
| 産別 | 000（3桁・字間調整） |
| 支部 | 000（3桁・字間調整） |
| 分会 | 000（3桁・字間調整） |
| 団結共済 | 団 |
| 組織生命 | 生 |
| 組織医療 | 医 |
| 組織交通 | 交 |
| 組織火災 | 火 |
| 慶弔② | 慶 |
| 総合共済 | 総 |
| 掛金 | 金 |

**組合員5行**（`_includes/soshiki-form-member-rows.html` の `placeholder` / `.soshiki-form-dev-marker`）:

| 欄 | 仮表示（N = 1〜5） |
|----|-------------------|
| 異動・新規／解約／変更 | 新N / 解N / 変N |
| 組合員コード（6マス） | ｺ1〜ｺ6（桁位置） |
| カナ姓・名 | ｾｲN / ﾒｲN |
| 漢字姓・名 | 姓N / 名N |
| 生年月日 | 年N / 月N / 日N |
| 性別 | 男N / 女N |
| 郵便番号 | `郵N`（1枠・配置確認用） |
| 住所 | 住所N |

組合名 Enter でマスタ反映すると上書きされる。未登録名で Enter するとクリアされる。

---

## 15. 関連 PDF

| ファイル | 用途 |
|----------|------|
| `pdf/soshiki-form.pdf` | ダウンロード用（従来） |
| `pdf/soshiki-form-enter.pdf` | 入力ページ背景の原本 |
