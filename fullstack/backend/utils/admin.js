// DEMO: Read approved administrator IDs from the environment
const isAdminUserId = (userId) => {
  const adminUserIds = String(process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((adminUserId) => adminUserId.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(userId) && adminUserIds.includes(String(userId).toLowerCase());
};

module.exports = { isAdminUserId };
