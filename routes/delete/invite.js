// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, Invite } = require('../../database/models');

// ################ Routes ######################

router.post('/', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;
        const id = req.body.id;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        //eliminazione log
        await Invite.findOneAndRemove({ _id: { $eq: id }, creatorID: sessionUID, valid: true });

        res.redirect('/settings');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }

})

// ################ Exports ######################

module.exports = router;