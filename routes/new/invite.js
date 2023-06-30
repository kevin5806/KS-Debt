// ################ Imports ######################

const express = require('express');
const router = express.Router();

const uuid = require('uuid');
const ejs = require('ejs');

const { User, Invite } = require('../../modules/database/models');
const { EmailSender } = require('../../modules/email/transport');

// ################ Routes ######################

router.get('/', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        const code = uuid.v4();

        // Salva sul database il nuovo invito
        await new Invite({

            code: code,
            creatorID: sessionUID

        }).save();

        // Reindirizza passando il nuovo codice
        res.redirect(`/dashboard?InviteCode=${code}`);

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})


router.post('/email', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //verifica del ban
        const userData = await User.findById(sessionUID);
            
        //se l'utente è bannato viene reindirizzato al logout
        if (userData.ban) return res.redirect('/logout');

        const code = req.body.code;
        const email = req.body.email;

        // Verifica della validità degli input
        if (!email) return res.redirect(`/dashboard?InviteCode=${code}&error=4`);

        await Invite.findOneAndUpdate({ creatorID: sessionUID, code: {$eq: code} }, { email: {$eq: email} });

        const name = userData.name, surname = userData.surname, user = userData.user;

        const url = `${req.protocol}://${req.get('host')}`
        const html = await ejs.renderFile('modules/email/newInvite.ejs', {user, name, surname, url, code});

        // Configura il messaggio di posta elettronica
        const mail = {
            from: 'KSDB <noreply@mooreventi.com>',
            to: email,
            replyTo: 'kevinservdb@gmail.com',
            subject: `${name} ${surname} - Sent you an invite code to KS-debt`,
            html: html
        }

        // Invia la mail
        await EmailSender.sendMail(mail);

        // Reindirizza passando lo stato di successo
        res.redirect(`/dashboard?InviteCode=${code}&status=1`);

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;
