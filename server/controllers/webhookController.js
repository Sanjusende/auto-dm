const crypto = require('crypto');
const Automation = require('../models/Automation');
const User = require('../models/User');
const axios = require('axios');

// Verify Webhook (GET Request from Meta)
// Verify Webhook (GET Request from Meta)
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Use Verify Token from Env or default
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'superprofile_verify_token';

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.type('text/plain').send(challenge);
        } else {
            console.error('❌ Webhook Verification Failed: Token Mismatch', { expected: verifyToken, received: token });
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

// Handle Incoming Events (POST Request)
const handleWebhookEvents = async (req, res) => {
    try {
        console.log('📨 Webhook Event Received:', JSON.stringify(req.body, null, 2));

        const body = req.body;

        if (body.object === 'instagram') {
            for (const entry of body.entry) {
                // Determine which user this entry belongs to (via Instagram ID)
                const instagramId = entry.id;
                console.log(`🔍 Processing Webhook for IG Business Account ID: ${instagramId}`);

                // Find user in our DB connected to this Instagram Account
                const user = await User.findOne({ instagramId });
                if (!user) {
                    console.log(`⚠️ User NOT FOUND in DB with instagramId: ${instagramId}`);
                    // List all users to see if there's a mismatch
                    const allUsers = await User.find({}, 'username instagramId');
                    console.log('📋 Available Users in DB:', allUsers.map(u => ({ username: u.username, instagramId: u.instagramId })));
                    continue;
                }
                console.log(`✅ Found User: ${user.username} (DB_ID: ${user._id})`);

                if (!entry.changes) {
                    console.log('⚠️ No changes array in entry');
                    continue;
                }

                for (const change of entry.changes) {
                    console.log(`📝 Field Changed: ${change.field}`);

                    // Check for Comments
                    if (change.field === 'comments') {
                        const value = change.value;
                        const commentText = value.text || '';
                        const mediaId = value.media ? value.media.id : 'UNKNOWN_MEDIA';
                        const commenterId = value.from ? value.from.id : 'UNKNOWN_USER';
                        const commentId = value.id;

                        console.log(`💬 Comment Details:`);
                        console.log(`   - Text: "${commentText}"`);
                        console.log(`   - Media ID: ${mediaId}`);
                        console.log(`   - Commenter ID: ${commenterId}`);

                        // Prevent replying to self (TEMPORARILY DISABLED FOR TESTING)
                        /*
                        if (commenterId === instagramId) {
                            console.log('⚠️ Comment is from the business account itself. Ignoring.');
                            continue;
                        }
                        */

                        // Use case-insensitive keyword matching, AND Filter by Reel ID
                        // We strictly want to reply only if the comment is on the SPECIFIC Reel we set up automation for.
                        const automations = await Automation.find({
                            userId: user._id,
                            reelId: mediaId, // STRICT MATCH: Only trigger if comment is on THIS reel
                            isActive: true
                        });

                        console.log(`🤖 Found ${automations.length} active automations for Reel ID ${mediaId}.`);

                        if (automations.length === 0) {
                            console.log(`ℹ️ No automations set up for this specific Reel (${mediaId}).`);
                            // Optional: Check if there are GLOBAL automations (if you implement that later)
                        }

                        // Among the automations for this reel, find one that matches the keyword
                        const matchedAuto = automations.find(a =>
                            commentText.toUpperCase().includes(a.triggerKeyword.toUpperCase())
                        );

                        if (matchedAuto) {
                            console.log(`🎯 Automation Match! Keyword: "${matchedAuto.triggerKeyword}"`);
                            console.log(`🚀 Attempting to Send DM: "${matchedAuto.dmMessage}" to ${commenterId}`);

                            // UPDATED: Pass instagramId as senderId
                            await sendDM(user.instagramAccessToken, user.instagramId, commenterId, matchedAuto.dmMessage);

                            // Optional: Reply to comment
                            // await replyToComment(user.instagramAccessToken, commentId, "Check your DMs! 🔥");
                        } else {
                            console.log('🚫 No matching keyword found in comment text for this Reel.');
                        }
                    } else {
                        console.log(`ℹ️ Ignoring change field: ${change.field} (We only handle 'comments')`);
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {
            console.log(`⚠️ Unknown Webhook Object: ${body.object}`);
            res.sendStatus(404);
        }
    } catch (err) {
        console.error('❌ Webhook Processing Error:', err);
        res.sendStatus(500);
    }
};

// Helper: Send Private Message
const sendDM = async (accessToken, senderId, recipientId, messageText) => {
    try {
        console.log(`📤 sending DM to ${recipientId} from ${senderId}...`);

        // Use /{ig-user-id}/messages instead of /me/messages
        await axios.post(`https://graph.facebook.com/v19.0/${senderId}/messages`, {
            recipient: { id: recipientId },
            message: { text: messageText }
        }, {
            params: { access_token: accessToken }
        });
        console.log('✅ DM Sent Successfully!');
    } catch (err) {
        console.error('❌ Failed to Send DM.');
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', JSON.stringify(err.response.data, null, 2));

            // Common Error Explanations
            const errorCode = err.response.data.error?.code;
            if (errorCode === 100) console.error('   👉 Issue: Invalid Parameter (Review recipient ID validity)');
            if (errorCode === 10) console.error('   👉 Issue: Permission Denied (Check instagram_manage_messages)');
            if (errorCode === 2022) console.error('   👉 Issue: User is not following you or has filtered DMs? (Limits apply)');
        } else {
            console.error('   Error:', err.message);
        }
    }
};

// Helper: Reply to Comment
const replyToComment = async (accessToken, commentId, text) => {
    try {
        await axios.post(`https://graph.facebook.com/v19.0/${commentId}/replies`, {
            message: text
        }, {
            params: { access_token: accessToken }
        });
        console.log('↩️ Replied to comment');
    } catch (err) {
        console.error('⚠️ Failed to reply to comment:', err.message);
    }
};

module.exports = {
    verifyWebhook,
    handleWebhookEvents
};
