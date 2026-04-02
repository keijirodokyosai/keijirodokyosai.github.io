# 京滋労働組合共済会サイト

京滋労働組合共済会の共済制度を案内する公式サイトです。
組合員向けに、制度概要、パンフレット、各種書類、お問い合わせ先、見積り依頼などを提供します。

本サイトは、**長期運用を前提とした、軽量で可読性の高い静的サイト**として構築しています。

---

## 公開URL

```text
https://keijirodokyosai.github.io/
```

**最終更新日：2026-04-03**

---

## サイトの目的

本サイトは、組合員向けに以下の情報を提供することを目的としています。

* 共済制度の概要
* 共済パンフレット
* 各種申請書類
* 給付申請に必要な情報
* お知らせ
* お問い合わせ
* おうちの安心共済（火災共済）の見積り依頼

特に重要視しているのは、**利用者が迷わず必要な情報にたどり着けること**です。
見た目の派手さよりも、分かりやすさ、読みやすさ、運用しやすさを優先しています。

---

## 設計思想

本サイトは以下の方針で設計しています。

* シンプルで迷わない構造
* 高齢者を含めて読みやすい文字設計
* 情報の階層を明確にする
* 不要な装飾を避ける
* 長期運用時に迷わない構成を優先する
* 表示名（日本語）と内部管理名（英語ファイル名）を分離する
* コンポーネント再利用を前提にする
* GitHub Pagesで安定運用できる構成にする

### 設計ルール

* 色の分岐禁止
* デバイス別デザイン禁止
* シンプル維持
* UIの過剰装飾禁止
* コンポーネント再利用前提
* 長期運用時に迷わない構成を優先

---

## サイト構造

* トップ

  * 共済制度

    * 火災共済
    * 医療共済
    * 生命共済
    * 交通災害共済
    * 高齢医療共済
    * 高齢生命共済
    * 自転車共済
    * 自動車共済
    * ONE-CO共済
  * 書類ダウンロード
  * よくある質問
  * お知らせ
  * お問い合わせ
  * おうちの安心共済（火災共済）見積り依頼

---

## 使用技術

* HTML
* CSS
* JavaScript（最小限）
* Jekyll（layout / include / FrontMatter のみ使用）

---

## ホスティング

* GitHub Pages
* リポジトリ：`keijirodokyosai.github.io`
* ブランチ：`main`
* `main` ブランチへ push 後、自動反映

---

## ディレクトリ構造

```text
/
├─ _layouts/
│  └─ default.html
├─ _includes/
│  ├─ header.html
│  └─ footer.html
├─ index.html
├─ kasai.html
├─ iryo.html
├─ seimei.html
├─ kotsu.html
├─ korei-iryo.html
├─ korei-seimei.html
├─ jitensha.html
├─ jidosha.html
├─ one-co.html
├─ downloads.html
├─ faq.html
├─ news.html
├─ contact.html
├─ estimate.html
├─ sitemap.xml
├─ robots.txt
├─ css/
│  └─ style.css
├─ js/
│  └─ script.js
├─ images/
├─ icons/
└─ pdf/
```

---

## ページ一覧

| ページ                 | 内容                  | 画像                 | PDF                |
| ------------------- | ------------------- | ------------------ | ------------------ |
| `index.html`        | トップページ              | -                  | -                  |
| `kasai.html`        | 火災共済                | `kasai.png`        | `kasai.pdf`        |
| `iryo.html`         | 医療共済                | `iryo.png`         | `iryo.pdf`         |
| `seimei.html`       | 生命共済                | `seimei.png`       | `seimei.pdf`       |
| `kotsu.html`        | 交通災害共済              | `kotsu.png`        | `kotsu.pdf`        |
| `korei-iryo.html`   | 高齢医療共済              | `korei-iryo.png`   | `korei-iryo.pdf`   |
| `korei-seimei.html` | 高齢生命共済              | `korei-seimei.png` | `korei-seimei.pdf` |
| `jitensha.html`     | 自転車共済               | `jitensha1/2.png`  | `jitensha1/2.pdf`  |
| `jidosha.html`      | 自動車共済               | -                  | 外部リンク              |
| `one-co.html`       | ONE-CO共済            | `one-co.png`       | `one-co.pdf`       |
| `downloads.html`    | 書類ダウンロード            | -                  | 各種PDF              |
| `faq.html`          | よくある質問              | -                  | -                  |
| `news.html`         | お知らせ                | -                  | -                  |
| `contact.html`      | お問い合わせ              | -                  | -                  |
| `estimate.html`     | おうちの安心共済（火災共済）見積り依頼 | -                  | -                  |

---

## 特記事項

### 自動車共済

* パンフレットなし
* 外部リンク：`https://nishijikyo.com/`

### 自転車共済

