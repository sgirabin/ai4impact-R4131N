const bcrypt = require('bcrypt');
const Registration = require('../models/registration');

async function register(req, res) {
  const { name, email, username, password, language, preferences } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const registration = new Registration({
    name,
    email,
    username,
    password: hashedPassword,
    language,
    preferences
  });

  await registration.save();
  res.status(200).send('Registration successful');
}

async function login(req, res) {
  const { username, password } = req.body;
  const user = await Registration.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    res.status(200).send({ success: true, user });
  } else {
    res.status(200).send({ success: false });
  }
}

module.exports = { register, login };
