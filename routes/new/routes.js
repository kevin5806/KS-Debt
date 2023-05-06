// ################ Imports ######################

const express = require('express');
const router = express.Router();

// ################ Routers ######################

router.use('/invite', require('./invite'));

router.use('/data', require('./data'));

// ################ Exports ######################

module.exports = router;