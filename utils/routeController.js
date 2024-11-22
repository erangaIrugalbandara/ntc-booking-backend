const { readFromFile, writeToFile } = require('./fileHelper');

const createRoute = (req, res) => {
  let body = '';
  req.on('data', chunk => (body += chunk.toString()));
  req.on('end', () => {
    const { from, to, tripSchedule, busId } = JSON.parse(body);

    const routes = readFromFile('routes.json');
    const newRoute = { id: Date.now(), from, to, tripSchedule, busId };

    routes.push(newRoute);
    writeToFile('routes.json', routes);

    res.statusCode = 201;
    res.end(JSON.stringify({ message: 'Route created successfully!', route: newRoute }));
  });
};

const getRoutes = (req, res) => {
  const routes = readFromFile('routes.json');
  res.statusCode = 200;
  res.end(JSON.stringify(routes));
};

module.exports = { createRoute, getRoutes };
