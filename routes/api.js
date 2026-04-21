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
        if (err) {
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
        if (err) {
            res.json({ status: 'failed', message: err });
            return;
        }

        res.json({ status: 'success' });
    });
});

router.post('/v3', (req, res) => {
    let user = req.body.user;
    let pass = req.body.pass;
    let from = req.body.from;
    let to = req.body.to;
    let subject = req.body.subject;
    let html = req.body.html;
    let host = req.body.host;
    let attachments = JSON.parse(req.body.attachments);

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
        from,
        to,
        subject,
        html,
        attachments
    }

    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            res.json({ status: 'failed', message: err });
            return;
        }

        res.json({ status: 'success' });
    });
});

router.post('/v4', async (req, res) => {
    try {
        const b = req.body || {};
  
        // --- Helpers ---
        const parseBool = (v) => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') return v.toLowerCase() === 'true';
            if (typeof v === 'number') return v === 1;
            return undefined;
        };
        const trim = (s) => (typeof s === 'string' ? s.trim() : s);
        const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  
        // --- Extract & Normalize ---
        const host = trim(b.host);
        const port = Number(b.port);
        const secure = parseBool(b.secure);
        const user = trim(b.user);
        const pass = trim(b.pass);
        const from = trim(b.from);
        const to = Array.isArray(b.to) ? b.to : trim(b.to);
        const { subject, html, text, cc, bcc, replyTo } = b;
  
        // --- Validation ---
        if (!host) return res.status(400).json({ status: 'failed', message: 'host required' });
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            return res.status(400).json({ status: 'failed', message: 'invalid port' });
        }
        if (!to || (Array.isArray(to) && to.length === 0)) {
            return res.status(400).json({ status: 'failed', message: 'to required' });
        }
        if (!from) return res.status(400).json({ status: 'failed', message: 'from required' });
  
        // Validate the email part of "Name <email@domain.com>"
        const emailOnly = from.includes('<') ? from.split('<').pop().replace('>', '').trim() : from;
        if (!isEmail(emailOnly)) {
            return res.status(400).json({ status: 'failed', message: 'from must be valid email' });
        }
  
        // --- Transporter Configuration ---
        const transporter = nodemailer.createTransport({
            host,
            port,
            // Default to SSL for 465, otherwise use STARTTLS
            secure: secure !== undefined ? secure : port === 465,
            auth: user && pass ? { user, pass } : undefined,
            tls: {
                // Only allow self-signed if explicitly requested
                rejectUnauthorized: !parseBool(b.allowInvalidCert)
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000
        });
  
        // --- Mail Options ---
        const mailOptions = {
            from,
            to,
            ...(cc && { cc }),
            ...(bcc && { bcc }),
            ...(subject && { subject: String(subject).replace(/[\r\n]+/g, ' ') }),
            ...(html && { html }),
            ...(text && { text }),
            ...(replyTo && { replyTo: trim(replyTo) })
        };
  
        // --- Attachments Logic ---
        if (b.attachments) {
            try {
                const parsed = typeof b.attachments === 'string' ? JSON.parse(b.attachments) : b.attachments;
                if (Array.isArray(parsed) && parsed.length > 0) {
                    mailOptions.attachments = parsed;
                }
            } catch (e) {
                return res.status(400).json({ status: 'failed', message: 'invalid attachments format' });
            }
        }
    
        // --- Execution ---
        const info = await transporter.sendMail(mailOptions);
        return res.json({ 
            status: 'success', 
            messageId: info.messageId,
            response: info.response 
        });
    
    } catch (err) {
        // Log the error internally for debugging
        console.error('Mailer Error:', err);
    
        // Filter error messages for the client
        let userMessage = 'Send failed';
        if (err.code === 'EAUTH') userMessage = 'Authentication failed';
        if (err.code === 'ECONNREFUSED') userMessage = 'Could not connect to SMTP host';
        
        return res.status(502).json({ 
            status: 'failed', 
            message: userMessage,
            code: err.code 
        });
    }
});

module.exports = router;