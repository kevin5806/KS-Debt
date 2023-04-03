const express = require('express');
const session = require('express-session');

const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const dotenv = require('dotenv'); dotenv.config();
const helmet = require('helmet');
const bcrypt = require('bcrypt');

//COSTANTI APP

//creazione dell app
const app = express();

//parametri del server
const PORT = process.env.PORT || 3000;

//url del database
const mongoURL = process.env.DB_URL;

//chiave di criptazione per la generazione sessioni
const sessionKEY = process.env.SESSION_KEY;

// ######### Impostazioni AppExpress ##############

//imposto la cartella e la engine di render
app.set('view engine', 'ejs');

// utilizzo delle librerie express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//per la sicurezza e la protezzione da vari tipi di attachi del app
app.use(helmet());

//serve per servire file statici accessibili da tutte le pagina del sito
const __static =  __dirname + '/public'; 
app.use(express.static(__static));

// ##################### Database ###########################

//rimuove un errore di mongoose nella versione attuale
mongoose.set('strictQuery', true);

// Connessione al database
mongoose.connect( mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const { User, Data, Invitecode, LOG } = require('./database/models');

// ################ Sessioni ######################

//funzione usata per creare una sessione
app.use(session({
    store: MongoStore.create({
        mongoUrl: mongoURL,

        touchAfter: 24 * 3600 *1, // indica il tempo massimo senza un utilizzo della sessione (in s)
        autoRemove: 'native', // rimuovi automaticamente le sessioni scadute dal database
        mongoOptions: { useNewUrlParser: true } // opzioni per la connessione a MongoDB
    }),

    //chiave di criptazione per le sessioni
    secret: sessionKEY, 
    
    resave: false,
    saveUninitialized: false,
    
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 3, // indica la durata massima di un login (in ms)
        httpOnly: true
    }
}))

// ################# Appunti ######################
/*

    // in caso servissero anche i dati del utente

        //verifica del ban
        const userData = await User.findById(sessionUID);
            
        //se l'utente è bannato viene reindirizzato al logout
        if (userData.ban) return res.redirect('/logout');

    // in caso si dovesse verificare solo il ban

        //se l'utente è bannato viene reindirizzato al logout
        if (await User.findOne({_id: sessionUID, ban: true}) ) return res.redirect('/logout');


*/
// ################## Route #######################

app.get('/', (req, res) => {

    res.sendFile(__static + '/index.html');

})

//ottimizzata
app.get('/logout', async (req, res) => {
    try {

        // Distrugge la ssessione
        await req.session.destroy();

        // Reinderizza al login
        res.redirect('/login');

    } catch (err) {

        res.status(500).send({err});

    }
})

app.use('/dashboard', require('./routes/dashboard'));

app.use('/settings', require('./routes/settings'));

app.use('/login', require('./routes/login'));

app.use('/register', require('./routes/register'));

app.use('/new', require('./routes/new'));

app.use('/data', require('./routes/data'));

app.use('/delete', require('./routes/delete'));

// ############### Errore 404 #####################

app.use(function(req, res, next) {
    res.status(404).sendFile(__static + '/404.html');
})

// ############## Avvio Server ####################

//avvio del server
app.listen(PORT, () => {
    console.log(`server aperto sulla porta ${PORT}`);
})

// ################################################