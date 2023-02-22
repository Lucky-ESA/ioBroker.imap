"use strict";

const { ImapFlow } = require("imapflow");
const EventEmitter = require("events").EventEmitter;
//const simpleParser = require("mailparser").simpleParser;

class ImapListener extends EventEmitter {
    constructor(options, adapter) {
        super();
        this.adapter = adapter;
        this.client = options.user;
        this.xoauth2 = null;
        if (options.token) {
            const _build_XOAuth2_token = (user = "", access_token = "") =>
                Buffer.from([`user=${user}`, `auth=Bearer ${access_token}`, "", ""].join("\x01"), "utf-8").toString(
                    "base64",
                );
            this.xoauth2 = _build_XOAuth2_token(options.username, options.token);
        }
        const logger = {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: console.error,
        };
        this.imap = new ImapFlow({
            host: options.host,
            port: options.port,
            secure: options.tls,
            qresync: true,
            emitLogs: false,
            tls: { rejectUnauthorized: false },
            auth: {
                user: options.username,
                pass: options.password,
                accessToken: this.xoauth2,
            },
            clientInfo: {
                name: false,
                "support-url": false,
                vendor: false,
                date: false,
            },
            logRaw: true,
        });
        this.imap.on("mailboxOpen", this.onOpen.bind(this));
        this.imap.on("mailboxClose", this.onClose.bind(this));
        this.imap.on("log", this.onLog.bind(this));
        this.imap.on("flags", this.onFlags.bind(this));
        this.imap.on("expunge", this.onExpunge.bind(this));
        this.imap.on("exists", this.onExists.bind(this));
        this.imap.on("error", this.onError.bind(this));
    }
    async start() {
        await this.imap.connect();
        const mailbox = await this.imap.mailboxOpen("INBOX");
        //const emails = [];
        //for await (const msg of this.imap.fetch(
        //    { seen: false },
        //    {
        //        flage: true,
        //        envelope: true,
        //        source: false,
        //        bodyParts: true,
        //        bodyStructure: true,
        //        uid: true,
        //    },
        //)) {
        //    emails.push(msg);
        //}
    }
    onOpen(mailbox) {
        this.emit("open", mailbox, this.client);
        this.adapter.log.info("OPEN: " + this.toJson(mailbox));
    }
    toJson(data) {
        return JSON.stringify(data, (_, v) => (typeof v === "bigint" ? `${v}n` : v)).replace(
            /"(-?\d+)n"/g,
            (_, a) => a,
        );
    }
    onClose(mailbox) {
        this.emit("close", mailbox, this.client);
        this.adapter.log.info("CLOSE: " + JSON.stringify(mailbox));
    }
    onLog(log) {
        this.emit("log", log, this.client);
        this.adapter.log.info("LOG: " + JSON.stringify(log));
    }
    onFlags(data) {
        this.emit("flags", data, this.client);
        this.adapter.log.info("FLAGS: " + JSON.stringify(data));
    }
    onExpunge(data) {
        this.emit("expunge", data, this.client);
        this.adapter.log.info("Expunge: " + JSON.stringify(data));
    }
    onExists(data) {
        this.emit("exists", data, this.client);
        this.adapter.log.info("exists: " + JSON.stringify(data));
    }
    onError(err) {
        this.emit("exists", err, this.client);
        //this.adapter.log.info("exists: " + JSON.stringify(err));
    }
}
module.exports.ImapListener = ImapListener;
