# 京滋労働組合共済会サイト

京滋労働組合共済会の共済制度を案内する公式サイトです。
組合員向けに制度概要、パンフレット、各種書類を提供します。

---

## 公開URL

https://keijirodokyosai.github.io/

最終更新日：2026-03-17

---

## サイトの目的

本サイトは組合員向けに以下の情報を提供します。

* 共済制度の概要
* 共済パンフレット
* 各種申請書
* お知らせ
* お問い合わせ

長期運用を前提とした静的サイトとして構築しています。

---

## サイト構造

```
トップ
│
├ 共済制度
│　├ 火災共済
│　├ 生命共済
│　├ 医療共済
│　├ 高齢生命共済
│　├ 高齢医療共済
│　├ 交通共済
│　├ 自動車共済
│　└ 自転車共済
│
├ 書類ダウンロード
├ よくある質問
├ お知らせ
└ お問い合わせ
```

---

## 使用技術

* HTML
* CSS
* JavaScript（軽微な動作のみ）
* Jekyll（FrontMatterのみ）

※ テンプレート機能は使用していません。

---

## ホスティング

GitHub Pages を使用

* リポジトリ：`keijirodokyosai.github.io`
* ブランチ：`main`
* 公開：自動反映
* 反映時間：1〜2分

---

## ディレクトリ構造

```
/
  index.html

  kasai.html
  seimei.html
  iryo.html
  korei-seimei.html
  korei-iryo.html
  kotsu.html
  jidosha.html
  jitensha.html

  downloads.html
  faq.html
  news.html
  contact.html

  sitemap.xml
  robots.txt

  /css
    style.css

  /images
  /icons
  /pdf
```

---

## 共済ページ一覧

| ページ               | 内容     | 画像               | PDF              |
| ----------------- | ------ | ---------------- | ---------------- |
| kasai.html        | 火災共済   | kasai.png        | kasai.pdf        |
| seimei.html       | 生命共済   | seimei.png       | seimei.pdf       |
| iryo.html         | 医療共済   | iryo.png         | iryo.pdf         |
| korei-seimei.html | 高齢生命共済 | korei-seimei.png | korei-seimei.pdf |
| korei-iryo.html   | 高齢医療共済 | korei-iryo.png   | korei-iryo.pdf   |
| kotsu.html        | 交通共済   | kotsu.png        | kotsu.pdf        |
| jidosha.html      | 自動車共済  | -                | 外部リンク            |
| jitensha.html     | 自転車共済  | jitensha1/2.png  | jitensha1/2.pdf  |

---

## 共済ページ仕様

テンプレート：`kyosai.html`

構造：

1. パンくず
2. タイトル
3. 概要
4. パンフレット
5. 注意事項
6. 必要書類

---

## 特記事項

### 自動車共済

* パンフレットなし
* 外部リンク
  https://nishijikyo.com/

### 自転車共済

* パンフレット2種（表・裏）

---

## 画像ルール

保存：`/images`

命名：

```
kasai.png
seimei.png
iryo.png
```

例外：

```
jitensha1.png
jitensha2.png
```

---

## PDFルール

保存：`/pdf`

命名：

```
kasai.pdf
seimei.pdf
iryo.pdf
```

例外：

```
jitensha1.pdf
jitensha2.pdf
```

---

## CSS設計

ファイル：`/css/style.css`

### 方針

* シンプル
* 可読性重視
* モバイル対応
* 外部ライブラリ不使用
* 長期運用前提

---

## カラーデザイン（統一仕様）

### 背景

* `#f6fff6`

### ヒーロー

* `linear-gradient(180deg, #eeffee, #f6fff6)`

### カード

* `#f6f0e6`

---

### 文字

* 本文：`#123456`
* サブ：`#366084`

---

### ヘッダー・フッター

* `#123660`

---

### ナビ

* 通常：`#ffffff`
* hover：`#36a872`

---

### リンク

* 通常：`#36a872`
* hover：`#247248`
* 下線：あり

---

### ボタン

* primary：`#36a872`
* hover：`#247248`

---

### 見出し左線

* `border-left: 9px solid #36a872`

---

### フォーカス

* `rgba(54,168,114,0.6)`

---

## 設計ルール

* 全デバイス同一配色
* 色の分岐禁止
* アクセントカラー統一
* リンクは下線付き

---

## 廃止仕様

* スマホ専用カラー
* デバイス別色変更
* 見出し色の分岐

---

## SEO

* sitemap.xml
* robots.txt
* JSON-LD

---

## 更新方法

1. HTML編集
2. push
3. 自動反映

---

## 新規ページ追加

1. kyosai.htmlコピー
2. ページ作成
3. FrontMatter編集
4. 画像・PDF追加
5. トップへリンク

---

## 運用ルール

* シンプル維持
* 静的運用
* 構造変更禁止

---

## 管理

京滋労働組合共済会
専務理事
横山雄介

---

## 備考

本サイトは GitHub Pages + 静的HTML により
長期安定運用を目的としています。
