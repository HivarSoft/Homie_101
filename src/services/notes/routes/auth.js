const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const FRONTEND_URL = process.env.NOTES_FRONTEND_URL || 'http://localhost:5173';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '48h' });

// Shared OAuth success handler — redirects to frontend with token as query param
const oauthSuccess = (req, res) => {
  const token = signToken(req.user._id);
  res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
};

const oauthFailure = (req, res) => {
  res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
};

module.exports = () => {
  const router = express.Router();

  // ── Google OAuth ─────────────────────────────────────────────────────────

  // GET /api/notes/auth/google
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  // GET /api/notes/auth/google/callback
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login?error=google_failed`, session: false }),
    oauthSuccess
  );

  // ── GitHub OAuth ─────────────────────────────────────────────────────────

  // GET /api/notes/auth/github
  router.get('/github', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.status(503).json({ message: 'GitHub sign-in is not configured on this server.' });
    }
    passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
  });

  // GET /api/notes/auth/github/callback
  router.get('/github/callback', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_not_configured`);
    }
    passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=github_failed`, session: false })(req, res, next);
  }, oauthSuccess);

  return router;
};
