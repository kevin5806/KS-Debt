const mongoose = require("mongoose");

// MODELLI

const LOG = mongoose.model('log',
    new mongoose.Schema({

        userID: { type: String },
        client: { type: String },
        date: { type: String },
        ip: { type: String }

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

    action: { type: Number },
    sumSaved: { type: Number },
    sumVariation: { type: Number },
    date: { type: String }

})

const dataSchema = new mongoose.Schema({

    userID: { type: String },
    name: { type: String },
    sum: { type: Number },
    
    history: [dataHistorySchema]

})
  
const DataHistory = mongoose.model('datahistory', dataHistorySchema);
const Data = mongoose.model('data', dataSchema);

/* ---------- */

const User = mongoose.model('user',
    new mongoose.Schema({

        user: { type: String},
        password: { type: String},
        name: { type: String},
        surname: { type: String},
        inviteID: { type: String},
        ban: { type: Boolean }

    })
)

const Invite = mongoose.model('invite',
    new mongoose.Schema({

        code: { type: String },
        creatorID: { type: String },
        valid: { type: Boolean },
        creationDate: { type: String },
        email: { type: String }

    })
)

module.exports = { User, Data, Invite, LOG, DataHistory};