function safeUser(row) {
  const user = { ...row };
  delete user.usdpwd;
  user.is_admin = (row.usdadmin || '').toUpperCase() === 'Y';
  user.is_active = (row.usdactflg || '').toUpperCase() !== 'N';
  return user;
}


module.exports = { safeUser };
