# 京滋労働組合共済会サイト

京滋労働組合共済会の共済制度を案内する公式サイトです。
組合員向けに制度概要、パンフレット、各種書類を提供します。

**公開URL**

https://keijirodokyosai.github.io/

---

# サイトの目的

本サイトは組合員向けに以下の情報を提供します。

* 共済制度の概要
* 共済パンフレット
* 各種申請書
* お知らせ

長期運用を前提とした **静的サイト** として構築されています。

---

# サイト構造

```
トップ
│
├ 共済制度
│   ├ 火災共済
│   ├ 生命共済
│   ├ 医療共済
│   ├ 高齢生命共済
│   ├ 高齢医療共済
│   ├ 交通共済
│   ├ 自動車共済
│   └ 自転車共済
│
├ 書類ダウンロード
├ よくある質問
├ お知らせ
└ お問い合わせ
```

---

# 使用技術

| 技術         | 用途            |
| ---------- | ------------- |
| HTML       | ページ構築         |
| CSS        | デザイン          |
| JavaScript | 軽微な動作         |
| Jekyll     | FrontMatterのみ |

※Jekyllのテンプレート機能は使用していません。

---

# ホスティング

GitHub Pages を使用しています。

リポジトリ

```
keijirodokyosai.github.io
```

公開方法

```
mainブランチ
↓
GitHub Pages
↓
自動公開
```

更新は GitHub へ push するだけで反映されます。

反映時間
通常 **1〜2分**

---

# ディレクトリ構造

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
共済パンフレット画像


/icons
SVGアイコン


/pdf
パンフレットPDF
```

---

# 共済ページ一覧

| ページ               | 共済名称   | 画像                            | PDF                           | 備考        |
| ----------------- | ------ | ----------------------------- | ----------------------------- | --------- |
| kasai.html        | 火災共済   | kasai.png                     | kasai.pdf                     |           |
| seimei.html       | 生命共済   | seimei.png                    | seimei.pdf                    |           |
| iryo.html         | 医療共済   | iryo.png                      | iryo.pdf                      |           |
| korei-seimei.html | 高齢生命共済 | korei-seimei.png              | korei-seimei.pdf              |           |
| korei-iryo.html   | 高齢医療共済 | korei-iryo.png                | korei-iryo.pdf                |           |
| kotsu.html        | 交通共済   | kotsu.png                     | kotsu.pdf                     |           |
| jidosha.html      | 自動車共済  | -                             | -                             | 外部サイト     |
| jitensha.html     | 自転車共済  | jitensha1.png / jitensha2.png | jitensha1.pdf / jitensha2.pdf | パンフレット2種類 |

---

# 共済ページテンプレート

共済ページは

```
kyosai.html
```

をテンプレートとして作成します。

---

# 共済ページ構造

```
パンくずリスト

↓

共済タイトル

↓

共済概要

↓

パンフレット表示

↓

制度確認の注意

↓

必要書類案内
```

---

# 例外ページ

## 自動車共済

```
jidosha.html
```

特徴

* パンフレットなし
* 外部サイトへリンク

リンク先

```
https://nishijikyo.com/
```

---

## 自転車共済

```
jitensha.html
```

パンフレットが **2種類**

| 内容        | 画像            | PDF           |
| --------- | ------------- | ------------- |
| パンフレット（表） | jitensha1.png | jitensha1.pdf |
| パンフレット（裏） | jitensha2.png | jitensha2.pdf |

---

# 画像ルール

保存場所

```
/images
```

命名規則

```
共済名.png
```

例

```
kasai.png
seimei.png
iryo.png
kotsu.png
```

例外

```
jitensha1.png
jitensha2.png
```

---

# PDFルール

保存場所

```
/pdf
```

命名規則

```
共済名.pdf
```

例

```
kasai.pdf
seimei.pdf
iryo.pdf
kotsu.pdf
```

例外

```
jitensha1.pdf
jitensha2.pdf
```

---

# CSS

スタイルシート

```
/css/style.css
```

設計方針

* シンプル
* 可読性重視
* モバイル対応
* 外部フレームワーク不使用

---

# 更新方法

更新手順

1
HTML編集

2
画像またはPDF追加

3
GitHubへ push

4
GitHub Pages自動更新

---

# 新しい共済ページ追加

1
テンプレート

```
kyosai.html
```

をコピー

2
新しいページ作成

例

```
new-kyosai.html
```

3
FrontMatter修正

```
title
description
permalink
```

4
パンフレット設定

```
/images/共済名.png
/pdf/共済名.pdf
```

5
トップページへリンク追加

---

# SEO

以下を設置しています

```
sitemap.xml
robots.txt
```

また各ページに

* title
* description
* JSON-LDパンくず

を設定しています。

---

# 運用ルール

基本方針

* シンプル維持
* 静的サイト運用
* 構造変更を避ける

禁止事項

* 不要なJavaScript追加
* CMS導入
* 外部ライブラリ大量追加

---

# 管理

管理者
京滋労働組合共済会
専務理事
横山雄介

作成者
京滋労働組合共済会
専務理事
横山雄介

---

# 備考

本サイトは

```
GitHub Pages
静的HTML
```

構成により **長期安定運用** を目的として設計されています。
