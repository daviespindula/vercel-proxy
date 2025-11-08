/**
 * Vercel Serverless Function - XGate Proxy
 *
 * Roteia requisições através do Fixie Proxy para usar IPs fixos.
 *
 * Variáveis de ambiente necessárias (configure no Vercel Dashboard):
 * - FIXIE_URL: http://fixie:PASSWORD@criterium.usefixie.com:80
 * - AUTH_SECRET: Token secreto para autenticar requisições do Supabase
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate
    const authSecret = req.headers['x-auth-secret'];
    if (!authSecret || authSecret !== process.env.AUTH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method, url, headers, body } = req.body;

    console.log('Proxying:', method, url);

    // Parse Fixie URL
    const fixieUrl = new URL(process.env.FIXIE_URL);
    const proxyHost = fixieUrl.hostname;
    const proxyPort = parseInt(fixieUrl.port) || 80;
    const proxyAuth = `${fixieUrl.username}:${fixieUrl.password}`;

    // Parse target URL
    const targetUrl = new URL(url);

    // Prepare request options
    const options = {
      host: proxyHost,
      port: proxyPort,
      path: url,
      method: method,
      headers: {
        ...headers,
        'Proxy-Authorization': 'Basic ' + Buffer.from(proxyAuth).toString('base64'),
        'Host': targetUrl.host,
      },
    };

    // Make request through proxy
    const response = await new Promise((resolve, reject) => {
      const client = targetUrl.protocol === 'https:' ? https : http;

      const proxyReq = http.request(options, (proxyRes) => {
        let data = '';

        proxyRes.on('data', (chunk) => {
          data += chunk;
        });

        proxyRes.on('end', () => {
          resolve({
            status: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: data,
          });
        });
      });

      proxyReq.on('error', reject);

      if (body) {
        proxyReq.write(typeof body === 'string' ? body : JSON.stringify(body));
      }

      proxyReq.end();
    });

    // Return response
    res.status(response.status).json(JSON.parse(response.body));

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy failed',
      message: error.message,
    });
  }
};
