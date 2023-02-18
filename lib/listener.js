"use strict";

const Imap = require("node-imap");
const EventEmitter = require("events").EventEmitter;
const simpleParser = require("mailparser").simpleParser;

class MailListener extends EventEmitter {
    constructor(options, adapter) {
        super();
        this.xoauth2 = null;
        if (options.token) {
            const _build_XOAuth2_token = (user = "", access_token = "") =>
                Buffer.from([`user=${user}`, `auth=Bearer ${access_token}`, "", ""].join("\x01"), "utf-8").toString(
                    "base64",
                );
            this.xoauth2 = _build_XOAuth2_token(options.username, options.token);
        }
        try {
            this.flag = JSON.parse(options.flag);
        } catch (e) {
            this.flag = ["ALL"];
        }
        this.adapter = adapter;
        this.seen = { markSeen: false };
        this.mailbox = options.inbox || "INBOX";
        this.dir = `${__dirname}/lib/attachment`;
        this.client = options.user;
        this.max = options.maxi_html > 0 ? options.maxi_html : 10;
        this.imap = new Imap({
            xoauth2: this.xoauth2,
            xoauth: null,
            user: options.username,
            password: options.password,
            host: options.host,
            port: options.port,
            tls: options.tls,
            autotls: "never",
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 5000,
            debug: this.adapter.log.debug,
            socketTimeout: 0,
            keepalive: true,
        });
        this.imap.once("ready", this.onReady.bind(this));
        this.imap.once("close", this.onClose.bind(this));
        this.imap.once("error", this.onError.bind(this));
        this.imap.once("alert", this.onAlert.bind(this));
        this.imap.once("update", this.onUpdate.bind(this));
        this.imap.once("mail", this.onMail.bind(this));
        this.imap.once("uidvalidity", this.onUidvalidity.bind(this));
    }

    onUidvalidity(uidvalidity) {
        this.emit("uidvalidity", uidvalidity, this.client);
    }

    start() {
        this.imap.connect();
    }

    stop() {
        this.imap.end();
    }

    onNewRead() {
        this.readMails.call(this);
    }

    onReady() {
        this.imap.openBox(this.mailbox, false, (error, mailbox) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                this.emit("connected", this.client);
                this.emit("mailbox", mailbox, this.client);
                this.readMails.call(this);
            }
        });
    }

    onAlert(message) {
        this.emit("alert", message, this.client);
    }

    onUpdate(seqno, info) {
        this.emit("update", seqno, info, this.client);
        this.readMails.call(this);
    }

    onMail(seqno) {
        this.emit("mailevent", seqno, this.client);
        this.readMails.call(this);
    }

    onClose(hadError) {
        this.emit("disconnected", hadError, this.client);
    }

    onError(err) {
        if (err) {
            this.emit("error", err, this.client);
        }
    }

    readMails() {
        this.imap.search(this.flag, async (error, results) => {
            if (error) {
                this.emit("error", error, this.client);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                results.sort((a, b) => a - b);
                results.reverse();
                for (const result of results) {
                    if (count > this.max) break;
                    await this.findmail(result, count, all);
                    ++count;
                }
            } else {
                this.emit("error", "Mailbox is empty", this.client);
            }
        });
    }

    async findmail(result, counter, all) {
        return new Promise((resolve) => {
            try {
                const f = this.imap.fetch(result, {
                    bodies: "",
                    ...this.seen,
                });
                f.on("message", (msg, seqno) => {
                    let attrs;
                    msg.on("attributes", (att) => {
                        attrs = att;
                    });
                    msg.on("body", async (stream, info) => {
                        const mail = await simpleParser(stream);
                        if (mail.attachments.length > 0) {
                            delete mail.attachments;
                        }
                        this.emit("mail", mail, seqno, attrs, info, this.client, counter, all);
                        resolve(true);
                    });
                });
                f.once("error", (error) => {
                    if (error) {
                        this.emit("error", error, this.client);
                    }
                    resolve(false);
                });
            } catch (error) {
                this.emit("error", error, this.client);
                resolve(false);
            }
        });
    }
}
module.exports.MailListener = MailListener;
