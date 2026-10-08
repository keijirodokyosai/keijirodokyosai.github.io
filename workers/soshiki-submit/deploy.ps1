# 要: CLOUDFLARE_API_TOKEN（Windows ユーザー環境変数など）
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules\wrangler")) {
  npm install
}
npm run deploy
