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
* JavaScript（最小限）
* Jekyll（layout / include のみ使用）

---

## ホスティング

GitHub Pages

* リポジトリ：`keijirodokyosai.github.io`
* ブランチ：`main`
* 自動反映（約1〜2分）

---

## ディレクトリ構造

```
/
  _layouts/
    default.html

  _includes/
    header.html
    footer.html

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

  /js
    script.js

  /images
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

## 特記事項

### 自動車共済

* パンフレットなし
* 外部リンク：https://nishijikyo.com/

### 自転車共済

* パンフレット2種（表・裏）

---

## ファイル命名ルール

### 画像（/images）

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

### PDF（/pdf）

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

## カラーデザイン（最新版）

### 背景

* 全体：`#fafffa`
* ヒーロー：`linear-gradient(180deg, #eeffee, #fafffa)`

### カード

* 通常：`#fffaf0`
* 角丸：`18px`

### 文字

* 本文：`#123456`
* サブ：`#366084`

### ヘッダー・フッター

* 背景：`#123660`
* 文字：`#f6faff`

### ナビ

* 通常：`#f6faff`
* hover：`#eeffee`

### リンク

* 通常：`#36a872`
* hover：`#247248`

---

## 設計ルール

* 色の分岐禁止
* デバイス別デザイン禁止
* シンプル維持
* UIの過剰装飾禁止

---

## 更新方法

1. HTML編集
2. push
3. 自動反映

---

## 新規ページ追加

1. 既存ページをコピー
2. FrontMatter編集
3. 画像・PDF追加
4. トップへリンク

---

## SEO

* sitemap.xml
* robots.txt
* JSON-LD対応

---

## 管理

京滋労働組合共済会
専務理事
横山雄介

---

## 備考

本サイトは GitHub Pages + 静的HTML により
長期安定運用を目的としています。
