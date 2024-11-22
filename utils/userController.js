const bcrypt = require('bcrypt');
const { readFromFile, writeToFile } = require('./fileHelper');

const registerUser = (req, res) => {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    const { name, email, password, role } = JSON.parse(body);

    const users = readFromFile('users.json');

    // Check if the user already exists
    if (users.some(user => user.email === email)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: 'User already exists!' }));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword, role };

    users.push(newUser);
    writeToFile('users.json', users);

    res.statusCode = 201;
    res.end(JSON.stringify({ message: 'User registered successfully!' }));
  });
};

const loginUser = (req, res) => {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', async () => {
    const { email, password } = JSON.parse(body);

    const users = readFromFile('users.json');
    const user = users.find(user => user.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: 'Invalid email or password!' }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ message: 'Login successful!', user: { id: user.id, name: user.name, role: user.role } }));
  });
};

module.exports = { registerUser, loginUser };
