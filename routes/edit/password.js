// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, Data, DataHistory } = require('../../modules/database/models');

// ################ Routes ######################

router.get('/', (req, res) => {
    try {

        if (req.session.auth) {

            res.render('register', { error: req.query.error, stage: 2, email: req.signedCookies.registerEmail });

        } else {

            res.render('register', { error: req.query.error, stage: req.query.stage, email: req.signedCookies.registerEmail });

        }

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/', (req, res) => {
    try {

        // Verifica della validità degli input
        if (!inviteCode || typeof inviteCode !== "string" || !uuid.validate(inviteCode)) return res.redirect(`/register?error=1&InviteCode=${inviteCode}`);


    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})



// ################ Exports ######################

module.exports = router;