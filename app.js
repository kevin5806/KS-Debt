const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const dotenv = require('dotenv'); dotenv.config();
const helmet = require('helmet');

//COSTANTI APP

const app = express();

// ################### ENV ########################

//parametri del server
const PORT = process.env.PORT || 3000;

//url del database
const mongoURL = process.env.DB_URL;

//chiave di criptazione per la generazione sessioni
const sessionKEY = process.env.SESSION_KEY;

// ######### Impostazioni AppExpress ##############

// Impostazione Cartella di default di EJS, set del renderer
app.set('view engine', 'ejs');

// Defaul Settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MiddleWare automatico per l'aumento della sicurezza
app.use(helmet());

// Set Risorse statiche
const __static = __dirname + '/public';
app.use(express.static(__static));

// ################ HTTP rate limiter ######################

// limita i client a 100 richieste ogni 8 minuti, per IP
app.use(
    rateLimit({
        windowMs: 1000 * 60 * 8 , // 8 minuti
        max: 100
    })
)

// custom error page
app.use((err, req, res, next) => {

    if (err instanceof RateLimitError) {

        res.status(429).render('error', {error: false, status: 429, message: 'Too many HTTP requests, try again later'});

    } else {

        next(err);

    }

})

// ##################### Database ###########################

//rimuove un errore di mongoose nella versione attuale
mongoose.set('strictQuery', true);

// Connessione al database
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// ################ Sessioni ######################

//funzione usata per creare una sessione
app.use(session({
    store: MongoStore.create({
        mongoUrl: mongoURL,

        touchAfter: 3600 * 24 * 20, // indica il tempo massimo senza un utilizzo della sessione (in s) {ultima cifra = giorni}
        autoRemove: 'native', // rimuovi automaticamente le sessioni scadute dal database
        mongoOptions: { useNewUrlParser: true } // opzioni per la connessione a MongoDB
    }),

    //chiave di criptazione per le sessioni
    secret: sessionKEY,

    resave: false,
    saveUninitialized: false,

    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 90, // indica la durata massima di un login (in ms) {ultima cifra = giorni}
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

        res.status(500).render('error', {error: false, status: 500, message: 'Server Error'});

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

app.use(function (req, res, next) {

    res.status(404).render('error', {error: false, status: 404, message: 'You might have lost yourself'});

})

// ############## Avvio Server ####################

//avvio del server
app.listen(PORT, () => {
    console.log(`server aperto sulla porta ${PORT}`);
})

// ################################################