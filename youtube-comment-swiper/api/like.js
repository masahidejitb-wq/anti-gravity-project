// YouTube動画いいねAPIエンドポイント
// POST /api/like { videoId, accessToken }

const ALLOWED_ORIGINS = [
    'https://sunny-beijinho-7b8465.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
];

function setCorsHeaders(req, res) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async (req, res) => {
    setCorsHeaders(req, res);

    // CORS プリフライトリクエスト対応
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    try {
        // リクエストボディの読み取り
        const body = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => { data += chunk; });
            req.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(new Error('Invalid JSON')); }
            });
            req.on('error', reject);
        });

        const { videoId, accessToken } = body;

        if (!videoId || !accessToken) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing required fields: videoId, accessToken' }));
            return;
        }

        // YouTube Data API でいいね（高評価）を送信
        const ytResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos/rate?id=${videoId}&rating=like`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!ytResponse.ok) {
            // videos.rate APIはエラーの場合ボディを返すことがある
            const errText = await ytResponse.text();
            res.writeHead(ytResponse.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'YouTube API error',
                status: ytResponse.status,
                details: errText,
            }));
            return;
        }

        // 成功時は 204 No Content が返るのが仕様
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'Video liked successfully',
        }));
    } catch (err) {
        console.error('Like request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
    }
};
