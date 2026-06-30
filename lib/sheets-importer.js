const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function createSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

function extractSpreadsheetId(url) {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`スプレッドシートURLからIDを取得できませんでした: ${url}`);
  return match[1];
}

function parseCsv(text) {
  return text.trim().split('\n').map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );
}

// 目次タブがなければ作成し、ヘッダーを書き込む
async function ensureIndexSheet(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const exists = res.data.sheets.some(s => s.properties.title === '目次');
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: '目次', index: 0 } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '目次!A1:D1',
      valueInputOption: 'RAW',
      requestBody: { values: [['No', 'ファイル名', '稼働日時', 'キー（ログインID_ファイル名）']] },
    });
  }
}

// 目次のD列からキーを検索し、一致する行番号（1始まり）を返す。なければnull
async function findRowByKey(sheets, spreadsheetId, key) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: '目次!D:D',
  });
  const rows = res.data.values || [];
  for (let i = 1; i < rows.length; i++) { // 0行目はヘッダーなのでスキップ
    if (rows[i] && rows[i][0] === key) return i + 1; // スプレッドシートの行番号（1始まり）
  }
  return null;
}

// 目次の次のNo番号を取得（ヘッダー除く行数 + 1）
async function getNextNo(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: '目次!A:A',
  });
  const rows = res.data.values || [];
  return rows.length; // ヘッダー込みの行数 = 次のNo番号
}

// Noタブがなければ作成し、シートIDを返す
async function ensureNoSheet(sheets, spreadsheetId, tabName) {
  const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheet = res.data.sheets.find(s => s.properties.title === tabName);
  if (sheet) return sheet.properties.sheetId;

  const addRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  return addRes.data.replies[0].addSheet.properties.sheetId;
}

/**
 * CSVをスプレッドシートに取り込む
 *
 * - 目次タブのD列「ログインID_ファイル名」でキー検索
 * - 初回: 次のNo番号を採番 → Noタブ作成 → 目次に1行追加
 * - 2回目以降: 既存Noタブをクリア → 上書き → 目次のB列・C列を更新
 *
 * @param {string} localCsvPath  - ローカルのCSVファイルパス
 * @param {string} leadSheetUrl  - 書き込み先スプレッドシートURL（入力規則D列）
 * @param {string} loginId       - ログインID（マスタE列）
 */
async function importCsvToSheet(localCsvPath, leadSheetUrl, loginId) {
  const sheets = createSheetsClient();
  const spreadsheetId = extractSpreadsheetId(leadSheetUrl);
  const fileName = path.basename(localCsvPath);
  const key = `${loginId}_${fileName}`;
  const now = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const csvValues = parseCsv(fs.readFileSync(localCsvPath, 'utf-8'));

  await ensureIndexSheet(sheets, spreadsheetId);

  const existingRow = await findRowByKey(sheets, spreadsheetId, key);

  let tabName;
  let sheetId;

  if (existingRow === null) {
    // 初回: 新規採番
    const no = await getNextNo(sheets, spreadsheetId);
    tabName = `No${no}`;
    sheetId = await ensureNoSheet(sheets, spreadsheetId, tabName);

    // 目次に行を追加（A列はHYPERLINK数式）
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '目次!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          `=HYPERLINK("#gid=${sheetId}","${tabName}")`,
          fileName,
          now,
          key,
        ]],
      },
    });
    console.log(`目次に追加: ${tabName} / キー: ${key}`);
  } else {
    // 2回目以降: 既存タブの番号を取得してクリア
    const noRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `目次!A${existingRow}`,
    });
    // A列にはHYPERLINK数式が入っているのでタブ名をD列から再構築
    const noNum = existingRow - 1; // ヘッダー除く連番
    tabName = `No${noNum}`;
    sheetId = await ensureNoSheet(sheets, spreadsheetId, tabName);

    // 既存データをクリア
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: tabName });

    // 目次のB列（ファイル名）・C列（稼働日時）を更新
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `目次!B${existingRow}:C${existingRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[fileName, now]] },
    });
    console.log(`既存タブを上書き: ${tabName} / キー: ${key}`);
  }

  // CSVデータを書き込む
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: csvValues },
  });

  console.log(`Sheets インポート完了: タブ「${tabName}」に ${csvValues.length} 行書き込み`);
}

module.exports = { importCsvToSheet };
