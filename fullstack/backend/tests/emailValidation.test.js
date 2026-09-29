const test = require('node:test');
const assert = require('node:assert/strict');
const { getEmailValidationError } = require('../utils/emailValidation');

test('email validation rejects the common gamil.com typo with a correction', () => {
  assert.equal(
    getEmailValidationError('varsha@gamil.com'),
    'The email domain gamil.com looks incorrect. Did you mean gmail.com?'
  );
});

test('email validation accepts syntactically valid non-typo domains', () => {
  assert.equal(getEmailValidationError('varsha@gmail.com'), '');
  assert.equal(getEmailValidationError('varsha@vastra.example'), '');
});