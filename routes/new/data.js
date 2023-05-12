// ################ Imports ######################

const express = require('express');
const router = express.Router();

const { User, Data } = require('../../modules/database/models');

// ################ Routes ######################

router.post('/', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        // Estrae i dati dalla richiesta
        let sum = Number(req.body.sum);
        const name = req.body.name;
        const sign = Number(req.body.sign);

        // Verifica la validità dei dati inseriti
        if (

            isNaN(sum) ||
            sum < -9999.99 || sum > 9999.99 ||
            typeof name !== 'string' ||
            name === '' ||
            name.length > 35 ||
            (sign !== 1 && sign !== 2)

        ) return res.redirect('/dashboard?error=1');

        // Esegue le operazioni del menù di selezione positivo/negativo
        if (sign === 1) {

            // Negativo
            sum = Math.abs(sum);
            sum = sum * -1;

        } else {

            // Positivo
            sum = Math.abs(sum);

        }

        // Salva i nuovi dati sul database
        await new Data({

            userID: sessionUID,
            sum: sum,
            name: name,
            history: [{

                action: 3,
                sumSaved: sum

            }]

        }).save();

        // Reindirizza alla pagina principale
        res.redirect('/dashboard');

    } catch (err) {

        res.status(500).render('modules/error', {error: false, status: 500, message: 'Server Error'});

    }
})

// ################ Exports ######################

module.exports = router;