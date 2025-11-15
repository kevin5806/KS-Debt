const nodemailer = require('nodemailer');

// ################# Mail Sernder ###########################

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

// Sendgrid service

// Configura il trasportatore
const EmailSender = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    auth: {
        user, pass
    }
})

module.exports = { EmailSender };