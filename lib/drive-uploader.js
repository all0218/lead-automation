const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function createDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

// DriveフォルダURLからフォルダIDを抽出
function extractFolderId(folderUrl) {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`DriveフォルダURLからIDを取得できませんでした: ${folderUrl}`);
  return match[1];
}

// CSVファイルをDriveフォルダにアップロードしてfileIdを返す
async function uploadCsv(localFilePath, driveFolderUrl) {
  const drive = createDriveClient();
  const folderId = extractFolderId(driveFolderUrl);
  const fileName = path.basename(localFilePath);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'text/csv',
      body: fs.createReadStream(localFilePath),
    },
    fields: 'id, name',
  });

  console.log(`Drive アップロード完了: ${res.data.name} (${res.data.id})`);
  return res.data.id;
}

// DriveのファイルをIDで削除
async function deleteDriveFile(fileId) {
  const drive = createDriveClient();
  await drive.files.delete({ fileId });
  console.log(`Drive ファイル削除完了: ${fileId}`);
}

module.exports = { uploadCsv, deleteDriveFile };
