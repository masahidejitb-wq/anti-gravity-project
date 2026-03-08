// Google OAuth 認証エンドポイント
// GET /api/auth → Google OAuth認証画面にリダイレクト

module.exports = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/callback`;
  const scope = 'https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/youtube';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  res.writeHead(302, { Location: authUrl.toString() });
  res.end();
};