* パンフレット2種（表・裏）

### ONE-CO共済

* 対象：30歳未満の方
* 掛金：月500円
* パンフレット画像あり
* PDFあり

### 見積り依頼ページ

* ページ名：`estimate.html`
* 対象：おうちの安心共済（火災共済）
* 見積り依頼方法：Eメール
* メール送信先：`kjkyosaikai@msn.com`
* 3日以内に見積内容をメールで返信
* 案内ページ（`kasai.html`）へのリンクあり

#### 必要事項

* 所属の組合名
* 氏名
* 住宅が木造か鉄筋か
* 居住人数
* 住宅は自家か借家か
* 他の火災保険の加入の有無

メール本文には入力用ひな形を自動挿入します。

---

## 書類ダウンロードページ

### 対象ページ

```text
/downloads.html
```

### 役割

書類ダウンロードページは、利用者が必要な申請書類・証明書類を迷わず探せるように整理したページです。
本ページでは、PDFを直接ダウンロードまたは表示できるようにします。

### ページ構成

#### 契約関係書類

* 申込書
* 告知書等

#### 給付関係書類

* 申請書
* 証明書・報告書等
* 補足書類

#### その他書類

* 今後追加予定

### UIルール

#### 書類リンク

* 書類名をそのままリンクにする
* 「ダウンロード」という文言は付けない
* `(PDF)` などの表記も付けない
* 必要な書類名をクリックすると PDF を開く構成とする

#### ボタン

* 案内系PDFのみボタンを使用する
* 一般の書類PDFはボタンにしない
* ボタンは「一覧そのもの」ではなく「案内資料」であることが伝わる文言にする

#### 給付関係の案内ボタン

対象PDF：

```text
kyufu-required-documents.pdf
```

表示文言：

```text
給付事由による必要書類について
```

### なぜこの構成にしているか

* ボタンを大量に並べると視認性が落ちるため
* 書類一覧はリンク形式の方が一覧性が高いため
* 案内PDFだけは目立たせる必要があるため
* 高齢者や初見利用者にも、ページの役割が直感的に伝わるため

---

## PDF配置ルール

すべてのPDFは `/pdf/` フォルダに配置します。

```text
/pdf/
```

### 配置理由

* 画像・CSS・JS などと役割を分離できる
* 書類の管理がしやすい
* HTMLからの参照先が統一できる
* 長期運用時に迷いにくい

---

## PDF命名ルール

### 基本ルール

* 小文字のみ使用
* 単語はハイフン（`-`）で接続
* 拡張子は `.pdf`
* 日本語ファイル名は使用しない
* 表示名（日本語）と内部ファイル名（英語）を分離する

### 命名の考え方

ファイル名は、利用者向けではなく**管理者向け**の識別子として扱います。
そのため、以下を優先します。

* 短い
* 一貫している
* 意味が分かる
* 将来追加時に破綻しない

### 種別ルール

| 種類            | 用途    |
| ------------- | ----- |
| `form`        | 申込書   |
| `claim-form`  | 給付申請書 |
| `certificate` | 証明書   |
| `report`      | 報告書   |
| `declaration` | 告知書   |

---

## PDFファイル一覧

### 契約関係（申込書）

```text
kasai-form.pdf
kojin-form.pdf
soshiki-form.pdf
oneco-form.pdf
jitensha-form.pdf
kanwa-iryo-form.pdf
```

### 契約関係（告知書等）

```text
health-declaration.pdf
health-declaration-kanwa.pdf
```

### 給付関係（申請書）

```text
claim-form-general.pdf
claim-form-kasai.pdf
claim-form-central-keicho.pdf
claim-form-keiji-keicho.pdf
```

### 給付関係（証明書・報告書等）

```text
medical-certificate.pdf
treatment-certificate.pdf
leave-certificate.pdf
accident-report-initial.pdf
housing-damage-report-initial.pdf
injury-accident-certificate.pdf
disability-certificate.pdf
consent-form.pdf
```

### 給付関係（補足書類）

```text
union-accident-certificate.pdf
```

### 案内用PDF

```text
kyufu-required-documents.pdf
```

---

## CSS設計

**ファイル：** `/css/style.css`

### 方針

* シンプル
* 可読性重視
* モバイル対応
* 外部ライブラリ不使用
* 長期運用前提

---

## スペーシングルール

余白は **6pxベース** で統一しています。

* 6px：最小
* 12px：小
* 18px：やや小
* 24px：標準
* 30px：やや大
* 36px：大
* 48px：かなり大
* 60px：セクション
* 72px：最大

### 基本方針

* 迷ったら24px
* テキスト周りは12px / 18px
* コンポーネント間は24px
* セクション間は60px

---

## フォント設計

### 基本フォント

```css
-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Meiryo", sans-serif
```

