// ################ Imports ######################

const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');

const { User, Invite } = require('../database/models');

// ################ Routes ######################

router.get('/', (req, res) => {

    //error = 1 > Input inserito non valido
    //error = 2 > Codice di invito non presente sul database
    //error = 3 > Codice di invito già usato
    //error = 4> User gia in uso
    res.render('register', { error: req.query.error, InviteCode: req.query.InviteCode });

})


router.post('/', async (req, res) => {
    try {

        // Estrae i dati dalla richiesta
        const user = req.body.user;
        const password = req.body.password;
        const name = req.body.name;
        const surname = req.body.surname;
        const code = req.body.code;

        // Verifica della validità degli input
        if (!code || !user || !password || !name || !surname

            || typeof code !== "string"
            || typeof user !== "string"
            || typeof password !== "string"
            || typeof name !== "string"
            || typeof surname !== "string"

        ) return res.redirect('/register?error=1');

        // Verifica che il codice esista e che non sia già stato usato
        const codeData = await Invite.findOne({ code });

        // Se il codice di invito non esiste restituisce un errore
        if (!codeData) return res.redirect('/register?error=2');

        // Se "valid" è falso restituisce un errore
        if (!codeData.valid) return res.redirect('/register?error=3');

        // Verifica della presenza del user sul database
        const userData = await User.findOne({ user });

        // Se l'user esiste già restituisce un errore
        if (userData) return res.redirect('/register?error=4');

        // Hashing della password
        const hashPw = await bcrypt.hash(password, 5);

        // Savataggio del user sul database
        await new User({
            inviteID: codeData._id,
            name: name,
            surname: surname,
            user: user,
            password: hashPw,
            ban: false
        }).save();

        // Se la registrazione è stata salvata correttamente, salva l'invito come usato
        codeData.valid = false;
        await codeData.save();

        // Ritorno al login
        res.redirect('/login');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;