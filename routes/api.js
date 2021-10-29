const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/v1', (req, res) => {
    let user = req.body.user;
    let pass = req.body.pass;
    let from = req.body.from;
    let to = req.body.to;
    let subject = req.body.subject;
    let html = req.body.html;

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });

    let mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: html
    }

    transporter.sendMail(mailOptions, (err, data) => {
        if (err){
            res.json({ status: 'failed', message: err });
            return;
        }    

        res.json({ status: 'success' });
    });
});

router.post('/v2', (req, res) => {
    let user = req.body.user;
    let pass = req.body.pass;
    let from = req.body.from;
    let to = req.body.to;
    let subject = req.body.subject;
    let html = req.body.html;
    let host = req.body.host;

    let transporter = nodemailer.createTransport({
        host: host,
        port: 465,
        secure: true,
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: from,
        to: to,
        subject: subject,
        html: html
    }

    transporter.sendMail(mailOptions, (err, data) => {
        if (err){
            res.json({ status: 'failed', message: err });
            return;
        }    

        res.json({ status: 'success' });
    });
});

module.exports = router;