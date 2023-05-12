// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, LOG } = require('../../modules/database/models');

// ################ Routes ######################

router.get('/', async (req, res) => {

    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        //eliminazione log
        await LOG.deleteMany({ userID: sessionUID });

        res.redirect('/settings');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }

})

// ################ Exports ######################

module.exports = router;