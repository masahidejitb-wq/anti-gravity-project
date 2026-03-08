// YouTubeコメント返信投稿エンドポイント
// POST /api/comment { parentId, replyText, accessToken }

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

        const { parentId, replyText, accessToken } = body;

        if (!parentId || !replyText || !accessToken) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing required fields: parentId, replyText, accessToken' }));
            return;
        }

        // YouTube Data API で返信を投稿
        const ytResponse = await fetch(
            'https://www.googleapis.com/youtube/v3/comments?part=snippet',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    snippet: {
                        parentId: parentId,
                        textOriginal: replyText,
                    },
                }),
            }
        );

        const ytData = await ytResponse.json();

        if (!ytResponse.ok) {
            res.writeHead(ytResponse.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'YouTube API error',
                status: ytResponse.status,
                details: ytData.error || ytData,
            }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            commentId: ytData.id,
            snippet: ytData.snippet,
        }));
    } catch (err) {
        console.error('Comment post error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
    }
};
