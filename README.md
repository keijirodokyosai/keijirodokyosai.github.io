# 京滋労働組合共済会サイト

京滋労働組合共済会の共済制度を案内する公式サイトです。  
組合員向けに制度概要、パンフレット、各種書類、お問い合わせ先を提供します。

---

## 公開URL

https://keijirodokyosai.github.io/

最終更新日：2026-03-17

---

## サイトの目的

本サイトは組合員向けに以下の情報を提供します。

- 共済制度の概要
- 共済パンフレット
- 各種申請書
- お知らせ
- お問い合わせ

長期運用を前提とした、軽量で可読性の高い静的サイトとして構築しています。

---

## サイト構造

トップ  
├ 共済制度  
│　├ 火災共済  
│　├ 生命共済  
│　├ 医療共済  
│　├ 高齢生命共済  
│　├ 高齢医療共済  
│　├ 交通共済  
│　├ 自動車共済  
│　└ 自転車共済  
├ 書類ダウンロード  
├ よくある質問  
├ お知らせ  
└ お問い合わせ  

---

## 使用技術

- HTML
- CSS
- JavaScript（最小限）
- Jekyll（layout / include / FrontMatter のみ使用）

---

## ホスティング

GitHub Pages

- リポジトリ：keijirodokyosai.github.io
- ブランチ：main
- push後に自動反映

---

## ディレクトリ構造

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
  /icons
  /pdf

---

## 共済ページ一覧

| ページ | 内容 | 画像 | PDF |
|--------|------|------|-----|
| kasai.html | 火災共済 | kasai.png | kasai.pdf |
| seimei.html | 生命共済 | seimei.png | seimei.pdf |
| iryo.html | 医療共済 | iryo.png | iryo.pdf |
| korei-seimei.html | 高齢生命共済 | korei-seimei.png | korei-seimei.pdf |
| korei-iryo.html | 高齢医療共済 | korei-iryo.png | korei-iryo.pdf |
| kotsu.html | 交通共済 | kotsu.png | kotsu.pdf |
| jidosha.html | 自動車共済 | - | 外部リンク |
| jitensha.html | 自転車共済 | jitensha1/2.png | jitensha1/2.pdf |

---

## 特記事項

### 自動車共済

- パンフレットなし
- 外部リンク：https://nishijikyo.com/

### 自転車共済

- パンフレット2種（表・裏）

---

## CSS設計

ファイル：/css/style.css

### 方針

- シンプル
- 可読性重視
- モバイル対応
- 外部ライブラリ不使用
- 長期運用前提

---

## スペーシングルール

余白は6pxベースで統一しています。

- 6px：最小
- 12px：小
- 18px：やや小
- 24px：標準
- 30px：やや大
- 36px：大
- 48px：かなり大
- 60px：セクション
- 72px：最大

基本方針：
- 迷ったら24px
- テキスト周りは12px / 18px
- コンポーネント間は24px
- セクション間は60px

---

## フォント設計（最新版）

### 基本フォント

-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Meiryo", sans-serif

### 変更点

- "Yu Gothic" を削除
- Windows環境での可読性を改善
- メイリオ優先表示に変更

### PC版の本文最適化

769px以上では以下を適用：

@media (min-width: 769px) {
  body {
    font-size: 18px;
    line-height: 1.6;
    font-weight: 500;
  }
}

効果：
- 文字サイズは維持
- 行間を少し詰めて読みやすく調整
- 文字を少し太くして視認性を改善

---

## 横幅設計

### 基本方針

- 全体レイアウトは広めに維持
- 本文系コンテンツは読みやすさを優先
- 詳細ページ本文は最大900pxで中央寄せ

### 適用内容

.detail-section {
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

効果：
- 長文の横幅を抑えて読みやすさを改善
- PC表示時の視線移動を軽減
- トップのヒーロー領域と幅の考え方を統一

---

## UI調整（今回の変更）

### お問い合わせボタン上の余白追加

.hero-buttons {
  margin-top: 24px;
}

効果：
- ニュースカードと「お問い合わせはこちら」ボタンが接しすぎる状態を解消
- カード群とボタン群の区切りを明確化

### お問い合わせ枠の余白調整

.contact-card {
  padding: 18px;
}

### 電話番号・メールリンク下線の調整

.text-link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

効果：
- 下線が文字に近すぎる状態を改善
- 電話番号・メールアドレスの視認性を向上

### カード本文の行間調整

.kyosai-card p {
  line-height: 1.5;
}

効果：
- カード文面の情報密度を改善
- PC表示時も間延びしにくい構成に調整

---

## カラーデザイン

### 背景

- 全体：#fafffa
- ヒーロー：linear-gradient(180deg, #eaffea, #fafffa)

### カード

- 通常：#fffaf0
- 角丸：18px

### 文字

- 本文：#123456
- サブ：#234567

### ヘッダー・フッター

- 背景：#123660
- 文字：#f6faff

### ナビ

- 通常：#f6faff
- hover：#eeffee
- 現在地：#ffffff（下線あり）

### パンくず

- 通常：#123456
- hover：#247248

### リンク

- 通常：#36a872
- hover：#247248

### ボタン（primary）

- 背景：#bbeebb
- 文字：#123456
- hover背景：#247248
- hover文字：#fafffa

---

## UI仕様メモ

### ヘッダー

- sticky固定
- ロゴは hover / focus で変化なし
- ナビは hoverで下線表示
- 現在地は色＋下線で強調
- スマホではハンバーガーメニュー表示

### ヒーロー

- 上余白：36px
- ヒーロー本文は最大900px
- 補助テキストあり
- 必要以上の装飾は避ける

### ボタン

- 最小幅：240px
- 中央配置対応
- 「お問い合わせはこちら」は primary ボタンを使用

### カード

- 共済一覧・案内一覧はカード型UI
- hover時に軽く浮き上がる
- 情報表示枠は別コンポーネントで管理

### 詳細ページ本文

- 各詳細セクションは最大900px
- 長文の可読性を優先
- セクションごとに独立した余白管理

---

## 設計ルール

- 色の分岐禁止
- デバイス別デザイン禁止
- シンプル維持
- UIの過剰装飾禁止
- コンポーネント再利用前提
- 長期運用時に迷わない構成を優先

---

## 更新方法

1. HTML編集
2. CSS編集
3. mainブランチへ push
4. GitHub Pages に自動反映

---

## SEO

- sitemap.xml
- robots.txt
- JSON-LD対応
- OGP対応

---

## 管理

京滋労働組合共済会  
専務理事  
横山雄介

---

## 備考

本サイトは GitHub Pages + 静的HTML により、  
長期安定運用・低コスト・高可読性を目的として運用します。
