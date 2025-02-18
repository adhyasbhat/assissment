const express = require('express');
const routes = require('./src/Routes/routes')
const app = express();
require('dotenv').config();
require('./src/Module/config');
const PORT = process.env.PORT || 3000;
app.use('/api', routes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});