### 方針

* `"Yu Gothic"` は使用しない
* Windows環境での可読性を優先
* メイリオ優先表示にする

### PC版の本文最適化

769px以上では以下を適用します。

```css
@media (min-width: 769px) {
  body {
    font-size: 18px;
    line-height: 1.6;
    font-weight: 500;
  }
}
```

### 効果

* 文字サイズ18pxを維持
* 行間を少し詰めて読みやすく調整
* 文字を少し太くして視認性を改善

---

## 説明文の強調

ヒーローの解説文と共済詳細ページ冒頭の説明文は、視認性向上のため `font-weight: 500;` を適用しています。

### 対象

* `.hero-note`
* `.hero-sub-links`
* `.detail-lead`

### 効果

* 説明文が本文に埋もれにくい
* ヒーローと詳細ページの案内文が読み取りやすい
* デザインを崩さずに存在感を上げられる

---

## 横幅設計

### 基本方針

* 全体レイアウトは広めに維持
* 本文系コンテンツは読みやすさを優先
* 詳細ページ本文は最大幅を抑えて中央寄せ

### 効果

* 長文の横幅を抑えて読みやすくする
* PC表示時の視線移動を軽減する
* トップのヒーロー領域と考え方を統一する

---

## カラーデザイン

### 背景

* 全体：`#fafffa`
* ヒーロー：`linear-gradient(180deg, #eaffea, #fafffa)`

### カード

* 通常：`#fffaf0`
* 角丸：`18px`

### 文字

* 本文：`#123456`
* サブ：`#234567`

### ヘッダー・フッター

* 背景：`#123660`
* 文字：`#f6faff`

### ナビ

* 通常：`#f6faff`
* hover：`#eeffee`
* 現在地：`#ffffff`（下線あり）

### パンくず

* 通常：`#123456`
* hover：`#247248`

### リンク

* 通常：`#36a872`
* hover：`#247248`

### ボタン（primary）

* 背景：`#bbeebb`
* 文字：`#123456`
* hover背景：`#247248`
* hover文字：`#fafffa`

### ONE-CO共済アイコン

* ファイル：`/icons/one-co.svg`
* 背景色：ライトグリーン
* モチーフ：500円玉をイメージしたシンプルなコイン
* 既存アイコンと同じく、角丸四角の単色背景＋白モチーフで構成

---

## UI仕様メモ

### ヘッダー

* sticky固定
* ロゴは hover / focus で変化なし
* ナビは hover で下線表示
* 現在地は色＋下線で強調
* スマホではハンバーガーメニュー表示

### ヒーロー

* 上余白：36px
* ヒーロー本文は最大幅を制御
* 補助テキストあり
* 解説文は `font-weight: 500;`
* 必要以上の装飾は避ける

### ボタン

* 最小幅：240px
* 中央配置対応
* 「お問い合わせはこちら」は primary ボタンを使用
* 書類ダウンロードページでは案内系PDFのみボタン使用

### カード

* 共済一覧・案内一覧はカード型UI
* hover時に軽く浮き上がる
* 情報表示枠は別コンポーネントで管理
* カード本文は行間1.5で調整

### 詳細ページ本文

* 各詳細セクションは中央寄せ
* 長文の可読性を優先
* セクションごとに独立した余白管理
* 冒頭説明文は `font-weight: 500;`

### ダウンロードページ

* 書類一覧はリンク形式
* 書類名に「ダウンロード」は付けない
* `(PDF)` 表記も付けない
* 給付関係の案内のみボタン使用
* ダウンロード対象の書類名は、本文より少し目立つ設計にする

---

## 更新方法

* HTML編集
* CSS編集
* PDF追加・差し替え
* `main` ブランチへ push
* GitHub Pages に自動反映

### ダウンロードページ更新手順

1. PDFを `/pdf/` に配置
2. 命名ルールに沿ってファイル名を設定
3. `downloads.html` にリンクを追加または修正
4. 公開後、リンク先PDFが正しく開くか確認

---

## 公開前チェック

### 必須

* ファイル名とリンクが完全一致しているか
* PDFがすべて `/pdf/` に存在するか
* スペルミスがないか
* リンク切れがないか

### 推奨

* スマホ表示確認
* PDFが正しく開くか確認
* 表示名とPDF内容の一致確認
* 案内ボタンの位置と文言が自然か確認

---

## SEO

* `sitemap.xml`
* `robots.txt`
* JSON-LD対応
* OGP対応

---

## 管理

京滋労働組合共済会
専務理事
横山雄介

---

## 備考

本サイトは GitHub Pages + 静的HTML により、
**長期安定運用・低コスト・高可読性** を目的として運用します。

構造・命名・UIルールは、長期運用時の混乱を防ぐため、原則として統一を維持してください。

---
