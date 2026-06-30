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

// タブ名に使えない文字を _ に置換
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

// CSVをスプレッドシートの指定タブに書き込む（既存タブは上書き、なければ新規作成）
async function importCsvToSheet(localCsvPath, leadSheetUrl, siteName) {
  const sheets = createSheetsClient();
  const spreadsheetId = extractSpreadsheetId(leadSheetUrl);
  const sheetName = sanitizeSheetName(siteName);
  const csvText = fs.readFileSync(localCsvPath, 'utf-8');
  const values = parseCsv(csvText);

  // タブが存在するか確認
  const existingSheetId = await getSheetId(sheets, spreadsheetId, sheetName);

  const requests = [];

  if (existingSheetId === null) {
    // タブ新規作成
    requests.push({ addSheet: { properties: { title: sheetName } } });
  } else {
    // 既存タブのデータをクリア
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}`,
    });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }

  // データを書き込む
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  console.log(`Sheets インポート完了: タブ「${sheetName}」に ${values.length} 行書き込み`);
}

module.exports = { importCsvToSheet };
