const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// @route   GET /api/auth/google
// @desc    Get Google OAuth consent URL
// @access  Private
router.get('/', authenticateToken, (req, res) => {
  const oauth2Client = getOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: req.user._id.toString()
  });

  res.json({ success: true, authUrl });
});

// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public (redirect from Google)
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?google_error=missing_params`);
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });

    // Redirect back to app with success indicator
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?google_connected=true`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}?google_error=auth_failed`);
  }
});

// @route   GET /api/auth/google/status
// @desc    Check if user has connected Google
// @access  Private
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+googleTokens');
    const connected = !!(user?.googleTokens?.refresh_token);

    res.json({
      success: true,
      connected,
      hasRefreshToken: !!(user?.googleTokens?.refresh_token)
    });
  } catch (error) {
    console.error('Google status check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/auth/google/disconnect
// @desc    Disconnect Google account
// @access  Private
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { googleTokens: 1 }
    });

    res.json({ success: true, message: 'Google account disconnected' });
  } catch (error) {
    console.error('Google disconnect error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
module.exports.getOAuth2Client = getOAuth2Client;
