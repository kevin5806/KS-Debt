// ################ Imports ######################

const express = require('express');
const router = express.Router();

// ################ Routers ######################

router.use('/data', require('./data'));

// ################ Exports ######################

module.exports = router;