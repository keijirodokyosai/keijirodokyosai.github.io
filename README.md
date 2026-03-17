京滋労働組合共済会サイト

京滋労働組合共済会の共済制度を案内する公式サイトです。
組合員向けに制度概要、パンフレット、各種書類、お問い合わせ先を提供します。

公開URL

https://keijirodokyosai.github.io/

最終更新日：2026-03-17

サイトの目的

本サイトは組合員向けに以下の情報を提供します。

共済制度の概要

共済パンフレット

各種申請書

お知らせ

お問い合わせ

長期運用を前提とした、軽量で可読性の高い静的サイトとして構築しています。

サイト構造

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

使用技術

HTML

CSS

JavaScript（最小限）

Jekyll（layout / include / FrontMatter のみ使用）

ホスティング

GitHub Pages

リポジトリ：keijirodokyosai.github.io

ブランチ：main

自動反映（約1〜2分）

ディレクトリ構造

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

共済ページ一覧
ページ	内容	画像	PDF
kasai.html	火災共済	kasai.png	kasai.pdf
seimei.html	生命共済	seimei.png	seimei.pdf
iryo.html	医療共済	iryo.png	iryo.pdf
korei-seimei.html	高齢生命共済	korei-seimei.png	korei-seimei.pdf
korei-iryo.html	高齢医療共済	korei-iryo.png	korei-iryo.pdf
kotsu.html	交通共済	kotsu.png	kotsu.pdf
jidosha.html	自動車共済	-	外部リンク
jitensha.html	自転車共済	jitensha1/2.png	jitensha1/2.pdf
特記事項

■ 自動車共済
・パンフレットなし
・外部リンク：https://nishijikyo.com/

■ 自転車共済
・パンフレット2種（表・裏）

CSS設計

ファイル：/css/style.css

■ 方針

シンプル

可読性重視

モバイル対応

外部ライブラリ不使用

長期運用前提

フォント設計（最新版）

■ 基本フォント
-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Meiryo", sans-serif

■ 変更点

Yu Gothic を削除

Windows環境の可読性改善

メイリオ優先表示

PC版の本文最適化

@media (min-width: 769px) {
body {
font-size: 18px;
line-height: 1.6;
font-weight: 500;
}
}

■ 効果

行間を少し詰めて読みやすく

文字を少し太くして視認性向上

サイズは維持して安定感を確保

UI調整（今回の変更）

■ お問い合わせ枠の余白

.contact-card {
padding: 18px 18px;
}

■ リンク下線の調整

.text-link {
text-decoration: underline;
text-underline-offset: 3px;
}

■ 効果

下線と文字の干渉を解消

電話番号・メールの視認性向上

カラーデザイン

■ 背景

全体：#fafffa

ヒーロー：linear-gradient(180deg, #eaffea, #fafffa)

■ カード

#fffaf0

角丸：18px

■ 文字

本文：#123456

サブ：#234567

■ ヘッダー・フッター

背景：#123660

文字：#f6faff

■ リンク

通常：#36a872

hover：#247248

■ ボタン

primary：#bbeebb → #247248

UI仕様メモ

■ ヘッダー

sticky固定

ナビ hoverで下線

現在地強調

■ ヒーロー

上余白：36px

■ ボタン

最小幅240px

中央配置

■ カード

hoverで浮く

情報用とナビ用を分離

設計ルール

色の分岐禁止

デバイス別デザイン禁止

シンプル維持

UI過剰装飾禁止

更新方法

HTML編集

CSS編集

push

自動反映

SEO

sitemap.xml

robots.txt

JSON-LD対応

OGP対応

管理

京滋労働組合共済会
専務理事
横山雄介

備考

本サイトは GitHub Pages + 静的HTML により
長期安定運用・低コスト・高可読性を目的としています。
