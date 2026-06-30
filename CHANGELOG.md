# CHANGELOG

プッシュのたびに先頭に追記する。書き方は `.github/PUSH_RULE.md` を参照。

---

## [2026-06-30] タブ命名ルールを修正・スクリプトテンプレートを更新

**変更内容:**
- `sheets-importer.js`：タブ名を `サイト名_ログインID`（複数CSV時は `_レポート名` を追加）に変更
- `importCsvToSheet()` の引数に `loginId`・`reportName`（省略可）を追加
- 各 `routine.js` に lib/ の呼び出しサンプルと複数CSV時の使い方コメントを追記

**タブ命名ルール:**
- CSVが1つ: `まるなげセミナー_MN-00024`
- CSVが複数: `まるなげセミナー_MN-00024_セミナー参加者` / `まるなげセミナー_MN-00024_問い合わせ`

**変更ファイル:**
- `lib/sheets-importer.js`（修正）
- `scripts/malnage-seminar/routine.js`（修正）
- `scripts/peatix/routine.js`（修正）
- `scripts/majisemi/routine.js`（修正）

**担当:** Claude Code

---

## [2026-06-30] 共通ライブラリ（lib/）を追加

**変更内容:**
- `drive-uploader.js`：CSVをGoogleドライブにアップロード・削除
- `sheets-importer.js`：CSVをスプレッドシートのタブに書き込み（タブ名 = サイト名、既存タブ上書き）
- `gas-callback.js`：GASウェブアプリへの完了通知（B列書き込みトリガー）
- フォルダID・スプレッドシートIDはURLから動的に抽出

**変更ファイル:**
- `lib/drive-uploader.js`（新規）
- `lib/sheets-importer.js`（新規）
- `lib/gas-callback.js`（新規）

**担当:** Claude Code

---

## [2026-06-30] GitHub Actionsワークフロー・package.json を追加

**変更内容:**
- `auto.yml` を作成（workflow_dispatch トリガー、8つのinputs定義）
- `package.json` を作成（playwright / googleapis の依存関係定義）
- inputs: site_name / target_url / login_id / password / script_path / drive_folder_url / lead_sheet_url / row_index
- 実行後にGASコールバックでB列（最終稼働日時）を書き込む仕組みを実装

**変更ファイル:**
- `.github/workflows/auto.yml`（新規）
- `package.json`（新規）

**担当:** Claude Code

---

## [2026-06-30] スクリプトディレクトリ構成を追加

**変更内容:**
- 3サイト分のスクリプトフォルダ・プレースホルダーを作成
- プッシュログルール（CHANGELOG.md / .github/PUSH_RULE.md）を新設
- 入力規則シートのスクリプトパスを更新

**変更ファイル:**
- `scripts/malnage-seminar/routine.js`（新規）
- `scripts/peatix/routine.js`（新規）
- `scripts/majisemi/routine.js`（新規）
- `CHANGELOG.md`（新規）
- `.github/PUSH_RULE.md`（新規）

**担当:** Claude Code
