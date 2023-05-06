// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, Data, LOG } = require('../database/models');

// ################ Routes ######################

router.get('/', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        // Lettura dati dal database
        const data = await Data.find({ userID: sessionUID }).exec();

        // RENDERIZZAZIONE CON DATI
        //error = 1 > campi di input vuoti
        //error = 2 > input inserito nel edit non valido
        //error = 3 > input inserito nel delete account sbagliato
        //error = 4 > input Invite by email non valido

        //satus = 1 > invio email invito riuscito

        res.render('dashboard', {
            data: data,
            InviteCode: req.query.InviteCode,
            url: `${req.protocol}://${req.get('host')}`,
            error: req.query.error,
            errorID: req.query.id,
            status: req.query.status
        })

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;