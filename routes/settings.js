// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, Invite, LOG } = require('../modules/database/models');

// ################ Routes ######################

router.get('/', async (req, res) => {
    try {
        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //verifica del ban e salvataggio dati utente
        const userData = await User.findById(sessionUID);

        //se l'utente è bannato viene reindirizzato al logout
        if (userData.ban) return res.redirect('/logout');

        // Download dati dal database

        //log di accesso del utente
        const logData = await LOG.find({ userID: sessionUID }).exec();
        //inviti creati dal utente
        const inviteData = await Invite.find({ creatorID: sessionUID }).exec();

        // error 1 > 
        res.render('settings', { error: req.query.error, logData, inviteData });

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;