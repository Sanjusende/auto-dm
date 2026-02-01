const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Link = require('./models/Link');
const Automation = require('./models/Automation');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Connect to MongoDB (Non-blocking)
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        // Do NOT exit process so the server can still verify webhooks
        console.log('⚠️ Server running in "Offline Mode" (Database not connected). Webhooks will verify but not save data.');
    }
};
connectDB();

// Auth Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/instagram', require('./routes/instagramRoutes'));
app.use('/api/webhooks', require('./routes/webhookRoutes'));

/* -------------------------------------------------------------------------- */
/*                                PUBLIC ROUTES                               */
/* -------------------------------------------------------------------------- */

// Root Route (Health Check & Meta Verification)
app.get('/', (req, res) => {
    res.send('✅ Auto DM Server is Running! Privacy Policy at /privacy-policy');
});

// GET Public Profile by Username
app.get('/api/public/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const links = await Link.find({ userId: user._id }).sort({ createdAt: -1 });
        // Return user info + links
        res.json({
            user: { username: user.username, avatar: user.avatar },
            links
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


/* -------------------------------------------------------------------------- */
/*                               PROTECTED ROUTES                             */
/* -------------------------------------------------------------------------- */

// GET My Links
app.get('/api/links', protect, async (req, res) => {
    try {
        const links = await Link.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(links);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST New Link
app.post('/api/links', protect, async (req, res) => {
    try {
        const { title, url, icon, isLocked } = req.body;
        const newLink = new Link({
            title,
            url,
            icon,
            isLocked,
            userId: req.user.id
        });
        await newLink.save();
        res.status(201).json(newLink);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE Link
app.delete('/api/links/:id', protect, async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);
        if (!link) return res.status(404).json({ message: 'Link not found' });

        // Ensure user owns the link
        if (link.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await link.deleteOne();
        res.json({ message: 'Link deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Link
app.put('/api/links/:id', protect, async (req, res) => {
    try {
        const link = await Link.findById(req.params.id);
        if (!link) return res.status(404).json({ message: 'Link not found' });

        if (link.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedLink = await Link.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedLink);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET My Automations
app.get('/api/automations', protect, async (req, res) => {
    try {
        const automations = await Automation.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(automations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create Automation
app.post('/api/automations', protect, async (req, res) => {
    try {
        const automation = new Automation({
            ...req.body,
            userId: req.user.id
        });
        await automation.save();
        res.status(201).json(automation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Mock Instagram API Routes (Still public/mock for now, or could be protected)
app.get('/api/mock/instagram/profile', (req, res) => {
    res.json({
        username: 'techinformer_',
        fullName: 'Tech Informer',
        followers: 12500,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techinformer'
    });
});

app.get('/api/mock/instagram/reels', (req, res) => {
    res.json([
        { id: 'reel_123', thumbnail: 'https://picsum.photos/id/20/300/500', caption: 'How to learn React in 2024 🚀', plays: 5400 },
        { id: 'reel_124', thumbnail: 'https://picsum.photos/id/36/300/500', caption: 'Top 5 VS Code Extensions 🔥', plays: 12000 },
        { id: 'reel_125', thumbnail: 'https://picsum.photos/id/48/300/500', caption: 'Stop using useEffect like this! 🛑', plays: 8900 },
        { id: 'reel_126', thumbnail: 'https://picsum.photos/id/60/300/500', caption: 'AI Tools for Developers 🤖', plays: 15600 },
    ]);
});

// Privacy Policy for Meta Verification (Needed for Live Mode)
app.get('/privacy-policy', (req, res) => {
    res.send(`
        <html>
            <head><title>Privacy Policy</title></head>
            <body style="font-family: sans-serif; padding: 20px;">
                <h1>Privacy Policy for Auto DM</h1>
                <p>We do not sell your data. We only use your Instagram data to send automated replies as requested.</p>
                <p>Contact: support@example.com</p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
