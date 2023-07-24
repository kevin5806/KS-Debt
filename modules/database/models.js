const mongoose = require('mongoose');

// MODELLI

const LOG = mongoose.model('log',
    new mongoose.Schema({

        userID: String,
        client: String,
        ip: String,

        date: { type: Date, default: Date.now }

    })
)

/* -- DATA -- */

/* 
    -- ACTION --
    1 = add
    2 = set
    3 = create
*/

const dataHistorySchema = new mongoose.Schema({

    action: Number,
    sumSaved: Number,
    sumVariation: Number,

    date: { type: Date, default: Date.now }

})

const dataSchema = new mongoose.Schema({

    userID: String,
    name: String,
    sum: Number,
    
    history: [dataHistorySchema]

})
  
const DataHistory = mongoose.model('datahistory', dataHistorySchema);
const Data = mongoose.model('data', dataSchema);

/* ---------- */

const User = mongoose.model('user',
    new mongoose.Schema({

        user: String,
        password: String,
        name: String,
        surname: String,
        inviteID: String,

        email: String,

        ban: { type:Boolean, default: false }

    })
)

const Invite = mongoose.model('invite',
    new mongoose.Schema({

        code: String,
        creatorID: String,
        email: String,
        
        valid: { type: Boolean, default: true },
        date: { type: Date, default: Date.now },

    })
)

const Register = mongoose.model('register', 
    new mongoose.Schema({

        key: String,
        stage: Number,

        //stage 0
        inviteID: String,

        //stage 1
        email: String,
        emailVerifyID: String,

        //Stage 2
        user: String,
        password: String,

        //Stage 3
        name: String,
        surname: String,

        expirationDate: {
            type: Date,
            expires: 3600, // Imposta la scadenza a 1 ora
            default: Date.now // Imposta la data di scadenza predefinita a quella corrente
        }

    })
)

const EmailVerify = mongoose.model('emailVerify',
    new mongoose.Schema({

        code: String,
        email: String,

        expirationDate: {
            type: Date,
            expires: 300, // Imposta la scadenza a 5 minuti
            default: Date.now // Imposta la data di scadenza predefinita a quella corrente
        }

    })
)

const Recover = mongoose.model('Recovery', 
    new mongoose.Schema({

        key: String,
        stage: Number,

        //stage 0
        email: String,
        emailVerifyID: String,

        //stage 1
        newPassword: String,

        expirationDate: {
            type: Date,
            expires: 600, // Imposta la scadenza a 10 min
            default: Date.now // Imposta la data di scadenza predefinita a quella corrente
        }

    })
)

module.exports = { User, Data, Invite, LOG, DataHistory, Register, EmailVerify, Recover };