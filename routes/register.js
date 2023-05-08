// ################ Imports ######################

const express = require('express');
const router = express.Router();

const uuid = require('uuid');
const bcrypt = require('bcrypt');

const ejs = require('ejs');

const { User, Invite, Register, EmailVerify } = require('../modules/database/models');
const { EmailTransport } = require('../modules/email/transport');

// ################ Routes ######################

router.get('/', (req, res) => {

    //error = 1 > Input inserito non valido
    //error = 2 > Codice di invito non presente sul database
    //error = 3 > Codice di invito già usato
    //error = 4> User gia in uso
    res.render('register', { error: req.query.error, InviteCode: req.query.InviteCode, publicCode: req.query.publicCode });

})

function CODE6() {

    return Math.floor(100000 + Math.random() * 900000); // Genera un numero casuale compreso tra 100000 e 999999

}

// lo stage precedente inizializza lo stage sucessivo in modo da evitare cambi di dati

router.post('/', async (req, res) => {
    try {

        const inviteCode = req.body.inviteCode;

        // Verifica della validità degli input
        if (!inviteCode || typeof inviteCode !== "string" || !uuid.validate(inviteCode)) return res.redirect('/register?error='); //set errror

        // Verifica che il codice esista e che non sia già stato usato
        const inviteData = await Invite.findOne({ inviteCode });

        // Se il codice di invito non esiste restituisce un errore
        if (!inviteData) return res.redirect('/register?error='); //set errror

        // Se "valid" è falso restituisce un errore
        if (!inviteData.valid) return res.redirect('/register?error='); //set errror

        const publicCode = uuid.v4();
        const privateCode = uuid.v4();

        await new Register({

            stage: 1,
            publicCode, privateCode

        }).save();

        req.session.register = { privateCode }

        // Ritorno al login
        res.redirect(`/register?publicCode=${publicCode}`);

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/email', async (req, res) => {
    try {

        const email = req.body.email;
        const publicCode = req.body.publicCode;

        const privateCode = req.session.register.privateCode;

        // Verifica della validità degli input
        if (!email || typeof email !== "string") return res.redirect(`/register?publicCode=${publicCode}&error=1`); //set errror

        const registerData = await Register.findOne({ privateCode: privateCode, publicCode: publicCode });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=2'); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 1) return res.redirect('/register?error=3'); //set errror

        const IDcode = uuid.v4();
        const code = Math.floor(100000 + Math.random() * 900000);

        await new EmailVerify({

            date: new Date(),
            code, IDcode, email

        }).save();

        registerData.emailVerifyIDcode = IDcode;

        await registerData.save();

        // Send Email
        const url = `${req.protocol}://${req.get('host')}`
        const html = await ejs.renderFile('modules/email/emailVerify.ejs', { url, code });

        // Configura il messaggio di posta elettronica
        const mail = {
            from: 'KSDB <noreply@mooreventi.com>',
            to: email,
            replyTo: 'kevinservdb@gmail.com',
            subject: 'Your Email Verify Code',
            html: html
        }

        // Invia la mail
        await EmailTransport.sendMail(mail);

        

        // Ritorno al login
        res.redirect(`/register?publicCode=${publicCode}`);

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/ex', async (req, res) => {
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