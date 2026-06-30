const https = require('https');
const http = require('http');
const { URL } = require('url');

// GASウェブアプリへ完了通知を送信（B列書き込みのトリガー）
async function notifyGas(rowIndex, status) {
  const callbackUrl = process.env.GAS_CALLBACK_URL;
  if (!callbackUrl) {
    console.warn('GAS_CALLBACK_URL が未設定のため、コールバックをスキップします');
    return;
  }

  const payload = JSON.stringify({ row_index: rowIndex, status });
  const url = new URL(callbackUrl);
  const isHttps = url.protocol === 'https:';
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = (isHttps ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        console.log(`GASコールバック完了: row=${rowIndex} status=${status} response=${body}`);
        resolve(body);
      });
    });
    req.on('error', (err) => {
      console.error(`GASコールバック失敗: ${err.message}`);
      reject(err);
    });
    req.write(payload);
    req.end();
  });
}

module.exports = { notifyGas };
