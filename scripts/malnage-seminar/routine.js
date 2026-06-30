// まるなげセミナー 自動化スクリプト
// Chromeレコーディング（Playwright形式）をここに貼り付ける

const { chromium } = require('playwright');
const { uploadCsv, deleteDriveFile } = require('../../lib/drive-uploader');
const { importCsvToSheet } = require('../../lib/sheets-importer');
const { notifyGas } = require('../../lib/gas-callback');

const SITE_NAME      = process.env.SITE_NAME;
const TARGET_URL     = process.env.TARGET_URL;
const LOGIN_ID       = process.env.LOGIN_ID;
const PASSWORD       = process.env.PASSWORD;
const DRIVE_URL      = process.env.DRIVE_FOLDER_URL;
const LEAD_SHEET_URL = process.env.LEAD_SHEET_URL;
const ROW_INDEX      = Number(process.env.ROW_INDEX);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // -------------------------------------------------------
  // TODO: ここにChromeレコーディング（Playwright形式）を貼り付ける
  //
  // 複数CSVをダウンロードする場合はそれぞれ以下のブロックを繰り返す
  // -------------------------------------------------------

  await browser.close();

  // -------------------------------------------------------
  // CSVごとに以下を繰り返す（ファイル名が目次のキーになる）
  //
  // const csvPath = '/tmp/1.csv';
  // const fileId = await uploadCsv(csvPath, DRIVE_URL);
  // await importCsvToSheet(csvPath, LEAD_SHEET_URL, LOGIN_ID);
  // await deleteDriveFile(fileId);
  // -------------------------------------------------------

  await notifyGas(ROW_INDEX, 'success');
})();
