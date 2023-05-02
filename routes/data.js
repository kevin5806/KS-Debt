const express = require('express');
const router = express.Router();

const { User, Data, Invite, LOG, DataHistory } = require('../database/models');

//ottimizzata
router.post('/add', async (req, res) => {
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
                sumSaved: sum,
                date: new Date(),

            }]

        }).save();

        // Reindirizza alla pagina principale
        res.redirect('/dashboard');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

//ottimizzata
router.post('/edit', async (req, res) => {
    try {

        // Verifica l'autenticazione
        if (!req.session.auth) return res.redirect('/login?error=4');

        const sessionUID = req.session.userID;

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({ _id: sessionUID, ban: true })) return res.redirect('/logout');

        // Estrae i dati dalla richiesta
        const id = req.body.id;
        let sum = Number(req.body.sum);
        const operation = Number(req.body.operation);
        const sBtn = Number(req.body.sBtn);
        const sign = Number(req.body.sign);

        // Verifica la validità dei dati inseriti
        if (

            id === ''
            || typeof id !== 'string'
            || isNaN(sum)
            || (sum === '' && operation !== 2 && sBtn !== 2)
            || !(operation === 1 || operation === 2)
            || !(sBtn === 1 || sBtn === 2)
            || !(sign === 1 || sign === 2)

        ) return res.redirect(`/dashboard?error=2&id=${id}`);

        const data = await Data.findOne({ userID: sessionUID, _id: id });

        if (sBtn === 1) {
            // inviato con il pulsante normale

            if (sign === 1) {

                // Negativo
                sum = Math.abs(sum);
                sum = sum * -1;

            } else {

                // Positivo
                sum = Math.abs(sum);

            }

            if (operation === 1) {

                // Operazione ADD
                let sumVariation = sum; //valore di sum = input al savataggio

                sum = Number(data.sum + sum).toFixed(2);

                //prima del salvataggio controlla che la somma aggiornata non superi i limiti
                if (sum < -9999.99 || sum > 9999.99) return res.redirect(`/dashboard?error=2&id=${id}`);

                data.sum = sum; //somma attuale

                data.history.push(
                    new DataHistory({

                        action: 1, //add action
                        sumSaved: sum, //valore del totale al savataggio
                        sumVariation: sumVariation, //valore di input al savataggio 
                        date: new Date()

                    })
                )

            } else {

                // Operazione SET

                //prima del salvataggio controlla che la somma aggiornata non superi i limiti
                if (sum < -9999.99 || sum > 9999.99) return res.redirect(`/dashboard?error=2&id=${id}`);

                data.sum = sum;

                data.history.push(
                    new DataHistory({

                        action: 2, //add action
                        sumSaved: sum, //valore del totale al savataggio
                        sumVariation: sum, //valore di input al savataggio 
                        date: new Date()

                    })
                )

            }

            // Salva il documento modificato
            await data.save();

        } else if (sBtn === 2) {
            // inviato con il pulsante delete

            // Elimina il dato dal database
            await data.deleteOne();

        }

        // Ritorna alla dashboard
        res.redirect('/dashboard');

    } catch (err) {

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

    }
})

module.exports = router;