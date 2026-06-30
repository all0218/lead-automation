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
  // 例）CSVが1つの場合:
  //   const csvPath = '/tmp/leads.csv';
  //   await page.goto(TARGET_URL);
  //   ... ログイン・操作 ...
  //   await page.locator('#download').click();
  //
  // 例）CSVが複数の場合（reportNameで区別）:
  //   const csvPath1 = '/tmp/leads_seminar.csv';
  //   const csvPath2 = '/tmp/leads_inquiry.csv';
  // -------------------------------------------------------

  await browser.close();

  // -------------------------------------------------------
  // CSVが1つの場合
  // const csvPath = '/tmp/leads.csv';
  // const fileId = await uploadCsv(csvPath, DRIVE_URL);
  // await importCsvToSheet(csvPath, LEAD_SHEET_URL, SITE_NAME, LOGIN_ID);
  // await deleteDriveFile(fileId);
  //
  // CSVが複数ある場合（reportNameを第5引数に指定）
  // const fileId1 = await uploadCsv(csvPath1, DRIVE_URL);
  // await importCsvToSheet(csvPath1, LEAD_SHEET_URL, SITE_NAME, LOGIN_ID, 'セミナー参加者');
  // await deleteDriveFile(fileId1);
  //
  // const fileId2 = await uploadCsv(csvPath2, DRIVE_URL);
  // await importCsvToSheet(csvPath2, LEAD_SHEET_URL, SITE_NAME, LOGIN_ID, '問い合わせ');
  // await deleteDriveFile(fileId2);
  // -------------------------------------------------------

  await notifyGas(ROW_INDEX, 'success');
})();
