const express = require('express');
const router = express.Router();

const uuid = require('uuid');

const { User, Data, Invitecode, LOG } = require('../database/models');

router.get('/invite', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({_id: sessionUID, ban: true}) ) return res.redirect('/logout');

        const code = uuid.v4();

        // Salva sul database il nuovo invito
        await new Invitecode ({

            code: code,
            creatorID: sessionUID,
            valid: true,
            creationDate: new Date()

        }).save();

        // Reindirizza passando il nuovo codice
        res.redirect(`/dashboard?InviteCode=${code}`);

    } catch (err) {

        res.status(500).send({err});

    }
})

module.exports = router;