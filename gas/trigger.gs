/**
 * lead-automation GASスクリプト（スタンドアロン）
 *
 * 【初期設定】スクリプトエディタ > プロジェクトの設定 > スクリプトプロパティに以下を登録:
 *   SPREADSHEET_URL : マスタースプレッドシートのURL
 *   GITHUB_PAT      : GitHub Personal Access Token（Actions: Write スコープのみ）
 *   GITHUB_OWNER    : GitHubアカウント名（例: all0218）
 *   GITHUB_REPO     : リポジトリ名（例: lead-automation）
 *
 * 【トリガー設定】runAutomation を時間ベーストリガーで毎日定時に実行
 *
 * 【ウェブアプリデプロイ】doPost をウェブアプリとして公開し、
 *   発行されたURLをGitHub Secrets の GAS_CALLBACK_URL に登録する
 */

// ─────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────

function getProps() {
  const p = PropertiesService.getScriptProperties();
  return {
    spreadsheetUrl : p.getProperty('SPREADSHEET_URL'),
    githubPat      : p.getProperty('GITHUB_PAT'),
    githubOwner    : p.getProperty('GITHUB_OWNER'),
    githubRepo     : p.getProperty('GITHUB_REPO'),
  };
}

// ヘッダー行から { 列名: インデックス } のマップを生成
// → 列順が変わっても自動追従する
function buildColumnMap(headerRow) {
  const map = {};
  headerRow.forEach(function(col, i) { map[col] = i; });
  return map;
}

// ─────────────────────────────────────────────
// メイン処理（毎日定時トリガー）
// ─────────────────────────────────────────────

function runAutomation() {
  const props = getProps();
  const ss = SpreadsheetApp.openByUrl(props.spreadsheetUrl);

  // マスタシートを動的に読み込む
  const masterSheet = ss.getSheetByName('マスタ');
  const masterData  = masterSheet.getDataRange().getValues();
  const masterCols  = buildColumnMap(masterData[0]);

  // 入力規則シートをサイト名キーのマップに変換
  const rulesSheet = ss.getSheetByName('入力規則');
  const rulesData  = rulesSheet.getDataRange().getValues();
  const rulesCols  = buildColumnMap(rulesData[0]);
  const rulesMap   = {};
  for (var r = 1; r < rulesData.length; r++) {
    var row      = rulesData[r];
    var siteName = row[rulesCols['サイト名']];
    if (siteName) {
      rulesMap[siteName] = {
        scriptPath   : row[rulesCols['スクリプトパス']],
        driveUrl     : row[rulesCols['ドライブURL']],
        leadSheetUrl : row[rulesCols['リード格納URL']],
      };
    }
  }

  // マスタ 2行目以降をループ
  for (var i = 1; i < masterData.length; i++) {
    var mRow   = masterData[i];
    var status = mRow[masterCols['稼働ステータス']];
    if (status !== 'ON') continue;

    var siteName  = mRow[masterCols['サイト名']];
    var targetUrl = mRow[masterCols['対象URL']];
    var loginId   = mRow[masterCols['ログインID']];
    var password  = mRow[masterCols['パスワード']];
    var rowIndex  = i + 1; // スプレッドシートの実際の行番号（ヘッダーが1行目）

    var rules = rulesMap[siteName];
    if (!rules) {
      Logger.log('入力規則にサイト名が見つかりません: ' + siteName);
      continue;
    }

    triggerWorkflow(props, {
      site_name       : siteName,
      target_url      : targetUrl,
      login_id        : loginId,
      password        : password,
      script_path     : rules.scriptPath,
      drive_folder_url: rules.driveUrl,
      lead_sheet_url  : rules.leadSheetUrl,
      row_index       : String(rowIndex),
    });

    Utilities.sleep(1000); // API連続呼び出し防止
  }
}

// ─────────────────────────────────────────────
// GitHub Actions workflow_dispatch 呼び出し
// ─────────────────────────────────────────────

function triggerWorkflow(props, inputs) {
  var url = 'https://api.github.com/repos/'
    + props.githubOwner + '/' + props.githubRepo
    + '/actions/workflows/auto.yml/dispatches';

  var options = {
    method          : 'POST',
    headers         : {
      'Authorization'       : 'Bearer ' + props.githubPat,
      'Accept'              : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type'        : 'application/json',
    },
    payload         : JSON.stringify({ ref: 'main', inputs: inputs }),
    muteHttpExceptions: true,
  };

  var res = UrlFetchApp.fetch(url, options);
  Logger.log(
    'workflow_dispatch: ' + inputs.site_name
    + ' (' + inputs.login_id + ')'
    + ' → HTTP ' + res.getResponseCode()
  );
}

// ─────────────────────────────────────────────
// コールバックエンドポイント（ウェブアプリとしてデプロイ）
// GitHub Actionsワークフロー完了後に呼び出され、マスタのB列を更新する
// ─────────────────────────────────────────────

function doPost(e) {
  try {
    var body     = JSON.parse(e.postData.contents);
    var rowIndex = body.row_index;
    var jobStatus = body.status; // "success" or "failure"

    if (!rowIndex) {
      return respond({ error: 'row_index is required' });
    }

    var props  = getProps();
    var ss     = SpreadsheetApp.openByUrl(props.spreadsheetUrl);
    var sheet  = ss.getSheetByName('マスタ');
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var cols   = buildColumnMap(header);

    var colIndex = cols['最終稼働日時'] + 1; // getRange は1始まり
    var now      = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
    var value    = jobStatus === 'success' ? now : 'エラー（' + now + '）';

    sheet.getRange(rowIndex, colIndex).setValue(value);

    return respond({ ok: true, row: rowIndex, value: value });
  } catch (err) {
    return respond({ error: err.message });
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
