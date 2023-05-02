const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const { User, Data, Invite, LOG } = require('../database/models');

//ottimizzata
router.get('/', (req, res) => {

    //error = 1 > input inserito non valido
    //error = 2 > password/utente errati
    //error = 3 > user bannato
    //error = 4 > errore in caso si provi ad accedere ad una pagina senza essere loggati (login first)
    res.render('login', { error: req.query.error });

})


//ottimizzata
router.post('/', async (req, res) => {
    try {

        // Estrae i dati dalla richiesta
        const user = req.body.user;
        const password = req.body.password;

        // Verifica degli input inseriti
        if (

            !user || !password
            || typeof user !== "string"
            || typeof password !== "string"

        ) return res.redirect('/login?error=1');

        // Cerca l'user sul databse
        const userData = await User.findOne({ user: user });

        // Se il nome utente inserito non esiste restituisce un errore
        if (!userData) return res.redirect('/login?error=2');

        // Controllo password inserita e password del account
        const result = await bcrypt.compare(password, userData.password); //non togliere mai await

        // Se le password non cobaciano restituisce un errore
        if (!result) return res.redirect('/login?error=2');

        // Se l'utente è bannato restituisce un errore
        if (userData.ban) return res.redirect('/login?error=3');

        // Creazione della sessione con i relativi dati
        req.session.auth = true;
        req.session.userID = userData._id;

        // Salvataggio dei LOG riguardo il login
        await new LOG({
            userID: userData._id,
            client: req.headers['user-agent'],
            date: new Date(),
            ip: req.headers['x-client-ip']
        }).save();

        // Reinderizzamento all Dashboard
        res.redirect('/dashboard');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

module.exports = router;