const nodemailer = require('nodemailer');

// ################# Mail Sernder ###########################

const emailUSER = process.env.EMAIL_USER;
const emailPASS = process.env.EMAIL_PASS;

// Configura il trasportatore
const EmailTransport = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
        user: emailUSER,
        pass: emailPASS
    }
});

module.exports = { EmailTransport };