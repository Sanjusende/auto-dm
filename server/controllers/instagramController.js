const axios = require('axios');
const querystring = require('querystring');
const User = require('../models/User');

// Facebook Graph API Base URL
const FB_API_URL = 'https://graph.facebook.com/v19.0';

// 1. Get Auth URL (Facebook Login)
// We use Facebook Login to get permissions for Instagram Graph API
const getAuthUrl = (req, res) => {
    const params = {
        client_id: process.env.INSTAGRAM_CLIENT_ID, // App ID
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        state: 'some_random_state_string',
        // Scopes needed for Instagram DMs and Comments
        scope: 'email,pages_show_list,instagram_basic,instagram_manage_messages,instagram_manage_comments,pages_read_engagement,business_management',
        // scope: 'email,public_profile', // TEST: Minimal scopes to verify App ID works at all
        response_type: 'code', // We want an auth code
        auth_type: 'rerequest', // FORCE Facebook to show the permission screen again
        display: 'popup',
        prompt: 'consent' // CRISP FORCE: Make sure user sees the consent screen
    };
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${querystring.stringify(params)}`;
    res.redirect(authUrl);
};

// 2. Callback & Token Exchange
const authCallback = async (req, res) => {
    console.log('🔗 Callback Received. Params:', req.query); // Debug Log

    const { code, error, error_reason, error_description, error_code } = req.query;

    if (error || error_code) {
        console.error('Facebook Login Error:', error, error_reason, error_description);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        // Check for specific "Invalid Scopes" error (App Type Issue)
        let errorMsg = 'Authentication Failed';
        let technicalDetails = error_description || 'Unknown Error';
        let solution = 'Please try again.';

        if (JSON.stringify(req.query).includes('Invalid Scopes')) {
            errorMsg = 'Meta App Configuration Error';
            technicalDetails = 'Your Meta App is likely set to "Consumer" type, but "Auto DM" requires a "Business" App.';
            solution = 'Go to developers.facebook.com > Your App > Dashboard. Check "App Type". It MUST be "Business". If it is "Consumer", you must create a new Business App.';
        }

        return res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h1 style="color: #ef4444;">${errorMsg}</h1>
                    <p style="color: #64748b;">${technicalDetails}</p>
                    <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                        <strong>Solution:</strong>
                        <p>${solution}</p>
                    </div>
                    <script>
                        // Notify opener but keep window open for user to read
                        window.opener.postMessage({
                            error: '${errorMsg}'
                        }, '${clientUrl}');
                    </script>
                </body>
            </html>
        `);
    }

    if (!code) {
        return res.status(400).json({ message: 'No code provided', query: req.query });
    }

    try {
        // A. Exchange Code for User Access Token
        console.log('🔄 Exchanging code for token...');
        const tokenRes = await axios.get(`${FB_API_URL}/oauth/access_token`, {
            params: {
                client_id: process.env.INSTAGRAM_CLIENT_ID,
                client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
                redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
                code: code
            }
        });
        console.log('✅ Token Exchanged successfully.');

        const { access_token } = tokenRes.data;

        // DEBUG: Check WHO is logging in
        const meRes = await axios.get(`${FB_API_URL}/me`, {
            params: { access_token: access_token }
        });
        console.log(`👤 Logged in as Facebook User: ${meRes.data.name} (ID: ${meRes.data.id})`);

        // DEBUG: Check what permissions were actually granted
        console.log('🔄 Checking granted permissions...');
        const permissionsRes = await axios.get(`${FB_API_URL}/me/permissions`, {
            params: { access_token: access_token }
        });
        console.log('🛡️ Permissions:', JSON.stringify(permissionsRes.data.data, null, 2));


        // B. Get User's Pages to find connected Instagram Business Account
        console.log('🔄 Fetching user pages...');
        const pagesRes = await axios.get(`${FB_API_URL}/me/accounts`, {
            params: {
                access_token: access_token,
                fields: 'id,name,instagram_business_account{id,username,profile_picture_url}'
            }
        });
        console.log(`✅ Pages fetched. Count: ${pagesRes.data.data.length}`);
        console.log('📄 Raw Pages Data:', JSON.stringify(pagesRes.data.data, null, 2));

        // Find the first page that has an Instagram Account connected
        const pageWithIg = pagesRes.data.data.find(page => page.instagram_business_account);
        console.log('🔍 Page with Instagram:', pageWithIg ? 'Found' : 'Not Found');

        if (!pageWithIg) {
            console.warn('⚠️ No Instagram Business Account connection found on any page.');
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

            // Check if pages were found but none had Instagram
            const hasPages = pagesRes.data.data.length > 0;
            const message = hasPages
                ? 'We found Facebook Pages, but none are connected to an Instagram Business Account.'
                : 'No Facebook Pages found. You likely unchecked the page permissions during login.';

            return res.send(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 40px;">
                    <h1 style="color: #ef4444;">Login Failed: No Instagram Found</h1>
                    <p style="color: #475569; font-size: 18px; margin-bottom: 30px;">${message}</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-w: 500px; margin: 0 auto;">
                        <h3 style="margin-top: 0;">How to Fix (100% Works)</h3>
                        <ol style="text-align: left; padding-left: 20px; color: #334155;">
                            <li style="margin-bottom: 10px;">Click the button below to open Facebook Settings.</li>
                            <li style="margin-bottom: 10px;">Find <strong>"Auto DM"</strong> app and click <strong>Remove</strong>.</li>
                            <li style="margin-bottom: 10px;">Come back here and try <strong>Connect</strong> again.</li>
                            <li><strong>IMPORTANT:</strong> When asked, click "Select All" for Pages.</li>
                        </ol>
                        
                        <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" 
                           style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 10px;">
                           Open Facebook Permission Settings
                        </a>
                    </div>

                    <script>
                        window.opener.postMessage({
                            error: '${message}'
                        }, '${clientUrl}');
                        // Do not close immediately so user can click the link
                    </script>
                </body>
            </html>
        `);
        }

        const igAccount = pageWithIg.instagram_business_account;
        const instagramId = igAccount.id;
        const instagramUsername = igAccount.username;
        const instagramProfilePic = igAccount.profile_picture_url;
        console.log(`✅ Ready to login as: ${instagramUsername} (${instagramId})`);

        // Send Script to Popup to communicate with Opener
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.send(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage({
                            token: '${access_token}',
                            username: '${instagramUsername}',
                            instagramId: '${instagramId}'
                        }, '${clientUrl}');
                        window.close();
                    </script>
                    <h1>Login Successful! Closing...</h1>
                </body>
            </html>
        `);

    } catch (err) {
        console.error('Facebook Auth Error:', err.response ? err.response.data : err.message);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.send(`
            <html>
                <body>
                    <script>
                        window.opener.postMessage({
                            error: 'Authentication Invalid'
                        }, '${clientUrl}');
                        window.close();
                    </script>
                    <h1>Login Failed! Closing...</h1>
                </body>
            </html>
        `);
    }
};

// 3. Save Credentials (Same as before)
const saveCredentials = async (req, res) => {
    try {
        const { instagramId, instagramAccessToken, instagramUsername } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.instagramId = instagramId;
        user.instagramAccessToken = instagramAccessToken;
        user.instagramUsername = instagramUsername;
        await user.save();

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Get Media (Reels) using Graph API
const getMedia = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.instagramAccessToken) {
            return res.status(400).json({ message: 'Instagram not connected' });
        }

        // Endpoint for Business Account Media
        const mediaRes = await axios.get(`${FB_API_URL}/${user.instagramId}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
                access_token: user.instagramAccessToken
            }
        });

        const media = mediaRes.data.data.map(item => ({
            id: item.id,
            caption: item.caption || 'No Caption',
            media_type: item.media_type,
            media_url: item.media_url,
            thumbnail: item.thumbnail_url || item.media_url,
            permalink: item.permalink
        }));

        res.json(media);

    } catch (err) {
        console.error('Graph API Error:', err.response ? err.response.data : err.message);
        res.status(500).json({ message: 'Failed to fetch media' });
    }
};

module.exports = {
    getAuthUrl,
    authCallback,
    saveCredentials,
    getMedia
};
