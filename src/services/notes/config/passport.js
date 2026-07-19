const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

module.exports = (passport, UserModel) => {
  // ── Google OAuth (only if credentials are configured) ────────────────────
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
    console.warn('[Passport] Google OAuth not configured — skipping Google strategy');
  } else passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.NOTES_GOOGLE_CALLBACK_URL ||
          '/api/notes/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await UserModel.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // Check if an account already exists with the same email (edge case)
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existing = await UserModel.findOne({ email });
            if (existing) {
              existing.googleId = profile.id;
              await existing.save();
              return done(null, existing);
            }
          }

          user = await UserModel.create({
            googleId: profile.id,
            firstName: profile.name.givenName || profile.displayName,
            lastName: profile.name.familyName || '',
            email,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  // ── GitHub OAuth (only if credentials are configured) ────────────────────
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    console.warn('[Passport] GitHub OAuth not configured — skipping GitHub strategy');
  } else passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          process.env.NOTES_GITHUB_CALLBACK_URL ||
          '/api/notes/auth/github/callback',
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await UserModel.findOne({ githubId: profile.id });
          if (user) return done(null, user);

          // GitHub may return email as null if user has private email setting
          const email =
            profile.emails?.[0]?.value ||
            `github_${profile.id}@noreply.github.com`;

          const existing = await UserModel.findOne({ email });
          if (existing) {
            existing.githubId = profile.id;
            await existing.save();
            return done(null, existing);
          }

          const displayName = profile.displayName || profile.username || '';
          const parts = displayName.split(' ');

          user = await UserModel.create({
            githubId: profile.id,
            firstName: parts[0] || profile.username,
            lastName: parts.slice(1).join(' ') || '',
            email,
          });
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
