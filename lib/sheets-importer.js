const { google } = require('googleapis');
const fs = require('fs');

function createSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// スプレッドシートURLからIDを抽出
function extractSpreadsheetId(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`スプレッドシートURLからIDを取得できませんでした: ${url}`);
  return match[1];
}

// タブ名に使えない文字を _ に置換（最大100文字）
function sanitizeSheetName(name) {
  return name.replace(/[\/\\?\*\[\]:\x00-\x1f]/g, '_').slice(0, 100);
}

// CSVテキストを2次元配列にパース
function parseCsv(text) {
  return text.trim().split('\n').map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );
}

// 既存タブのシートIDを取得。なければnullを返す
async function getSheetId(sheets, spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheet = res.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

/**
 * タブ名を生成する
 *
 * 命名ルール:
 *   CSVが1つ: サイト名_ログインID
 *             例) まるなげセミナー_MN-00024
 *   CSVが複数: サイト名_ログインID_レポート名
 *             例) まるなげセミナー_MN-00024_セミナー参加者
 *
 * @param {string} siteName   - C列のサイト名
 * @param {string} loginId    - E列のログインID
 * @param {string} [reportName] - 複数CSVを区別するラベル（routine.js側で指定、省略可）
 */
function buildSheetName(siteName, loginId, reportName) {
  const base = reportName
    ? `${siteName}_${loginId}_${reportName}`
    : `${siteName}_${loginId}`;
  return sanitizeSheetName(base);
}

/**
 * CSVをスプレッドシートの指定タブに書き込む
 *
 * @param {string} localCsvPath  - ローカルのCSVファイルパス
 * @param {string} leadSheetUrl  - 書き込み先スプレッドシートURL（I列）
 * @param {string} siteName      - サイト名（C列）
 * @param {string} loginId       - ログインID（E列）
 * @param {string} [reportName]  - 複数CSV時の識別ラベル（省略可）
 */
async function importCsvToSheet(localCsvPath, leadSheetUrl, siteName, loginId, reportName) {
  const sheets = createSheetsClient();
  const spreadsheetId = extractSpreadsheetId(leadSheetUrl);
  const sheetName = buildSheetName(siteName, loginId, reportName);
  const csvText = fs.readFileSync(localCsvPath, 'utf-8');
  const values = parseCsv(csvText);

  const existingSheetId = await getSheetId(sheets, spreadsheetId, sheetName);
  const requests = [];

  if (existingSheetId === null) {
    requests.push({ addSheet: { properties: { title: sheetName } } });
  } else {
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: sheetName });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  console.log(`Sheets インポート完了: タブ「${sheetName}」に ${values.length} 行書き込み`);
}

module.exports = { importCsvToSheet, buildSheetName };
