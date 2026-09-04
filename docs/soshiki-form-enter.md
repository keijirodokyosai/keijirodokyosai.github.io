# 組織共済申込書（ブラウザ入力）設計書

**最終更新:** 2026-09-03  
**関連リポジトリ:** [keijirodokyosai.github.io](https://github.com/keijirodokyosai/keijirodokyosai.github.io)（Web）、`kyosai-system`（Access・マスタ出力）

---

## 1. 概要

組織共済申込書を、公式用紙（PDF）の見た目に合わせて **PC ブラウザ上で入力** する機能。

| 項目 | 内容 |
|------|------|
| 入力ページ | `/soshiki-form-enter.html` |
| 導線 | `downloads.html` 最下部「組織共済申込書入力」 |
| 入力方式 | 背景 PNG（`images/soshiki-form-enter.png`）＋ HTML 入力欄を重ねる |
| 用紙キャンバス | **A4 横**（`297mm × 210mm`）= 原本 PDF と同サイズ（§9.0） |
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
| 背景 PNG | `pdf/soshiki-form-enter.pdf` から生成。㊞除去済み。組合員欄の郵便番号用 **背景ハイフン** 除去済み（§9.7）。性別欄の **1.男 / 2.女** 印刷除去済み（§9.7.1）。組合員氏名欄の背景 **カナ** 除去済み（§9.7.2）。異動内容列の背景 **新規 / 解約 / 変更** と **点線楕円枠** 除去済み（§9.7.3） |
| `.gitignore` | `_site/` 等の Jekyll 生成物を除外 |
| ローカルプレビュー | `scripts/serve-open.ps1`（Jekyll 起動・URL 表示） |
| マスタ設計 | 本ドキュメント・`data/form-kyosai-map.json`（確定） |
| 産別・支部・分会 | 背景上に 3 桁×3 の入力枠（`readonly`）・Enter でマスタ反映 |
| Enter 連携 | `union-master.json` 読込・組合名判定・コード・口欄（7）・掛金を自動反映 |
| 共済口欄（7）・掛金 | HTML 配置完了。マスタ反映表示のみ（枠線なし・初期値空） |

### 未実装

* 組合員各欄の **CSS 位置の最終調整**（現状は初期値・要微調整）
* 組合名プルダウン（localStorage）・追加確認・削除 UI
* `validateSoshikiForm()` の配線（送信前チェック等） → **送 信で実装済み**（§5.10）
* 確認画面・PDF 出力・メール送信 → **送 信で JSON+PDF+PA 通知**（§5.10）。PA・取込は別途
* 本番用 `union-master.json` の kyosai-system からの出力・配置

### 完了（組合員入力・2026-08-28）

| 項目 | 内容 |
|------|------|
| 異動内容 | 5行×（新規／解約／変更）トグル。性別と同系統の枠（点線 1.5px / 選択時 実線 2.4px・紺 `#123456`）。再クリックで解除 |
| 組合員各欄 | コード（6桁1枠）・氏名・生年月日・性別・郵便番号・住所5分割（HTML/CSS 配置済み） |
| 半角制限 | カナ・コード・生年月日・郵便番号 |
| blur 処理 | コード左0埋め、月日2桁化、生年月日の実在日チェック |
| 郵便番号 | zipcloud API で都道府県・市区町村・町村域を自動入力（任意） |
| 住所 | 5分割（都道府県・市区町村・町村域・番地・建物名）。一部入力時は1〜5が必須 |
| 必須チェック | `validateSoshikiForm()`（確認画面用・未配線） |

---

## 4. ファイル構成（Web）

```text
soshiki-form-enter.html      … 入力ページ
js/soshiki-form-enter.js     … 日付初期値・申込月の翌月を当月枠へ反映・マスタ連携・横フィット（§9.0.1）・操作ボタン（§5.9・クリア・保 存印刷）・組合確定状態
js/soshiki-form-union-storage.js … 保存組合名 localStorage・datalist・削除 UI（§5.2）
js/soshiki-form-submit.js    … WEB 受付（§5.10・JSON/PDF 生成・PA POST）
js/soshiki-form-members.js   … 組合員5行・異動トグル・半角制限・郵便番号検索・町村域正規化（§9.9）・表示同期（updateZipView）・組合員欄クリア
_includes/soshiki-form-member-rows.html … 組合員行マークアップ
css/style.css                … .soshiki-form-* オーバーレイ用
images/soshiki-form-enter.png
pdf/soshiki-form-enter.pdf   … 原本 PDF
data/union-master.json       … 開発用サンプル（kyosai-system 本番出力で置換）
data/soshiki-form-submit-config.json … WEB 受付 PA URL（§5.10）
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
* 2 回目以降: **datalist プルダウン**（localStorage に保存した `KyosaikaiName` のみ）。**リストから選んだ時点で Enter 確定と同じ**（コード・口欄・掛金を反映）。手入力の場合は **Enter で確定**（§5.3）
* 組合名が入力済みでも **▼ を押せば保存候補をすべて表示**（ブラウザ datalist は入力値で候補を絞るため、`js/soshiki-form-union-storage.js` で ▼ クリック時に一時的に欄を空にしてから一覧を開く）
* 誤って記憶した名前は **1 件削除 / すべて削除** できる UI を付ける（操作ボタン・ヒントの**下**の「保存した組合名」パネル）

### 5.3 Enter キー確定時の動作

#### 名称一致のキー（確定）

組合名の正否判定は、Access **`Subbranch` テーブルの `KyosaikaiName`** に対して行う。

| 項目 | 内容 |
|------|------|
| Access | `Subbranch.KyosaikaiName` |
| エクスポート | `union-master.json` の **`KyosaikaiName`** フィールド |
| Web の照合 | 入力欄の文字列と **`KyosaikaiName` の完全一致** |
| 照合方式 | 部分一致・あいまい検索は **しない** |
| 正規化 | 前後の空白のみ `trim`（全角半角変換・大文字小文字変換はしない） |

一致時は、入力欄の表記ゆれを避けるため **`KyosaikaiName` の値で組合名欄を上書き**する。

```
組合名を Enter
    ↓
入力文字列（trim 後）と union-master.json の KyosaikaiName が完全一致？
    ├─ はい → 産別・支部・分会・口欄（7）・掛金を反映
    │         組合名欄 ← KyosaikaiName
    │         記憶リストに未登録なら「組合リストに追加しますか？」
    │         ├─ はい → localStorage に追加
    │         └─ いいえ → 今回だけ使う
    └─ いいえ → 「その組合名は京滋労働共済に登録されていません」
                OK で閉じる
                組合名＋関連項目をすべてクリア
```

* 判定タイミングは **Enter**（手入力）および **datalist からの選択**（`input` の `insertReplacementText` / `change`）。**blur だけでは確定しない**
* localStorage に保存する組合名も **`KyosaikaiName`** を使う

### 5.4 産別・支部・分会コード

| 項目 | 内容 |
|------|------|
| 桁数 | 各 **3 桁**（`IndustryCode` / `BranchCode` / `SubbranchCode`・JSON はゼロ埋め **string**） |
| 入力 | **手入力不可**（`readonly`） |
| 反映 | 組合名 Enter 確定時に `union-master.json` からセット |
| 縦位置・高さ | 共済口欄と同じ（`top: 28.5%` / `height: 2.8%`） |
| 幅 | 各 **`5.7%`** |
| 字間・字位置 | `letter-spacing: 0.52em` / `text-indent: 0.27em` / `font-variant-numeric: tabular-nums` |
| 横位置（`left`） | 産別 **`6%`** / 支部 **`11.7%`** / 分会 **`17.4%`**（枠同士は隙間なく接続） |
| 背景 | **透明**（`background: transparent`） |
| 枠線 | **なし**（`border-color: transparent`） |
| HTML id | `industry-code` / `branch-code` / `subbranch-code` |

### 5.5 共済口欄・掛金（CSS 配置・確定）

口欄・掛金もコード欄と同じ行（`top: 28.5%` / `height: 2.8%`）。背景・枠線は透明（表示専用）。

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

### 5.6 ページ枚数（CSS 配置）

申込書左下フッターの **ページ枚数** 欄。背景 PNG に印刷された **`/`** の左右に数字を入力する（形式: 現在ページ / 総ページ）。

| 項目 | 値 |
|------|-----|
| HTML id | `page-count-current`（`/` 左） / `page-count-total`（`/` 右） |
| 入力 | 手入力可。`inputmode="numeric"`、`maxlength="2"` |
| PNG 枠（実測） | x450–499, y933–997 |
| オーバーレイ（内側 2px・実測基準） | 高さ `5.038%`（幅は 2 つの正方形＋ gap で自動） |
| 位置微調整 | `left-nudge: -10%` / `top-nudge: +5%` → **確定** `left: 16.841%` / `top: 83.505%` |
| 枠形状 | 各入力 `height: 100%` + `aspect-ratio: 1` で **正方形** |
| 枠サイズ | `box-scale: 0.8` → 1 辺 **4.030%**（シート高さ比）≈ **8.46 mm** ≈ **48 px**（PNG 1191px 高さ時） |
| `/` 間隔 | `--soshiki-form-page-count-slash-gap: 1.1em` |
| レイアウト | `.soshiki-form-page-count-group` を flex（左入力・gap・右入力） |
| 左枠位置調整 | `transform: translate(-9px, -14px)` |
| 右枠位置調整 | `transform: translate(-20px, 6px)` |
| フォント | 14px、中央揃え、`tabular-nums` |
| 実測スクリプト | `scripts/measure-soshiki-form-png-page-count.py` → `measure/page-count/` |

### 5.7 前月残・月計（CSS 配置）

フッター右側の **前月残** / **月計** 欄。背景 PNG の **「人」左側の横長矩形枠** に人数を入力する。

#### 実測手順（§5.6・`soshiki-form-png-edit.mdc` と同型）

1. 対象 = **「人」左の人数枠**（ラベル文字「前月残」「月計」ではない）
2. PNG 上で **「人」** の位置を基点に、枠の **罫線（外側）** を確認
3. オーバーレイは罫線 **内側 2px**（`INSET = 2`）
4. `measure/zengetsu/PROOF_*_overlay.png`（赤＝罫線・緑＝入力）を **目視確認**（スクリプトは代替にならない）
5. **実装後**: `python scripts/measure-soshiki-form-png-zengetsu.py` で `VERIFY_css_on_png.png` を生成し、続けて **ブラウザで** `soshiki-form-enter.html` を開いて緑枠が印刷枠（「人」左）と一致するか確認。未コミット CSS やキャッシュに注意

| 項目 | 値 |
|------|-----|
| HTML id | `zengetsu-zan-count`（前月残） / `tougetsu-count`（当月） / `tsuki-kei-count`（月計） |
| Tab 順（DOM） | 当月 → 前月残 → 月計（§5.9.1） |
| レイアウト | `.soshiki-form-zengetsu-group--zan` / `--tsuki-kei` を absolute 配置（§5.6 ページ枚数と同型）。input は `width/height: 100%` |
| 入力 | 手入力可。`inputmode="numeric"`、`maxlength="3"` |
| PNG 枠（外側・黒罫線） | 前月残 x508–556 y958–996（**49×39px**）/ 月計 x680–728 y958–996（**49×39px**） |
| 入力オーバーレイ | グループを外枠に合わせ、`padding: 2px`（内側 45×35px） |
| 前月残配置 | `left 30.166%` / `top 80.437%` / `width 2.91%` + `22px` / `height 3.275%` + `8px` / offset `-12px` / `29px` |
| 月計配置 | `left 40.381%` / `top 80.437%` / `width 2.91%` + `24px` / `height 3.275%` + `8px` / offset `0px` / `29px` |
| 誤認注意 | y963–974 の薄い横線はラベル下の罫。**左罫の上端 y958** が黒枠の上辺（2026-08-31 再修正） |
| 位置・サイズ微調整 | `--soshiki-form-zengetsu-*-offset-x/y`（px）、`*-width-extra` / `height-extra`（px） |
| フォント | 18px、中央揃え、`tabular-nums` |
| 実測スクリプト | `scripts/measure-soshiki-form-png-zengetsu.py` → `measure/zengetsu/` |

#### 5.7.1 当月枠（CSS 配置）

月計枠の **直上** に配置。サイズは月計枠の **縦・横とも 1/2**（月計の CSS 変数から `calc` で導出）。横位置は月計枠に対して中央揃え。

| 項目 | 値 |
|------|-----|
| HTML id | `tougetsu-count` |
| レイアウト | `.soshiki-form-zengetsu-group--tougetsu`（月計と同型。`padding: 1px`） |
| 表示 | **申込日の月**（`application-month`）の **翌月** を JS で表示。月のみ・0 埋めなし（例: 申込 `9` → `10`、申込 `12` → `1`） |
| 入力 | **手入力不可**（`readonly`）。申込月の `input` / `change` で再計算 |
| サイズ | 月計の `width` / `height`（extra 込み）の **50%** + `width-extra 2px` / `height-extra 10px` |
| 位置 | 月計の `top` から当月の `height` 分だけ上。`left` は月計幅の 1/4 だけ右（半分幅の中央揃え） / offset `-6px` / `-24px` |
| 位置・サイズ微調整 | `--soshiki-form-zengetsu-tougetsu-offset-x/y`（px）、`width-extra` / `height-extra`（px） |
| フォント | 16px、中央揃え、`tabular-nums`（`--soshiki-form-zengetsu-tougetsu-font-size`）。文字位置は input `padding` 上 `2px` / 下 `0` |

### 5.8 備考（CSS 配置）

フッター右の **備考** 欄。背景 PNG の「備考」ラベル下の矩形枠に自由記述を入力する。

| 項目 | 値 |
|------|-----|
| HTML id | `biko-remarks` |
| 要素 | `<textarea>`（`.soshiki-form-biko-group` + `.soshiki-form-biko-field`） |
| 入力 | 手入力可。複数行。`resize: none` |
| PNG 枠（外側・黒罫線） | x898–1601 y934–1120（**704×187px**） |
| 入力オーバーレイ | グループを外枠に合わせ、`padding: 2px`（内側 700×183px） |
| 配置 | `left 53.325%` / `top 78.421%` / `width 41.805%` / `height 15.701%` / offset `3px` / `30px` / width-extra `-6px` / height-extra `-33px` |
| 文字開始位置 | `--soshiki-form-biko-padding-top: 2px`（枠上端から上揃え） |
| 位置・サイズ微調整 | `--soshiki-form-biko-*-offset-x/y`、`*-width-extra` / `height-extra`（px） |
| フォント | 14px、左揃え、`line-height: 1.3` |
| 実測スクリプト | `scripts/measure-soshiki-form-png-biko.py` → `measure/biko/` |

### 5.9 操作ボタン（申込書シート外）

用紙（`.soshiki-form-sheet`）の直下・`<form>` 内。`.soshiki-form-actions` で **右寄せ**（`justify-content: flex-end`）。幅はシートと同じ **297mm**（`max-width: 100%`）。背景 **#fffaf0**・ボタン **#fff8d8**（トップページ等の `.hero-sub-link` と同系）。印刷時は非表示。

| 順（左→右） | id | ラベル | 状態 |
|-------------|-----|--------|------|
| 1 | `soshiki-form-clear` | クリア | **実装済み** |
| 2 | `soshiki-form-save-pdf` | 保 存 | **実装済み**（印刷→PDF 保存） |
| 3 | `soshiki-form-send` | 送 信 | **実装済み**（§5.10・PA URL 設定要） |

ボタン行の下に `.soshiki-form-actions-hint`（右寄せ・14px）:「※ 保 存を押し、印刷画面で『PDF に保存』を選んでください。」印刷時は非表示。

その下（ヒント・送 信結果の後）に **保存した組合名**（`.soshiki-form-saved-unions-panel`）:

| 項目 | 内容 |
|------|------|
| 配置 | 操作ボタンより**下**（クリア・保 存・送 信 → ヒント → 本パネル） |
| 見た目 | 背景 **#fffaf0**・枠線・角丸（操作ボタン行と同系） |
| 行高 | **27px**（組合名＋小さな「削除」ボタン） |
| ヘッダ | 「すべて削除」の**左端**を上段の**クリア**ボタン中心付近に合わせ、タイトル・組合名は削除ボタン列の**右 12px** から表示（3 列グリッド・`display: contents`） |
| 削除列 | 「すべて削除」と各行の「削除」は**右辺揃え**（同一グリッド列） |

印刷時は非表示。

送 信の注意（`#soshiki-form-send-hint`）:

```text
送信後の取り消しはできません。
内容を誤って送信した場合は、受付 ID を控えて京滋労働共済までご連絡ください。
もしデータベースに反映させた後に判明した場合は、お手数ですが「変更」で再送信してください。
```

**クリア**（`js/soshiki-form-enter.js` + `js/soshiki-form-members.js`）:

* 対象欄に1文字でも入力があるときだけ確認ダイアログ → OK でクリア
* **組合員5行**（異動・コード・氏名・生年月日・性別・住所）
* **ページ枚数**（`page-count-current` / `page-count-total`）
* **前月残**（`zengetsu-zan-count`）・**月計**（`tsuki-kei-count`）・**備考**（`biko-remarks`）
* **当月**（`tougetsu-count`）は **変更しない**（申込月からの自動表示のまま）
* **残す**: 申込日・組合名・産別/支部/分会・口欄7・掛金
* クリア後: 1行目の開発用 `placeholder` を復元（`restoreMemberRowOneDevHints()`）

**保 存**（`printSoshikiFormSheet()`・`initSoshikiFormActions()`）:

* クリック → フォーカス解除 → `body.soshiki-form-printing` 付与 → `window.print()` → `afterprint` でクラス除去
* ユーザーはブラウザの印刷ダイアログで **「PDF に保存」** を選択（PDF の自動ダウンロードはしない）
* 印字対象は **`.soshiki-form-sheet` のみ**（パンくず・ヒーロー・操作ボタン・ヒントは `@media print` で非表示）。詳細は §9.0.2

### 5.9.1 Tab 移動順（DOM 順）

配置は CSS の absolute のまま。**Tab 順は HTML の出現順**（`tabindex` はマスタ自動入力の readonly 欄のみ `-1`）。

| 区間 | 順序 |
|------|------|
| ヘッダ | 申込日（年→月→日）→ 組合名 |
| 組合員（1〜5 行・各行） | 異動（新規→解約→変更）→ 組合員コード → 漢字姓 → カナ姓 → 漢字名 → カナ名 → 生年月日（年→月→日）→ 性別（男→女）→ 郵便番号 → 都道府県 → 市区町村 → 町村域 → 番地 → 建物名 |
| フッター | ページ枚数（現在→総数）→ **当月** → **前月残** → **月計** → 備考 |
| 操作 | クリア → 保 存 → 送 信 |

組合員欄の HTML は `soshiki-form-enter.html` 内で口数・掛金の直後（フッター欄より前）に include する。

### 5.10 WEB 受付（送 信）

**保 存** は手動印刷 PDF。**送 信** は JSON + 自動生成 PDF を OneDrive（Power Automate 経由）へアップロードする。

| 項目 | 内容 |
|------|------|
| 設定 | `data/soshiki-form-submit-config.json` の `submitEndpointUrl`（PA HTTP 受信 URL） |
| JS | `js/soshiki-form-submit.js` |
| ライブラリ | html2canvas 1.4.1・jsPDF 2.5.2（CDN） |
| 送 信条件 | `validateSoshikiForm()` OK・組合名 Enter 確定（`getSoshikiFormVerifiedUnion()`）・組合員1名以上・パスワード入力 |
| POST | **1 リクエスト**（JSON + PDF Base64 + パスワード + ファイル名用メタ） |
| PDF | 送 信時に `.soshiki-form-sheet` をキャプチャ（`body.soshiki-form-capturing`・§9.0.2 印刷に近似・scale 3≒OCR 想定 DPI） |
| 取込 | **リアルタイム自動なし**（事務側の取込処理で json 削除・二重チェック） |

#### OneDrive フォルダ（案C改）

```text
組織共済WEB受付/
  受付/
    yyyy年mm月/          … 当月（申込月+1。12月申込→翌年01月）
      json/              … 取込後削除
      pdf/               … 残す
  設定/
    union-contacts.json  … 分会担当者メール（Web 非公開）
```

`storageFolder`（例 `2027年01月`）は Web が `coverageMonth` から算出し submission に含める。PA はこの値で月フォルダを作成する。

#### ファイル名

```text
{組合名}_{yyyyMMdd}_{受付ID}.json
{組合名}_{yyyyMMdd}_{受付ID}.pdf
```

| 部分 | 内容 |
|------|------|
| 組合名 | POST の `unionName`（マスタ確定名・ファイル名用。submission 内には含めない） |
| yyyyMMdd | POST の `fileNameDate`（申込日） |
| 受付 ID | **PA が付与**し JSON レスポンス `receiptId` で Web に返す |

#### POST ボディ（Web → PA）

```json
{
  "password": "ユーザー入力",
  "unionName": "サンプル労働組合",
  "fileNameDate": "20260903",
  "submission": { … },
  "pdfBase64": "…"
}
```

#### submission JSON（確定）

| 含める | 含めない |
|--------|----------|
| `formType`, `formVersion`, `submittedAt` | 組合名（POST の `unionName`） |
| `IndustryCode`, `BranchCode`, `SubbranchCode`, `KyosaikaiCode` | 口欄・掛金 |
| `applicationDate`, `coverageMonth`, `storageFolder` | フッター・備考 |
| `members[]`（入力行のみ・`UnionMember` 列名 PascalCase） | |

**JSON 型（組織キー）:** `KyosaikaiCode`・`IndustryCode`・`BranchCode`・`SubbranchCode`・`UnionMemberCode` は **ゼロ埋め string**。`CollectiveKyosaiId`・`KyosaiId`・`Units`・`Premi` は **number**。

組合員行:

| フィールド | 形式 |
|------------|------|
| `idou` | `shinki` / `kaiyaku` / `henkou`（取込分類・DB 列なし） |
| `BirthDate` | `yyyy/mm/dd` |
| `PostalCode` | `600-0000` |
| `UnionMemberCode` | 入力時のみ（6桁） |

#### PA レスポンス（Web 期待）

```json
{ "receiptId": "7f3a2b1c", "ok": true }
```

#### PA 側（未実装・手動構築）

1. HTTP 受信 → パスワード照合  
2. `storageFolder` で `組織共済WEB受付/受付/{storageFolder}/json|pdf/` を作成  
3. 受付 ID 生成 → ファイル保存  
4. `union-contacts.json` で `KyosaikaiCode` 照合 → 担当者 + 共済会へ通知  

#### union-contacts.json（OneDrive・非公開）

PA 通知専用。Web・GitHub には載せない。kyosai-system が `Subbranch` から export。

| フィールド | 型 | 意味 |
|------------|-----|------|
| `KyosaikaiCode` | string 9桁 | 照合キー |
| `IndustryCode` / `BranchCode` / `SubbranchCode` | string 3桁 | 任意（デバッグ用） |
| `ManagerFamilyName` | string | 事務担当姓 |
| `ManagerEmail` | string | 通知先メール（Access 列追加予定） |

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
| **掛金** | `KakekinPerPerson` をそのまま表示 | **不可**（`readonly`） |

入力規則（桁数・整数のみなど）は設けないが、**ユーザーが編集することはできない**。

### 6.3 掛金（`KakekinPerPerson`）

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

| `Kyosai[]` の例 | 慶弔② | 組織火災 |
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

※ `sogoCollectiveKyosaiIds` の **41, 44** は **パッケージ ID**（`union.CollectiveKyosaiId` と比較）。§7.2 の **KyosaiId 41 / 44** や `sogoHiddenKyosaiIds` の **44** は **種目 ID** であり、別物。

**§7 の 6 口欄マッピングは省略しない。** 総合と団結などが **同一パッケージに共存** し得る。

#### パターン A — 総合のみ（約 9 団体）

* 総合共済の口 ← `1`
* `sogoHiddenKyosaiIds` に該当する種目は 6 口欄に出さない
* その他の kyosaiId がなければ団結〜慶弔②は空
* 掛金 ← `KakekinPerPerson`

#### パターン B — 総合 ＋ 団結など（1 団体）

例: 総合内訳（5, 40, 44, 46）＋ 団結（KyosaiId 1 または 2 で 10 口）。

* 総合共済の口 ← `1`
* 5, 40, 44, 46 ← 6 口欄に出さない（`sogoHiddenKyosaiIds`）
* 団結共済など ← 上表の `kyosaiIds` で通常マッピング
* 掛金 ← パッケージ全体の `KakekinPerPerson`

---

## 8. Enter 確定後の反映フロー（口・掛金）

```
1. `Kyosai[]` の各行について表示口数を計算
     - kyosaiDisplayRules（42→×0.5, 43→×2）
     - それ以外は Units
2. suppressKyosaiWhenPresent を適用
     - kyosaiId 41 がある → kyosaiId 44 は口欄マッピングから除外
3. `CollectiveKyosaiId` ∈ sogoCollectiveKyosaiIds なら
     - sogoHiddenKyosaiIds（5,40,44,46）を 6 口欄マッピングから除外
4. 残りを form-kyosai-map の kyosaiIds で 6 口欄へ振り分け・合算
5. 総合パッケージなら 総合共済の口 ← "1"、でなければ空
6. 掛金 ← `KakekinPerPerson`
```

---

## 9. 組合員入力（最大5名・確定仕様）

1画面に **5行** まで入力できる。完全に空の行は無視する。

### 9.0 用紙キャンバス（`.soshiki-form-sheet`）

入力欄の `%` 配置はすべてこの矩形を基準にする。

| 項目 | 値 |
|------|-----|
| 原本 | `pdf/soshiki-form-enter.pdf`（**A4 横**） |
| PDF / CSS | **841.68 × 595.2 pt** = **297 × 210 mm** |
| ブラウザ | `width: 297mm; height: 210mm;`（96dpi 換算 **約 1122 × 794 px**） |
| 背景 PNG | 1684 × 1191 px（pt の **2 倍**解像度。§9.7 実測の基準） |

**注意:** 旧実装の `1100px` 固定幅は廃止。他ページの `.kyosai-page { max-width: 1100px }` はそのまま。入力ページ（`body.soshiki-form-enter-page`）のみ §9.0.1 で上書き。

### 9.0.1 ページレイアウト（横フィット・入力ページのみ）

縦スクロールは許容。**横スクロールは出さない**。画面幅をできるだけ申込書に使う。

| 項目 | 内容 |
|------|------|
| 対象 | `body.soshiki-form-enter-page` のみ |
| 幅 | `.kyosai-page.soshiki-form-enter-section` の `max-width: none`（1100px 上限を解除） |
| 余白 | `.kyosai-page` 左右 **8px**。`.detail-section` は **背景なし・padding 0**（幅は `fit-content` でシートに合わせる） |
| 縮小 | ラッパー幅 &lt; シート実幅のとき `transform: scale()`（`--soshiki-form-scale`、上限 1） |
| JS | `initSoshikiFormLayout()`（`resize` + `ResizeObserver`）。`margin-bottom` で scale 後の縦余白を補正 |
| 縦 | ページ全体の縦スクロールはそのまま |

#### 文字色

| 種別 | 色 |
|------|-----|
| 入力文字・マスタ自動表示（口数・コード・氏名・住所・備考など） | `#000`（黒） |
| 異動・性別ボタン内の表示文字（`.soshiki-form-dev-marker`） | `#123456`（紺） |
| 異動・性別の枠線 | `#123456`（紺） |
| placeholder（開発用薄字） | `rgba(18, 52, 86, 0.32)` |

印刷・PDF キャプチャ時は、選択中の異動・性別表示も **黒**（§9.0.2）。

### 9.0.2 印刷・PDF

**保 存** ボタンは `window.print()` でブラウザ印刷を開く。`@media print`（`body.soshiki-form-enter-page`）で **申込書シートだけ** を A4 横・余白 0 で印字する。

| 項目 | 内容 |
|------|------|
| `@page` | `size: A4 landscape`、`margin: 0` |
| 非印字 | `.site-header`、`.site-footer`、`.breadcrumb`、`.hero`、`.soshiki-form-actions`、`.soshiki-form-actions-hint`、保存組合パネル・送信結果 |
| ページ数 | **1 ページ**（シートのみ。共通ヘッダー／フッターを印刷対象外） |
| シート | `transform: none`（§9.0.1 の scale 解除）、`297mm × 210mm`、影なし |
| 背景 PNG | `.soshiki-form-sheet-bg` に `print-color-adjust: exact` |
| プレースホルダ | シート内 `::placeholder` は透明（開発用薄字を印字しない） |
| 入力ガイド | 画面上の **緑枠線は印字しない**（下表） |
| 印字されるもの | 背景 PNG・入力した **文字**・性別・異動の **選択枠**（実線楕円）と **選択中の表示文字**（新 規 / 解 約 / 変 更・男 / 女） |
| 非印字（シート内） | 入力欄の緑枠、未選択の異動・性別マーカー、開発用 placeholder |

緑枠の対象: `.soshiki-form-sheet` 内の `.soshiki-form-field`、組合員欄 `.soshiki-form-member-box` 等（`border-color: transparent`、`box-shadow: none`、`outline: none`）。

### 9.1 異動内容

| 項目 | 内容 |
|------|------|
| 選択肢 | **新規** / **解約** / **変更**（1行につき0または1つ） |
| 操作 | クリックで選択（**実線 2.4px** の楕円枠）。別の選択肢で切替。同じ選択肢の再クリックで解除。未選択時は **点線 1.5px**（紺 `#123456`・性別欄と同値） |
| 新規・選択時 | 実線枠のみ `::after` で **1px 下**（`--soshiki-form-member-idou-shinki-selected-ring-offset-y`）。文字位置は変えない |
| 値 | `shinki` / `kaiyaku` / `henkou`（hidden input） |
| 配置（行内%） | `left` **6.2% + 5px**（確定）。幅 **5% − 6px**。高さ **26% + 2px**。新規 `top` **5%** / 解約 **37%** / 変更 **69%**（`top-nudge` 0px） |
| 表示文字 | **新 規** / **解 約** / **変 更**（半角スペース区切り。`.soshiki-form-dev-marker`・**12px**・`padding-top` 2px・紺 `#123456`） |

### 9.2 必須項目

**申込全体:** 申込日（年・月・日）、組合名（マスタ一致済み）

**行に1項目でも入力がある場合:**

| 必須 | 任意 |
|------|------|
| 異動内容、漢字姓・名、半角カナ姓・名、生年月日（年4桁・月・日）、性別 | 組合員コード（UnionMemberCode・6桁1枠） |

**住所（5分割）:** 郵便番号・都道府県・市区町村・町村域・番地の **いずれか1つでも入力** がある行では、上記 **5項目すべて必須**。建物名は常に任意。

| 欄 | 必須条件 |
|----|----------|
| 郵便番号（PostalCode） | 住所グループ入力時 |
| 都道府県（Prefecture） | 〃 |
| 市区町村（City） | 〃 |
| 町村域（TownArea） | 〃 |
| 番地（AreaNumber） | 〃 |
| 建物名（BuildingName） | 常に任意 |

### 9.3 半角・正規化（blur 時）

| 欄 | 入力制限 | blur 時 |
|----|----------|---------|
| カナ姓・名 | 半角カナのみ（全角カナ・ひらがな・漢字は除去） | — |
| 組合員コード | 半角数字、最大6桁（**1枠**） | 6桁未満は左0埋めで6桁表示。7桁以上はエラー（枠線赤・`validateSoshikiForm`） |
| 生年月日 | 半角数字。全角数字は半角に変換 | 月・日は2桁化。年・月・日が揃えば実在日チェック |
| 郵便番号 | 半角数字7桁、表示は `123-4567` | 7桁そろえば zipcloud で都道府県・市区町村・町村域を自動入力（**blur / Enter / Tab**・町村域は §9.9 正規化） |

### 9.4 性別・郵便番号

* 性別: 男（`1`）/ 女（`2`）。再クリックで解除可。各ボタン枠は **紺 `#123456`・点線 1.5px**（`.soshiki-form-gender-btn`）。選択時は **実線 2.4px** 同色系。幅 **2.4%**。横位置は **性別列（PNG x1028–1088）内で中央**（`--soshiki-form-member-gender-column-left` 61.08%）。縦は枠高 **33%**、男 **10%** / 女 **57%** 起点（`--soshiki-form-member-gender-male-top` / `--soshiki-form-member-gender-female-top`）。表示文字（`.soshiki-form-dev-marker`）は **13px**・上余白 **3px**
* 郵便番号: **1枠**・値は `123-4567` 形式。7桁連続入力可。**Enter** で確定・住所検索（**Tab** は次欄へ移る前に整形＋検索）
* 郵便番号 API: `https://zipcloud.ibsnet.co.jp/api/search?zipcode=`（方式1・外部API。API には数字7桁のみ渡す）
* **表示**: 枠は `.soshiki-form-member-zip-inner.soshiki-form-member-box`（§9.11）。文字は透明 `input` + `.soshiki-form-member-zip-view` に `updateZipView()` で同期
* **字間**: 数字 `.soshiki-form-member-zip-part` → `letter-spacing: 0.06em`。ハイフン前後 `.soshiki-form-member-zip-hyphen` → `margin: 0.12em`

### 9.5 CSS 配置（組合員行・共通）

| 変数 / 項目 | 値 |
|-------------|-----|
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

### 9.7.1 背景 PNG・性別欄「1.男 / 2.女」（2026-08-30）

#### 座標特定の手法（必須）

**推測・決めつけ・未検証の座標流用は禁止。** 手順の正本は `.cursor/rules/soshiki-form-png-edit.mdc`。

1. 対象を言葉で定義（性別列の背景「1.男」等。西暦・HTML オーバーレイと混同しない）
2. PNG 上で列・行の境界を実測（ヘッダー・罫線）→ **ここで初めて座標が決まる**
3. 境界内の文字 bbox → **切り出し PNG を目視確認** → 一致しなければ編集しない
4. ガード領域 unchanged を確認してから保存
5. 1 箇所試行 → 問題なければ残り

下表の数字は **2026-08-30 時点の実測記録**（参考）。次回編集時に **表をコピペして開始してはならない**。手順 1 からやり直す。

#### 除去（2026-08-30 完了）

| 項目 | 内容 |
|------|------|
| 方式 | 性別列内の文字 bbox を PNG から実測 → 切り出し確認 → 白 `#FFF` 塗り |
| 再実行 | 不要（`images/soshiki-form-enter.png` に反映済み。除去スクリプトはリポから削除。PDF から PNG を作り直す場合は §9.7.1 手順から再実装） |
| 切り出し補助 | `python scripts/measure-soshiki-form-png-gender.py`（目視確認の代替にならない） |
| キャッシュ | `?v=20260830-gender-text` |

#### 列境界（当時の実測記録）

| 項目 | 1684×1191px 基準 |
|------|------------------|
| 性別ヘッダー「性別」 | x **1028–1087**, y **414–421** |
| 性別列・左罫 | x **1026**（1025–1027） |
| 性別列・右罫 | x **1090**（1089–1091） |
| **性別列の内側**（文字探索はここだけ） | x **1028–1088** |

#### 触れない bbox

| 対象 | x | y |
|------|---|---|
| **西暦** | 565–624 | 446–508 |
| **誤認禁止**（ここは西暦。1.男 ではない） | 776–816 | 453–471 |

#### 5 行分の文字 bbox（1.男 / 2.女）

x は全行共通。**1.男** x **1045–1080**、**2.女** x **1044–1081**。y のみ行ごと。

| 行 | 1.男 y | 2.女 y |
|----|--------|--------|
| 1 | 453–469 | 484–499 |
| 2 | 544–560 | 575–591 |
| 3 | 636–652 | 667–682 |
| 4 | 727–743 | 758–773 |
| 5 | 818–834 | 850–865 |

#### 切り出し補助

`python scripts/measure-soshiki-form-png-gender.py` … 参考 bbox の切り出し PNG を生成するだけ。**目視確認の代替にならない。**

#### 進捗

- ~~5 行 ×（1.男・2.女）~~ → **完了**（2026-08-30）

### 9.7.2 背景 PNG・組合員氏名欄「カナ」（2026-08-30）

#### 座標特定の手法（必須）

**推測・決めつけ・未検証の座標流用は禁止。** 手順の正本は `.cursor/rules/soshiki-form-png-edit.mdc`。

1. 対象を言葉で定義（各組合員行・氏名列上半分の背景印刷 **カナ**。入力ガイドの縦点線・**横罫**・縦罫・HTML オーバーレイと混同しない）
2. PNG 上で氏名列の縦罫（x387–389）と **カナ行／漢字行の横罫**（x390–419 に 25px 以上の行）を実測
3. 各組合員行の **上半分**で、横罫行を除いた **文字ピクセルのみ** → 切り出し PNG を目視確認
4. ガード領域（縦罫 x387–389、**横罫**、カナ入力ガイド x291–325）unchanged を確認してから保存
5. 1 行目試行 → 問題なければ残り 4 行

下表の数字は **2026-08-30 時点の実測記録**（参考）。次回編集時に **表をコピペして開始してはならない**。手順 1 からやり直す。

#### 除去（2026-08-30 完了）

| 項目 | 内容 |
|------|------|
| 対象 | 各組合員行・氏名列上半分（カナ行）右端セルに印刷された **カナ**（2 文字） |
| 方式 | 横罫行を除外した **文字ピクセルのみ** 白 `#FFF` 塗り（bbox 一括塗りは横罫まで消えるため不可） |
| 再実行 | 不要（PNG 反映済み。除去スクリプトはリポから削除。再生成時は §9.7.2 手順から再実装） |
| 切り出し補助 | `python scripts/measure-soshiki-form-png-name-kana.py`（目視確認の代替にならない） |
| キャッシュ | `?v=20260830-name-kana-v2` |

#### 列・セル境界（当時の実測記録）

| 項目 | 1684×1191px 基準 |
|------|------------------|
| 氏名列・カナ行ラベルセル内側 | x **390–412** |
| 氏名列・縦罫（触れない） | x **387–389** |
| カナ入力ガイド縦点線（触れない） | x **291–293**, **323–325** |

| カナ行／漢字行の横罫（触れない） | 各組合員行上半分の末尾付近。x390–419 に **25px 以上**（例: 1 行目 y **476–477**） |

#### 5 行分の文字ピクセル（カナ）

探索 x **390–412**。横罫行は除外。y は参考 bbox（実際はピクセル単位で塗る）。

| 行 | y（参考） |
|----|-----------|
| 1 | 453–470 |
| 2 | 544–561 |
| 3 | 636–653 |
| 4 | 727–744 |
| 5 | 819–836 |

#### 進捗

- ~~5 行 × カナ~~ → **完了**（2026-08-30）

### 9.7.3 背景 PNG・異動内容列「新規 / 解約 / 変更」＋点線楕円（2026-08-30）

#### 座標特定の手法（必須）

**推測・決めつけ・未検証の座標流用は禁止。** 手順の正本は `.cursor/rules/soshiki-form-png-edit.mdc`。

1. 対象を言葉で定義（各組合員行・異動内容列内の **文字** と **点線楕円枠**。ヘッダー **異動内容**・**実線罫**・HTML オーバーレイと混同しない）
2. PNG 上で列の縦罫（x98–101 / x195–197）と **実線横罫**（列内側 x102–194 がほぼ全幅暗の y 行）を実測
3. 列内側 x102–194・各組合員 y 帯の **実線横罫行以外** の暗ピクセルを白塗り → 切り出し PNG を目視確認
4. ガード領域（縦罫、ヘッダー、実線横罫）unchanged を確認してから保存

下表の数字は **2026-08-30 時点の実測記録**（参考）。次回編集時に **表をコピペして開始してはならない**。手順 1 からやり直す。

#### 除去（2026-08-30 完了）

| 項目 | 内容 |
|------|------|
| 対象 | 各組合員行・異動内容列内（x102–194）の **新規 / 解約 / 変更** 文字と **点線楕円枠** |
| 方式 | 列内側の暗ピクセルを白 `#FFF` 塗り。**実線横罫行**（下表）と **縦罫** は触れない |
| 横罫判定 | x102–194 で暗ピクセル **≥90** の y 行 = 実線（点線楕円行は 40 未満） |
| 再実行 | 不要（PNG 反映済み。除去スクリプトはリポから削除。再生成時は §9.7.3 手順から再実装） |
| 切り出し補助 | `python scripts/measure-soshiki-form-png-idou.py`（目視確認の代替にならない） |
| キャッシュ | `?v=20260830-idou-v3` |

#### 列境界（当時の実測記録）

| 項目 | 1684×1191px 基準 |
|------|------------------|
| 異動内容ヘッダー「異動内容」 | x **98–194**, y **410–432**（**触れない**） |
| 異動内容列・左罫 | x **98–101** |
| 組合員コード列・左罫 | x **195–197** |
| **列内側**（除去対象） | x **102–194**（実線横罫・縦罫除く） |

#### 保護する実線横罫（y・1684×1191 基準）

| 用途 | y |
|------|---|
| ヘッダー下 | **414–417** |
| 1 行目上 | **445–447** |
| 行間 1–2 | **536–538** |
| 行間 2–3 | **628–630** |
| 行間 3–4 | **719–721** |
| 行間 4–5 | **811–813** |
| 5 行目下（表下端） | **901–905** |

#### 組合員行 y 帯（除去範囲・上横罫直下〜次行上横罫直前。変更 tail 含む）

| 行 | y |
|----|---|
| 1 | **448–535** |
| 2 | **539–627** |
| 3 | **631–718** |
| 4 | **722–810** |
| 5 | **814–900** |

#### 触れないもの

| 対象 | 備考 |
|------|------|
| ヘッダー「異動内容」 | x98–194, y410–432 |
| 縦罫 | x **98–101** / x **195–197** |
| 実線横罫 | 上表の y 行（x102–194） |

#### 進捗

- ~~5 行 ×（新規・解約・変更・点線楕円）~~ → **完了**（2026-08-30）

### 9.8 郵便番号枠の配置（2026-08-29 完了）

5 行共通。郵便番号のみ **表示レイヤー**（`.soshiki-form-member-zip-wrap` → `.soshiki-form-member-zip-inner.soshiki-form-member-box` → view + 透明 input）。都道府県・市区町村は `input.soshiki-form-member-box`。

| 項目 | 値 | 備考 |
|------|-----|------|
| 横位置 `left` | `66.6%` | 行幅＝用紙幅のため用紙基準と同じ |
| 1行目 `top`（枠上端） | `--soshiki-form-member-zip-text-center` − `--soshiki-form-member-box-height` / 2 + nudge | 基準は PNG 実測の文字中心（21.09%）。`translateY(-50%)` は使わない |
| 縦微調整 | `--soshiki-form-member-zip-text-nudge: -1px` | 文字中心の px 補正 |
| 1行目 flex | `align-items: flex-start` | 郵便・都道府県・市区町村の **枠上端** を揃える |
| 郵便番号ラッパ | `.soshiki-form-member-zip-wrap` 高さ 18px・`zip-inner` は **`display: flex`（`inline-flex` 不可）** | インライン行ボックスの余白で縦ズレするため |
| 枠内文字の縦位置 | `zip-view` を枠内に **absolute + flex 中央**（§9.11 と同じ padding） | 都道府県 `input` と揃え、`overflow-y: hidden` による上欠けを防止 |
| 枠サイズ | §9.11 `.soshiki-form-member-box` on `.soshiki-form-member-zip-inner` | 高さ 18px・15px・上 padding 3px |
| 郵便番号幅 | `--soshiki-form-member-box-chars: 5` + `--soshiki-form-member-zip-width-extra: 6px` | px で微調整 |
| 字間（数字） | `0.06em` | `.soshiki-form-member-zip-part` |
| 字間（ハイフン前後） | `0.12em` | `.soshiki-form-member-zip-hyphen` の margin |
| 横並び | `.soshiki-form-member-zip-address-row` | 郵便番号 → 都道府県（3文字）→ 市区町村（10文字）。`gap: 2px`（行間と同じ） |
| 町村域 | `.soshiki-form-member-town-area-number-row` | 1行目枠下 + 2px。番地は町村域の右 |

**座標の注意:** 組合員行内の `%` は行高（用紙の 7.55%）に対する割合。用紙全体で 1% 動かす場合は行内 `%` に換算して指定する（行内 1% ≒ 用紙 0.0755%）。

### 9.9 Access 列名 ↔ Web フィールド（2026-08-29 確定）

HTML の `id` / `name` は Access 列名の **kebab-case**（`member-{行}-` + 下表の suffix）。`data-access-field` に Access 列名（PascalCase）を付与。**異動内容（idou）のみ Web 専用**（Access 列なし）。

| Access 列 | HTML suffix | 備考 |
|-----------|-------------|------|
| UnionMemberCode | `union-member-code` | **6桁1枠**（旧6マス入力を統合） |
| FamilyNameKana | `family-name-kana` | 半角カナ |
| GivenNameKana | `given-name-kana` | 半角カナ |
| FamilyName | `family-name` | 漢字姓 |
| GivenName | `given-name` | 漢字名 |
| BirthDate | `birth-year` / `birth-month` / `birth-day` | UI は年月日3入力。`data-access-field="BirthDate"` は年欄のみ |
| Gender | `gender` | hidden + 男/女ボタン（`1` / `2`） |
| PostalCode | `postal-code` | 表示 `123-4567`。zipcloud 検索キー |
| Prefecture | `prefecture` | zipcloud `address1` |
| City | `city` | zipcloud `address2` |
| TownArea | `town-area` | zipcloud `address3` → **正規化後**（§9.9 町村域） |
| AreaNumber | `area-number` | 手入力（番地） |
| BuildingName | `building-name` | 手入力（建物名・常に任意） |
| — | `idou` | Web のみ（新規/解約/変更） |

**郵便番号変更時の自動入力ルール**

* 7桁確定（**blur**・**Enter**・**Tab**）で zipcloud 検索
* **郵便番号が前回と異なる** 場合: 都道府県・市区町村・町村域を上書きし、**番地・建物名をクリア**
* 複数候補: アラート「入力の郵便番号には、複数の住所候補があります。表示された住所が異なる場合は手入力でお願いします。」→ 先頭候補を反映

**町村域（TownArea・住所3）の正規化** — `normalizeTownAreaValue()`（`js/soshiki-form-members.js`）

**Access 側に同種ルールは設けない。** 正規化は Web のみ。保存・送信される `TownArea` は正規化後の値。

| 対象 | ルール | 例 |
|------|--------|-----|
| **全国** | カッコ書き `（…）`・`(...)` を除去 | `○○町（次のビルを除く）` → `○○町` |
| **京都府のみ** | 通り名を除去。**最後**の `下る` / `上る` / `東入` / `西入` / `南入` / `北入` **以降**を町域名とする | `大和大路通三条下る東入若松町` → `若松町` |
| **京都府のみ** | 上記の方位がなく `通` を含む（通り名のみ） | **空欄**（手入力） |

* zipcloud 自動入力時と、町村域 **blur** 時に適用（都道府県欄の値を参照）
* 都道府県・市区町村は zipcloud の値をそのまま使用

### 9.10 組合員コード・住所枠 CSS（2026-08-29）

**組合員コード（6桁1枠）** — `.soshiki-form-member-union-member-code`

| 項目 | 値 |
|------|-----|
| `left` | `11.55%`（`--soshiki-form-member-union-member-code-left`） |
| `top` / `height` | `5%` / `90%` |
| `width` | `11.5%`（`--soshiki-form-member-union-member-code-width`） |
| フォント | `18px`（分会コード `.soshiki-form-code-field` と同じ） |
| 字間 | `0.56em`・`text-indent: 0.14em`（分会 `0.52em` / `0.27em` から 6 マス用に微調整） |
| 文字揃え | 中央（`text-align: center`） |
| 左 padding | `4px`（共通 3px + 1px） |
| 背景 | **透明**（通常）。**フォーカス中** `#fff`（PNG 下の文字が透けない） |

**住所（5分割）** — すべて §9.11 標準枠

| クラス | 配置 | 文字数 |
|--------|------|--------|
| `.soshiki-form-member-zip-inner` | 1行目左（枠） | 5文字 + `zip-width-extra`（6px）。表示は view |
| `.soshiki-form-member-prefecture` | 郵便番号の右 | 3（4文字県名ははみ出可） |
| `.soshiki-form-member-city` | 都道府県の右 | 10 |
| `.soshiki-form-member-town-area` | 郵便番号枠の下（2行目左） | 12 |
| `.soshiki-form-member-area-number` | 町村域の右（2行目） | 8 |
| `.soshiki-form-member-building-name` | 町村域の下（3行目） | 12 |

**1行目:** `.soshiki-form-member-zip-address-row` — 郵便番号・都道府県・市区町村。

**2行目:** `.soshiki-form-member-town-area-number-row` — 町村域・番地（1行目枠下 + `--soshiki-form-member-town-gap-from-zip`: **2px**）。`left`: `66.6%` + `--soshiki-form-member-town-area-row-left-nudge`（**-10px**）。

**3行目:** 建物名 — 2行目枠下 + `--soshiki-form-member-building-gap-from-town`: **2px**。`left`: `66.6%` + `--soshiki-form-member-building-left-nudge`（**-5px**）。

### 9.11 組合員・標準枠サイズ（2026-08-29 確定）

郵便番号・都道府県以降の組合員枠は、**CSS 変数 + `.soshiki-form-member-box`** でサイズを統一する。定義は `.soshiki-form-sheet` と `css/style.css`。

| 変数 | 値 | 意味 |
|------|-----|------|
| `--soshiki-form-member-box-font-size` | `15px` | 枠内フォント（Meiryo） |
| `--soshiki-form-member-box-line-height` | `1` | 変数定義（描画は `.soshiki-form-member-box` で `padding-top` / `padding-bottom` を除いた高さに合わせる） |
| `--soshiki-form-member-box-padding-top` | `3px` | 上 padding（性別表示文字と同値） |
| `--soshiki-form-member-box-padding-bottom` | `0` | 下 padding |
| `--soshiki-form-member-box-padding-inline` | `3px` | 左右 padding |
| `--soshiki-form-member-box-height` | `18px` | **外側の高さ**（`box-sizing: border-box`） |
| `--soshiki-form-member-box-chars` | （欄ごと） | 全角文字数。幅 = `chars × 1em + padding + border`。郵便番号は下記 extra も加算 |
| `--soshiki-form-member-zip-width-extra` | `6px` | 郵便番号枠のみ。5文字幅に px で追加（微調整用） |
| `--soshiki-form-member-box-border-width` | `1px` | 枠線 |
| `--soshiki-form-member-box-border-radius` | `2px` | 角丸 |
| `--soshiki-form-member-box-color` | `#000` | 枠内の入力・表示文字（黒） |

**使い方**

* HTML: `<input class="soshiki-form-member-box …">`（都道府県以降）。**郵便番号のみ** 枠は `div.soshiki-form-member-zip-inner.soshiki-form-member-box` + 表示 view + 透明 input
* 個別クラスは **位置・`--soshiki-form-member-box-chars` のみ**
* サイズ変更は **変数だけ** 触る（1 箇所で全標準枠が連動）
* `.soshiki-form-field` は標準枠に付けない（旧 16px / `position: absolute` と競合）

**適用済み:** 郵便番号・住所5分割・生年月日・氏名（カナ姓/名・漢字姓/名）すべて（§9.11 標準枠）。

**未移行:** 組合員コードなど組合員欄のレガシー枠。

### 9.12 生年月日 CSS（§9.11 標準枠）

| クラス | `left` | 文字数 | 備考 |
|--------|--------|--------|------|
| `.soshiki-form-member-birth-year` | `47.5%`（`--soshiki-form-member-birth-year-left`） | 4（**幅 50px**） | 年4桁 |
| `.soshiki-form-member-birth-month` | `53.1%` + nudge **1px** | 2（**幅 28px**） | 月 |
| `.soshiki-form-member-birth-day` | `56.9%`（`--soshiki-form-member-birth-day-left`） | 2（**幅 30px**） | 日 |

HTML: `input.soshiki-form-member-box.soshiki-form-member-birth-*`（`.soshiki-form-field` は付けない）。

| 項目 | 値 |
|------|-----|
| 枠サイズ | §9.11（高さ 18px・15px・上 padding 3px・左右 3px） |
| 縦位置 | `--soshiki-form-member-birth-text-center`（74%）− 枠高 / 2 |
| 字揃え | 中央・`tabular-nums` |

### 9.13 組合員氏名 CSS（§9.11 標準枠・2026-08-30 完了）

| クラス | `left` | `width` | 縦位置 |
|--------|--------|---------|--------|
| `.soshiki-form-member-kana-sei` | `24.5%`（`--soshiki-form-member-name-sei-left`） | `8.5%` | 住所1行と同じ `--soshiki-form-member-zip-address-row-top` |
| `.soshiki-form-member-kana-mei` | `36%`（`--soshiki-form-member-name-mei-left`） | `8.5%` | 同上 |
| `.soshiki-form-member-kanji-sei` | `24.5%` | `8.5%` | `--soshiki-form-member-birth-text-center`（74%）− 枠高 / 2 + `kanji-name-top-offset` |
| `.soshiki-form-member-kanji-mei` | `36%` | `8.5%` | 同上 |

漢字氏名2枠のみ: フォント `16px`（`--soshiki-form-member-kanji-name-font-size`）、高さ + `5px`、上へ `5px` 拡大（`kanji-name-top-offset: -5px`）。カナ姓・名は §9.11 標準枠のまま。

HTML: `input.soshiki-form-member-box` + `kana-*` / `kanji-*`。背景 PNG のカナラベル除去は §9.7.2。

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
Subbranch（KyosaikaiName, IndustryCode, BranchCode, SubbranchCode, CollectiveKyosaiId）
  → CollectiveKyosai
  → CollectiveKyosaiItem（KyosaiId, Units）
  → Kyosai（KyosaiName, Premi）
```

### 10.3 1 組合あたりのフィールド

| JSON フィールド | 型 | 意味 |
|----------------|-----|------|
| `KyosaikaiCode` | string 9桁 | 共済会コード（`IndustryCode`+`BranchCode`+`SubbranchCode` の算出値） |
| `KyosaikaiName` | string | **`Subbranch.KyosaikaiName`**。Enter 時の **完全一致キー** |
| `IndustryCode` / `BranchCode` / `SubbranchCode` | string 3桁 | 産別・支部・分会 |
| `CollectiveKyosaiId` | number | 組織共済パッケージ ID（総合判定に使用） |
| `KakekinPerPerson` | number | 1 人あたり月額掛金 = **Σ (Premi × Units)**（エクスポート時に確定） |
| `Kyosai[]` | array | 加入共済の内訳 |

### 10.4 `Kyosai[]` の各要素（Web が使用するもの）

| フィールド | 型 | 必須 | 意味 |
|-----------|-----|------|------|
| `KyosaiId` | number | ○ | 種目 ID（口欄マッピングのキー） |
| `Units` | number | ○ | 契約口数（`CollectiveKyosaiItem.Units`） |
| `Premi` | number | ○ | 1 口あたり掛金（エクスポート・検算用） |
| `KyosaiName` | string | △ | `Kyosai.KyosaiName`（デバッグ用） |

`categoryId` / `minorCategory` は Access 内部用としてよいが、**Web の口欄反映では使わない**。

### 10.5 サンプル

```json
{
  "updatedAt": "2026-08-28",
  "unions": [
    {
      "KyosaikaiCode": "001001001",
      "KyosaikaiName": "〇〇労働組合",
      "IndustryCode": "001",
      "BranchCode": "001",
      "SubbranchCode": "001",
      "CollectiveKyosaiId": 42,
      "KakekinPerPerson": 2500,
      "Kyosai": [
        {
          "KyosaiId": 3,
          "KyosaiName": "組織医療",
          "Units": 20,
          "Premi": 100
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
<<<<<<< HEAD
| 2 | `Kyosai[]` に `KyosaiId`, `Units`, `Premi` を出力 → **`docs/WEB_FORM_EXPORT.md`** |
=======
| 2 | `Kyosai[]` に `KyosaiId`, `Units`, `Premi` を出力 |
>>>>>>> 9925dcf8775a4cf31da84f5d337362fa3494f367
| 3 | `KakekinPerPerson = Σ(Premi×Units)` をエクスポート時に計算 |
| 4 | `union-contacts.json` に `KyosaikaiCode`, `ManagerFamilyName`, `ManagerEmail` を export |
| 5 | ~~総合扱いの `CollectiveKyosaiId` を確定し、`sogoCollectiveKyosaiIds` に連携~~ → **確定済み**（Web 側 `form-kyosai-map.json` に反映） |
| 6 | 1 組合分で検算 → 全組合で出力テスト |
| 7 | `keijirodokyosai.github.io/data/` へ配置 |

詳細は `kyosai-system` の `docs/COLLECTIVE_KYOSAI.md` を参照。

---

## 13. Web 側の今後（実装順）

1. ~~産別・支部・分会の入力枠を背景に追加~~ → **完了**
2. ~~`data/union-master.json` を受け取り、Enter 判定・コード・口欄・掛金反映~~ → **完了**
3. ~~組合員5行（異動内容・氏名・生年月日・性別・住所）・半角制限・郵便番号検索~~ → **完了**（郵便番号枠 §9.8、Access 対応・住所5分割・コード1枠 §9.9、**町村域正規化 §9.9**）
4. ~~背景 PNG の郵便番号ハイフン除去~~ → **完了**（§9.7）
5. ~~背景 PNG の性別欄 1.男 / 2.女 除去~~ → **完了**（§9.7.1）
6. ~~背景 PNG の組合員氏名欄 カナ 除去~~ → **完了**（§9.7.2）
7. ~~背景 PNG の異動内容列 新規/解約/変更 除去~~ → **完了**（§9.7.3）
8. ~~組合員氏名欄 CSS（§9.11 標準枠・位置）~~ → **完了**（§9.13）
8b. ~~ページ枚数（`/` 左右）入力枠~~ → **完了**（§5.6）
8c. ~~前月残・月計（人数）入力枠~~ → **完了**（§5.7・2026-08-31 実測修正）
8d. ~~入力ページの横フィット（§9.0.1）~~ → **完了**
8e. ~~備考入力枠~~ → **完了**（§5.8・2026-09-02 実測）
9. ~~組合員欄 CSS（住所2〜3行目横位置・郵便番号文字縦位置）~~ → **完了**（2026-09-02）
9b. 開発用仮表示の本番前削除（§14・1行目 placeholder 等）
9c. ~~操作ボタン・クリア~~ → **クリア完了**（§5.9）。~~保 存~~ → **完了**（§5.9・§9.0.2）。~~送 信~~ → **Web 実装完了**（§5.10）。**PA フロー・union-contacts エクスポート**は未構築
10. ~~組合名プルダウン（localStorage）・マスタからのデータ引き出し・追加確認・削除 UI~~ → **完了**（§5.2・`js/soshiki-form-union-storage.js`）
11. ~~**送 信**（OneDrive アップロード）~~ → **Web 完了**（§5.10）。Power Automate・`union-contacts.json`・Access 取込は未構築
12. ~~`validateSoshikiForm()` の配線（送信前チェック等）~~ → **完了**（§5.10）

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

**異動・性別**（`.soshiki-form-dev-marker`）: **全5行**。紺 `#123456`（入力欄の placeholder より濃い表示）。性別は **未選択**（ユーザーがクリックで選択）。

**入力欄 placeholder**（1行目のみ）: `rgba(18, 52, 86, 0.32)`・`font-weight: 300`。2〜5行目は空欄。

| 欄 | 1行目の仮表示 |
|----|----------------|
| 異動・新規／解約／変更 | **新 規 / 解 約 / 変 更**（全5行・行番号なし） |
| 組合員コード | なし（手入力・blur で0埋め） |
| カナ姓・名 | ｾｲ / ﾒｲ |
| 漢字姓・名 | 姓 / 名 |
| 生年月日 | なし |
| 性別 | 男 / 女（全5行・未選択） |
| 郵便番号 | 郵便番号 |
| 都道府県 | 都道府県 |
| 市区町村 | 行政区 |
| 町村域 | 町村域 |
| 番地 | 丁、番地 |
| 建物名 | 建物名 |

**フォーカス移動時:** 必須項目が入力済みで行からフォーカスが外れ、建物名が空のとき、`initMemberRowDevHintCleanup()` が当該行の **placeholder のみ** 削除する（異動・性別マーカーは残す）。

組合名 Enter でマスタ反映すると上書きされる。未登録名で Enter するとクリアされる。

---

## 15. 関連 PDF

| ファイル | 用途 |
|----------|------|
| `pdf/soshiki-form.pdf` | ダウンロード用（従来） |
| `pdf/soshiki-form-enter.pdf` | 入力ページ背景の原本 |
