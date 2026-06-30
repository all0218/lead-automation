// まるなげセミナー 自動化スクリプト
// Chromeレコーディング（Playwright形式）をここに貼り付ける

const { chromium } = require('playwright');
const { uploadCsv, deleteDriveFile } = require('../../lib/drive-uploader');
const { importCsvToSheet } = require('../../lib/sheets-importer');

const TARGET_URL     = process.env.TARGET_URL;
const LOGIN_ID       = process.env.LOGIN_ID;
const PASSWORD       = process.env.PASSWORD;
const DRIVE_URL      = process.env.DRIVE_FOLDER_URL;
const LEAD_SHEET_URL = process.env.LEAD_SHEET_URL;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // -------------------------------------------------------
  // TODO: ここにChromeレコーディング（Playwright形式）を貼り付ける
  //
  // 複数CSVをダウンロードする場合は、以下のブロックをCSVの数だけ繰り返す
  // -------------------------------------------------------

  await browser.close();

  // -------------------------------------------------------
  // CSVごとに以下3行を繰り返す（ファイル名がそのまま目次のキーになる）
  //
  // const csvPath = '/tmp/1.csv';
  // const fileId = await uploadCsv(csvPath, DRIVE_URL);
  // await importCsvToSheet(csvPath, LEAD_SHEET_URL, LOGIN_ID);
  // await deleteDriveFile(fileId);
  // -------------------------------------------------------
})();
