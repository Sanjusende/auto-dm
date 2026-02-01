const mongoose = require('mongoose');
const User = require('./models/User');
const Automation = require('./models/Automation');
const fs = require('fs');
require('dotenv').config();

const fetchDebugData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({ instagramId: { $ne: null } });
        if (!user) {
            fs.writeFileSync('debug_data.json', JSON.stringify({ error: 'NO_USER' }));
            process.exit(0);
        }

        const automation = await Automation.findOne({ userId: user._id });

        const data = {
            instagramId: user.instagramId,
            userId: user._id,
            reelId: automation ? automation.reelId : 'NO_REEL_ID',
            keyword: automation ? automation.triggerKeyword : 'NO_KEYWORD'
        };

        fs.writeFileSync('debug_data.json', JSON.stringify(data, null, 2));

    } catch (err) {
        fs.writeFileSync('debug_data.json', JSON.stringify({ error: err.message }));
    } finally {
        // process.exit(0); // Removing explicit exit might help flush buffers if needed, but here we write to file synchronously so it should be fine.
        setTimeout(() => process.exit(0), 1000);
    }
};

fetchDebugData();
