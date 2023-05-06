// ################ Imports ######################

const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const { User, Data, Invite, LOG } = require('../../database/models');

// ################ Routes ######################

router.post('/', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //verifica del ban
        const userData = await User.findById(sessionUID);

        //se l'utente è bannato viene reindirizzato al logout
        if (userData.ban) return res.redirect('/logout');

        // Estrae i dati dalla richiesta
        const password = req.body.password;

        // Verifica l'input inserito
        if (typeof password !== "string") return res.redirect('/settings?error=3');

        // Controllo password inserita e password del account
        const result = await bcrypt.compare(password, userData.password) //non togliere mai await

        // Se le password non cobaciano restituisce un errore
        if (!result) return res.redirect('/settings?error=3');

        // Elimina i dati dell'account in parallelo
        await Promise.all([
            Data.deleteMany({ userID: sessionUID }),
            LOG.deleteMany({ userID: sessionUID }),
            Invite.deleteMany({ $or: [{ creatorID: sessionUID, valid: true }, { _id: userData.inviteID }] }),
            User.findByIdAndRemove(sessionUID)
        ])

        // Reindirizza al logout
        res.redirect('/logout');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;