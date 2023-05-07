const mongoose = require('mongoose');

// MODELLI

const LOG = mongoose.model('log',
    new mongoose.Schema({

        userID: String,
        client: String,
        date: Date,
        ip: String

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
    date: Date

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
        ban: Boolean

    })
)

const Invite = mongoose.model('invite',
    new mongoose.Schema({

        code: String,
        creatorID: String,
        valid: Boolean,
        date: Date,
        email: String

    })
)

module.exports = { User, Data, Invite, LOG, DataHistory};