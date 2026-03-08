// OAuthコールバック処理
// GET /api/callback?code=xxx → authorization codeをaccess tokenに交換 → フロントエンドにリダイレクト

module.exports = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Authorization code is missing' }));
        return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const frontendUrl = process.env.FRONTEND_URL || 'https://sunny-beijinho-7b8465.netlify.app';
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/callback`;

    try {
        // Authorization code → Access Token に交換
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }).toString(),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: tokenData.error, description: tokenData.error_description }));
            return;
        }

        // アクセストークンをURLフラグメントでフロントエンドに渡す
        // フラグメント(#)はサーバーに送信されないのでセキュリティ面で有利
        const redirectUrl = new URL(frontendUrl);
        redirectUrl.hash = new URLSearchParams({
            access_token: tokenData.access_token,
            token_type: tokenData.token_type || 'Bearer',
            expires_in: String(tokenData.expires_in || 3600),
        }).toString();

        res.writeHead(302, { Location: redirectUrl.toString() });
        res.end();
    } catch (err) {
        console.error('Token exchange error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token exchange failed', message: err.message }));
    }
};
