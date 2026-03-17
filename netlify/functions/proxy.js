const https = require('https');
exports.handler = async function(event) {
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycby4RL9chOq2Gyrn2_a3Zq0axdrjj6rmVn6UAyOpkv9sSJ0vvKX8fkxlNVXXRufPGYPXvw/exec';

  const body = event.body;

  return new Promise((resolve) => {
    const url = new URL(SHEETS_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
          },
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: false, error: e.message })
      });
    });

    req.write(body);
    req.end();
  });
};
