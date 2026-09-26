const Contribution = require('../models/Contribution');

async function recordContribution(project, user, type, meta = {}) {
  if (!project || !user) return;
  await Contribution.create({ project, user, type, meta });
}

module.exports = { recordContribution };
