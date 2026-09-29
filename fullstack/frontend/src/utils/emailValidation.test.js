import getEmailValidationError from './emailValidation';

test('email validation suggests the correction for gamil.com', () => {
  expect(getEmailValidationError('varsha@gamil.com')).toBe(
    'The email domain gamil.com looks incorrect. Did you mean gmail.com?'
  );
});

test('email validation accepts the corrected Gmail address', () => {
  expect(getEmailValidationError('varsha@gmail.com')).toBe('');
});