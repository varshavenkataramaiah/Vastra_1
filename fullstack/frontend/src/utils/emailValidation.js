const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const COMMON_DOMAIN_TYPOS = {
  'gamil.com': 'gmail.com',
};

const getEmailValidationError = (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return 'Enter a valid email address with an extension.';
  }

  const domain = normalizedEmail.split('@')[1];
  if (COMMON_DOMAIN_TYPOS[domain]) {
    return `The email domain ${domain} looks incorrect. Did you mean ${COMMON_DOMAIN_TYPOS[domain]}?`;
  }

  return '';
};

export default getEmailValidationError;