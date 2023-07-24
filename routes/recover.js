// ################ Imports ######################

const express = require('express');
const router = express.Router();

const uuid = require('uuid');
const bcrypt = require('bcrypt');

const ejs = require('ejs');

const { User, Invite, Register, EmailVerify, Recover } = require('../modules/database/models');
const { EmailSender } = require('../modules/email/transport');


// ################ Appunti #####################

// ################ Routes ######################


router.get('/', (req, res) => {

    res.render('recover', { error: req.query.error, stage: req.query.stage, email: req.signedCookies.registerEmail });

})

router.post('/password', (req, res) => {
    try {

        // Verifica della validità degli input
        if (!email || typeof email !== "string") return res.redirect('');/* error here */

        

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=1.5');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})


// ################ Exports ######################

module.exports = router;