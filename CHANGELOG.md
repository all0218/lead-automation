# CHANGELOG

プッシュのたびに先頭に追記する。書き方は `.github/PUSH_RULE.md` を参照。

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
