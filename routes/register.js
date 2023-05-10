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
    res.render('register', { error: req.query.error, InviteCode: req.query.InviteCode, stage: req.query.stage });

})

// lo stage precedente inizializza lo stage sucessivo in modo da evitare cambi di dati

router.post('/', async (req, res) => {
    try {

        const inviteCode = req.body.inviteCode;

        // Verifica della validità degli input
        if (!inviteCode || typeof inviteCode !== "string" || !uuid.validate(inviteCode)) return res.redirect('/register?error=1'); //set errror

        // Verifica che il codice esista e che non sia già stato usato
        const inviteData = await Invite.findOne({ inviteCode });

        // Se il codice di invito non esiste restituisce un errore
        if (!inviteData) return res.redirect('/register?error='); //set errror

        // Se "valid" è falso restituisce un errore
        if (!inviteData.valid) return res.redirect('/register?error='); //set errror

        const key = uuid.v4();

        res.cookie('registerKey', key, {
            maxAge: 1000 * 3600, // 1 ora
            httpOnly: true
        })

        await new Register({

            inviteID: inviteData._id,
            stage: 1,
            key

        }).save();

         // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=1');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/email', async (req, res) => {
    try {

        const email = req.body.email;

        // Verifica della validità degli input
        if (!email || typeof email !== "string") return res.redirect('/register?error=1'); //set errror

        // Verifica della presenza del user sul database
        const userData = await User.findOne({ email });

        // Se l'user esiste già restituisce un errore
        if (userData) return res.redirect('/register?error=');

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=2'); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 1) return res.redirect('/register?error=3'); //set errror

        // Genera codice a 6 cifre
        const code = Math.floor(100000 + Math.random() * 900000);

        // Crea un nuovo documento
        const emailVerify = new EmailVerify({
            date: new Date(),
            code,
            email
        })
        
        // Salvo il documento di verifica email
        await emailVerify.save();

        // Dopo il salvataggio l'ID è accessibile
        registerData.emailVerifyID = emailVerify._id;

        // Render del Email
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

        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=1.5');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/email/verify', async (req, res) => {
    try {

        const code = req.body.code;

        // Verifica della validità degli input
        if (!code || typeof code !== "string") return res.redirect('/register?error='); //set errror

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error='); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 1) return res.redirect('/register?error='); //set errror

        // Ricerca del documento di verifica per id
        const verifyData = await EmailVerify.findById(registerData.emailVerifyID);

        // Verifica della validità del codice inserito
        if (verifyData.code !== code) return res.redirect('/register?error='); //set errror

        // Aggiunta/aggiornamento dei dati
        registerData.email = verifyData.email;
        registerData.stage = 2;

        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // Elimina il codice di verifica
        verifyData.deleteOne();

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=2');

    } catch (err) {

        res.status(500).render('error', {error: err, status: 500, message: 'Server Error'});

    }
})

router.post('/account', async (req, res) => {
    try {

        // Estrae i dati dalla richiesta
        const user = req.body.user;
        const password = req.body.password;

        // Verifica della validità degli input
        if (!user || !password

            || typeof user !== "string"
            || typeof password !== "string"

        ) return res.redirect('/register?error=');

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error='); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 2) return res.redirect('/register?error='); //set errror

        // Verifica della presenza del user sul database
        const userData = await User.findOne({ user });

        // Se l'user esiste già restituisce un errore
        if (userData) return res.redirect('/register?error=');

        // Hashing della password
        const hashPw = await bcrypt.hash(password, 10);
        
        // Aggiunta nuovi dati alla registrazione
        registerData.user = user;
        registerData.password = hashPw;
        registerData.stage = 3;
        
        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=3');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/person', async (req, res) => {
    try {

        // Estrae i dati dalla richiesta
        const name = req.body.name;
        const surname = req.body.surname;

        // Verifica della validità degli input
        if (!name || !surname

            || typeof name !== "string"
            || typeof surname !== "string"

        ) return res.redirect('/register?error=');

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error='); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 3) return res.redirect('/register?error='); //set errror


        // Aggiunta nuovi dati alla registrazione
        registerData.name = name;
        registerData.surname = surname;
        registerData.stage = 4;
        
        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=4');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

router.post('/save', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error='); //set errror

        // Verifica se lo stage è quello corretto
        if (!registerData.stage === 4) return res.redirect('/register?error='); //set errror

        // Estrazione dati
        const { inviteID, email, user, password, name, surname } = registerData;


        // Savataggio del user sul database
        await new User({
    
            inviteID,

            email,

            user,
            password,

            name,
            surname,

        }).save();

        // Cancella i dati di registrazione
        registerData.deleteOne();

        // Rende l'invito non più valido
        await Invite.findByIdAndUpdate(inviteID, { valid: false });

        // Ritorno al login
        res.redirect('/login');

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
            password: hashPw

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