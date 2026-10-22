# scripts/

| パス | 用途 |
|------|------|
| `soshiki-form-office/` | 事務 PC: OneDrive の submission JSON → Excel テンプレ → PDF（**README あり**） |
| `measure-soshiki-form-png-*.py` | 用紙 PNG 上の座標計測（開発時のみ） |
| `serve-open.ps1` | ローカル確認用の簡易サーバ |
| `_jekyll-common.ps1` | Jekyll ビルド共通 |
| `optimize-pamphlet-png.py` | 共済パンフレット用 WebP 生成（`soshiki-form-enter.png` は対象外） |
| `generate-qr-codes.py` | 配布用 QR（`QRコード/`・サイト非掲載） |

組織共済フォームの Web 実装はリポ直下の `js/`・`docs/soshiki-form-enter.md`。
