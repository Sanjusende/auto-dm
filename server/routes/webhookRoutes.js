const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhookEvents } = require('../controllers/webhookController');

// GET request for Verification Challenge
router.get('/instagram', verifyWebhook);

// POST request for Event Notifications
// POST request for Event Notifications
router.post('/instagram', handleWebhookEvents);

// TEST ROUTE: Simulate Webhook internally (Bypasses Ngrok/Facebook)
const User = require('../models/User');
const Automation = require('../models/Automation');
router.get('/test-simulation', async (req, res) => {
    try {
        // 1. Fetch real data from DB
        const user = await User.findOne({ instagramId: { $ne: null } });
        if (!user) return res.send('❌ No User with Instagram ID found in DB.');

        const automation = await Automation.findOne({ userId: user._id });
        if (!automation) return res.send('❌ No Automation found for this user.');

        console.log('🔄 STARTING INTERNAL SIMULATION...');

        // 2. Mock Request Body
        const mockBody = {
            object: "instagram",
            entry: [{
                id: user.instagramId,
                changes: [{
                    field: "comments",
                    value: {
                        id: "test_comment_123",
                        text: automation.triggerKeyword, // Use the real keyword
                        media: { id: automation.reelId }, // Use the real Reel ID
                        from: { id: "999999999", username: "test_user_internal" }
                    }
                }]
            }]
        };

        // 3. Mock Response Object
        const mockRes = {
            status: (code) => ({ send: (msg) => console.log(`[Sim Response] ${code}: ${msg}`) }),
            sendStatus: (code) => console.log(`[Sim Response] Status: ${code}`)
        };

        // 4. Call Authenticated Handler
        await handleWebhookEvents({ body: mockBody }, mockRes);

        res.send(`
            <h1>Simulation Triggered! 🚀</h1>
            <p>Check your <b>Terminal</b> now.</p>
            <p>If logic is correct, you should see: <b>"DM Sent Successfully!"</b></p>
            <hr>
            <p><b>Data Used:</b></p>
            <pre>User: ${user.username} (${user.instagramId})</pre>
            <pre>Reel: ${automation.reelId}</pre>
            <pre>Keyword: ${automation.triggerKeyword}</pre>
        `);

    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

module.exports = router;
