const mongoose = require('mongoose');

const registerModels = (conn) => {
  // User — supports Google and GitHub OAuth only (no local password auth)
  const UserSchema = new mongoose.Schema(
    {
      firstName: { type: String, required: true },
      lastName: { type: String, default: '' },
      email: { type: String, required: true, unique: true },
      googleId: { type: String, sparse: true },
      githubId: { type: String, sparse: true },
    },
    { timestamps: true }
  );

  // Project (folder)
  const ProjectSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
  );

  // File (note / canvas)
  const FileSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
      content: { type: String, default: '' },
    },
    { timestamps: true }
  );

  return {
    User: conn.model('User', UserSchema),
    Project: conn.model('Project', ProjectSchema),
    File: conn.model('File', FileSchema),
  };
};

module.exports = registerModels;
