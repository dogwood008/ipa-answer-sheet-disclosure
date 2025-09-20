#!/bin/sh
set -eu

# このスクリプトは E2E テスト用の初期素材を取得します。
# - テンプレート PDF を specs 配下に保存
# - Noto Sans JP を Google Fonts から ZIP 取得→展開→Regular の TTF をコピーして
#   NotoSansJP-Regular.ttf という名前で保存（残りはすべて一時領域で削除）

# 目的ディレクトリ（リポジトリ相対）
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEST_DIR="$(cd "$SCRIPT_DIR/../../specs/001-a4-pdf-pdf/poc" && pwd)"
mkdir -p "$DEST_DIR"

echo "Downloading template PDF to $DEST_DIR/in.pdf ..."
curl -fsSL -o "$DEST_DIR/in.pdf" "https://www.ipa.go.jp/privacy/hjuojm000000f2fl-att/02.pdf"
