const axios = require('axios');

// CONFIGURATION
const SERVER_URL = 'http://localhost:5000/api/webhooks/instagram';

// ⚠️ TODO: Replace these with your ACTUAL values from your Database/Instagram
// 1. Get your Instagram Business Account ID (it's in your database under users -> instagramId)
// 2. Get the Media ID of the Reel you want to test (or use a placeholder if you just want to test the loop)
const INSTAGRAM_BUSINESS_ID = 'REPLACE_WITH_YOUR_IG_BUSINESS_ID';
const REEL_ID = 'REPLACE_WITH_REEL_ID'; // e.g. '17990...'

const COMMENT_TEXT = 'AI'; // The keyword you set in Automation
const COMMENTER_ID = '987654321'; // A fake user ID representing the commenter

const payload = {
    "object": "instagram",
    "entry": [
        {
            "id": INSTAGRAM_BUSINESS_ID,
            "time": Math.floor(Date.now() / 1000),
            "changes": [
                {
                    "field": "comments",
                    "value": {
                        "id": "comment_12345",
                        "text": COMMENT_TEXT,
                        "media": {
                            "id": REEL_ID
                        },
                        "from": {
                            "id": COMMENTER_ID,
                            "username": "test_commenter"
                        }
                    }
                }
            ]
        }
    ]
};

const runSimulation = async () => {
    console.log(`🚀 Simulating Webhook Event to ${SERVER_URL}...`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

    try {
        const res = await axios.post(SERVER_URL, payload);
        console.log(`\n✅ Server Response: ${res.status} ${res.data}`);
        console.log('👉 Now check your SERVER TERMINAL. You should see "User NOT FOUND" if the ID is wrong, or "Automation Match" if correct.');
    } catch (err) {
        console.error(`\n❌ Request Failed:`, err.message);
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', err.response.data);
        }
    }
};

runSimulation();
