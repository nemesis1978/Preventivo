// frontend/__mocks__/bcryptjs.js
const bcrypt = jest.requireActual('bcryptjs');

module.exports = {
  ...bcrypt,
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
  // Aggiungi qui altri metodi di bcryptjs che potresti usare e voler mockare
};