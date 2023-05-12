// ################ Imports ######################

const express = require('express');
const router = express.Router();

const uuid = require('uuid');
const bcrypt = require('bcrypt');

const ejs = require('ejs');

const { User, Invite, Register, EmailVerify } = require('../modules/database/models');
const { EmailSender } = require('../modules/email/transport');


// ################ Appunti #####################

// GENRALI (escluso stage 0)
    //error = g1 > Stage Errato + (reindirizzamento a stage salvato)

// STAGE 0 (invite code)
    //error = 1 > Input inserito non valido
    //error = 2 > Codice di invito non trovato
    //error = 3 > Codice di invito gia usato
    //error = 4 > (Cookie/Registration Data not found)

// STAGE 1 (email)
    //error = 11 > Input inserito non valido
    //error = 12 > Email già in uso da un altro utente

// 1.5 (email verify)
    //error = 151 > Input inserito non valido
    //error = 152 > Codice inserito sbagliato

// STAGE 2 (account)
    //error = 21 > Input inserito non valido
    //error = 22 > User già in uso da un altro utente

// STAGE 3 (person)
    //error = 31 > Input inserito non valido


// ################ Routes ######################

router.get('/', (req, res) => {

    res.render('register', { error: req.query.error, InviteCode: req.query.InviteCode, stage: req.query.stage, email: req.cookies.registerEmail });

})

// lo stage precedente inizializza lo stage sucessivo in modo da evitare cambi di dati

// STAGE 0
router.post('/', async (req, res) => {
    try {

        const inviteCode = req.body.inviteCode;

        // Verifica della validità degli input
        if (!inviteCode || typeof inviteCode !== "string" || !uuid.validate(inviteCode)) return res.redirect(`/register?error=1&InviteCode=${inviteCode}`);

        // ###############################

        // Ricerca dati sul invito tramite codice
        const inviteData = await Invite.findOne({ code: inviteCode });

        // Se il codice di invito non esiste restituisce un errore
        if (!inviteData) return res.redirect(`/register?error=2&InviteCode=${inviteCode}`);

        // Se "valid" è falso restituisce un errore
        if (!inviteData.valid) return res.redirect(`/register?error=3&InviteCode=${inviteCode}`);

        // ###############################

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

        // ###############################

         // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=1');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// STAGE 1
router.post('/email', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Verifica se lo stage è quello corretto
        if (registerData.stage !== 1 && registerData.stage !== 1.5) return res.redirect(`/register?error=g1&stage=${registerData.stage}`);

        // ###############################

        const email = req.body.email;

        // Verifica della validità degli input
        if (!email || typeof email !== "string") return res.redirect('/register?error=11&stage=1');


        // Verifica della presenza di un user con la stessa email sul database
        const userData = await User.findOne({ email });

        // Se l'user con l'email esiste già restituisce un errore
        if (userData) return res.redirect('/register?error=12&stage=1');

        // ###############################

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

        // ###############################

        // Dopo il salvataggio l'ID è accessibile
        registerData.emailVerifyID = emailVerify._id;

        // ###############################

        // Render del Email
        const url = `${req.protocol}://${req.get('host')}`
        const html = await ejs.renderFile('modules/email/emailVerify.ejs', { url, code, email });

        // Configura il messaggio di posta elettronica
        const mail = {
            from: 'KSDB <noreply@mooreventi.com>',
            to: email,
            replyTo: 'kevinservdb@gmail.com',
            subject: `Email Verify Code: ${code}`,
            html: html
        }

        // Invia la mail
        await EmailSender.sendMail(mail);

        // ###############################

        registerData.stage = 1.5;

        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // ###############################

        // Salvo l'email nei cookie per poterla usare più semplicemente nel front-end
        res.cookie('registerEmail', email, {
            maxAge: 1000 * 3600, // 1 ora
            httpOnly: true
        })

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=1.5');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// STAGE 1 (1.5)
router.post('/emailVerify', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Verifica se lo stage è quello corretto
        if (registerData.stage !== 1.5) return res.redirect(`/register?error=g1&stage=${registerData.stage}`);

        // ###############################

        const code = req.body.code;

        // Verifica della validità degli input
        if (!code || typeof code !== "string") return res.redirect(`/register?error=151&stage=1.5`);

        // ###############################

        // Ricerca del documento di verifica per id
        const verifyData = await EmailVerify.findById(registerData.emailVerifyID);

        // Verifica della validità del codice inserito
        if (verifyData.code !== code) return res.redirect(`/register?error=152&stage=1.5`);

        // ###############################

        // Aggiunta/aggiornamento dei dati
        registerData.email = verifyData.email;
        registerData.stage = 2;

        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // ###############################

        // Elimina il codice di verifica
        verifyData.deleteOne();

        // ###############################

        // Cancello l'email dai cookie
        res.clearCookie('registerEmail');

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=2');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// STAGE 2
router.post('/account', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Verifica se lo stage è quello corretto
        if (registerData.stage !== 2) return res.redirect(`/register?error=g1&stage=${registerData.stage}`);

        // ###############################

        // Estrae i dati dalla richiesta
        const user = req.body.user;
        const password = req.body.password;

        // Verifica della validità degli input
        if (!user || !password

            || typeof user !== "string"
            || typeof password !== "string"

        ) return res.redirect(`/register?error=21&stage=2`);

        // ###############################

        // Verifica della presenza del user sul database
        const userData = await User.findOne({ user });

        // Se l'user esiste già restituisce un errore
        if (userData) return res.redirect(`/register?error=22&stage=2`);

        // ###############################

        // Hashing della password
        const hashPw = await bcrypt.hash(password, 10);
        
        // Aggiunta nuovi dati alla registrazione
        registerData.user = user;
        registerData.password = hashPw;
        registerData.stage = 3;
        
        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // ###############################

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=3');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// STAGE 3
router.post('/person', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Verifica se lo stage è quello corretto
        if (registerData.stage !== 3) return res.redirect(`/register?error=g1&stage=${registerData.stage}`);

        // ###############################

        // Estrae i dati dalla richiesta
        const name = req.body.name;
        const surname = req.body.surname;

        // Verifica della validità degli input
        if (!name || !surname

            || typeof name !== "string"
            || typeof surname !== "string"

        ) return res.redirect(`/register?error=31&stage=3`); //set error

        // ###############################

        // Aggiunta nuovi dati alla registrazione
        registerData.name = name;
        registerData.surname = surname;
        registerData.stage = 4;
        
        // Se tutto è corretto salvataggio dei dati email
        await registerData.save();

        // ###############################

        // Reindirizza passando il prossimo stage
        res.redirect('/register?stage=4');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// STAGE 4
router.post('/save', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Verifica se lo stage è quello corretto
        if (registerData.stage !== 4) return res.redirect(`/register?error=g1&stage=${registerData.stage}`);

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

        // Elimina il cookie con la chiave di registrazione
        res.clearCookie('registerKey');

        // Rende l'invito non più valido
        await Invite.findByIdAndUpdate(inviteID, { valid: false });

        // Ritorno al login
        res.redirect('/login');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// DELETE
router.post('/delete', async (req, res) => {
    try {

        // Ricerca dati con la chiave
        const registerData = await Register.findOne({ key: req.cookies.registerKey });

        // Verifica se il documento con i codici è stato trovato
        if (!registerData) return res.redirect('/register?error=4');

        // Cancella i dati di registrazione
        registerData.deleteOne();

        // Elimina il cookie con la chiave di registrazione
        res.clearCookie('registerKey');

        // Ritorno al login
        res.redirect('/register');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;
