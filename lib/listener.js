"use strict";

const Imap = require("node-imap");
const EventEmitter = require("events").EventEmitter;
const simpleParser = require("mailparser").simpleParser;
// eslint-disable-next-line no-unused-vars
const MONTHS = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "May",
    6: "Jun",
    7: "Jul",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
};

class MailListener extends EventEmitter {
    constructor(options, debug) {
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
        this.seen = { markSeen: false };
        this.mailbox = options.inbox || "INBOX";
        this.dir = `${__dirname}/lib/attachment`;
        this.client = options.user;
        this.max = options.maxi_html > options.maxi ? options.maxi_html : options.maxi;
        let tlsoption = {};
        this.allMails = [];
        try {
            if (typeof options.tlsoption === "object") {
                tlsoption = JSON.parse(JSON.stringify(options.tlsoption));
            } else {
                tlsoption = JSON.parse(options.tlsoption);
            }
        } catch (e) {
            this.emit("log", "debug", "TLSOPTION", e, this.client);
        }
        this.all_seqno = [];
        this.folder = [];
        this.imap = new Imap({
            xoauth2: this.xoauth2,
            xoauth: null,
            user: options.username,
            password: options.password,
            host: options.host,
            port: options.port,
            tls: options.tls,
            autotls: options.autotls,
            tlsOptions: tlsoption,
            connTimeout: 10000,
            authTimeout: 5000,
            debug: debug,
            socketTimeout: 0,
            keepalive: {
                interval: 10000,
                idleInterval: 0,
                forceNoop: true,
            },
        });
        this.imap.once("ready", this.onReady.bind(this));
        this.imap.once("close", this.onClose.bind(this));
        this.imap.on("error", this.onError.bind(this));
        this.imap.on("alert", this.onAlert.bind(this));
        this.imap.on("update", this.onUpdate.bind(this));
        this.imap.on("mail", this.onMail.bind(this));
        this.imap.on("uidvalidity", this.onUidvalidity.bind(this));
        this.imap.on("expunge", this.onExpunge.bind(this));
        //this.imap.on("debug", this.onDebug.bind(this));
    }

    start() {
        this.imap.connect();
    }

    //onDebug(type, box, state) {
    //    this.adapter.log.info("Debug: " + type);
    //    this.adapter.log.info("Debug_JSON: " + JSON.stringify(box));
    //    if (state) this.adapter.log.info("Debug_State: " + state);
    //}

    async subscribeBox(mailboxname) {
        this.imap.subscribeBox(mailboxname, (error) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                this.emit("log", "debug", "Subscribe", mailboxname, this.client);
            }
        });
    }

    setFolder() {
        this.imap.getBoxes((error, boxes) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                for (const key in boxes) {
                    if (key != "[Gmail]" && key != "[Google Mail]") {
                        this.folder.push(key);
                    }
                    if (boxes[key].children) {
                        for (const keys in boxes[key].children) {
                            const foldername = `${key}${boxes[key].delimiter}${keys}`;
                            this.folder.push(foldername);
                            this.subscribeBox(foldername);
                        }
                    }
                }
                this.emit("sub", this.folder, this.client);
            }
        });
    }

    getFolder() {
        return this.folder;
    }

    async custom_search(obj) {
        let read_mail = null;
        if (obj.message.fetch.fetch) {
            if (obj.message.fetch.seqno != null) {
                read_mail = obj.message.fetch.seqno;
                this.startReadMails(read_mail, obj, read_mail.length);
            } else if (obj.message.fetch.single != null) {
                read_mail = obj.message.fetch.single;
                this.startReadMails(read_mail, obj, read_mail.split(":")[1]);
            } else {
                this.emit("error", "Missing fetch", this.client);
                return;
            }
        } else {
            let flag;
            try {
                if (typeof obj.message.search === "object") {
                    flag = JSON.parse(JSON.stringify(obj.message.search));
                } else {
                    flag = JSON.parse(obj.message.search);
                }
            } catch (e) {
                this.emit("error", e, this.client);
                this.emit("sendToError", obj, "Error parse", this.client);
                return;
            }
            await this.imap.search(flag, (error, results) => {
                if (error) {
                    this.emit("error", error, this.client);
                    this.emit("sendToError", obj, "Error search", this.client);
                } else if (results.length > 0) {
                    const new_arr = [];
                    results.sort((a, b) => a - b);
                    results.reverse();
                    if (obj.message.max > 0 && results.length > obj.message.max) {
                        for (let i = 0; i < obj.message.max; i++) {
                            new_arr.push(results[i]);
                        }
                        read_mail = new_arr;
                    } else {
                        read_mail = results;
                    }
                    this.startReadMails(read_mail, obj, read_mail.length);
                } else {
                    this.emit("sendToError", obj, "Mailbox is empty", this.client);
                }
            });
        }
    }

    async startReadMails(read_mail, obj, count) {
        if (read_mail != null) {
            const result = await this.readAllMails(read_mail, obj, count);
            this.emit("sendTo", obj, result, this.client);
        } else {
            this.emit("sendToError", obj, "Cannot found Mails", this.client);
        }
    }

    stop() {
        this.imap.end();
    }

    destroy() {
        this.imap.destroy();
    }

    imap_state() {
        return this.imap.state;
    }

    imap_delimiter() {
        return this.imap.delimiter;
    }

    imap_namespaces() {
        return this.imap.namespaces;
    }

    onNewRead() {
        this.readMails.call(this);
    }

    onReady(folder) {
        if (folder && folder != "") {
            if (folder == this.mailbox) return;
            this.mailbox = folder;
            this.getStatus(folder);
            this.imap.openBox(folder, false, (error, mailbox) => {
                if (error) {
                    this.emit("error", error, this.client);
                } else {
                    this.emit("mailbox", mailbox, this.client);
                    this.readMails.call(this);
                }
            });
        } else {
            this.getStatus(this.mailbox);
            this.imap.openBox(this.mailbox, false, (error, mailbox) => {
                if (error) {
                    this.emit("error", error, this.client);
                } else {
                    this.emit("connected", this.client);
                    this.emit("mailbox", mailbox, this.client);
                    this.readMails.call(this);
                    this.setFolder();
                }
            });
        }
    }

    getStatus(folder) {
        this.imap.status(folder, (err, mailbox) => {
            if (err) {
                this.emit("error", err, this.client);
            } else {
                this.emit("status", mailbox, this.client);
            }
        });
    }

    onExpunge(seqno) {
        this.emit("expunge", seqno, this.client);
    }

    onUidvalidity(uidvalidity) {
        this.emit("uidvalidity", uidvalidity, this.client);
    }

    onAlert(message) {
        this.emit("alert", message, this.client);
    }

    onUpdate(seqno, info) {
        const isRange = this.all_seqno.findIndex((number) => number == seqno);
        if (isRange != -1 && (isRange < this.max || isRange == this.max)) {
            this.emit("update", "Start Update", seqno, info, this.client);
            this.readMails.call(this);
        } else {
            this.emit("update", "No Update", seqno, info, this.client);
        }
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
        //this.imap.sort(["DATE"], this.flag, async (error, results) => {
        this.imap.search(this.flag, async (error, results) => {
            if (error) {
                this.emit("error", error, this.client);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                this.emit("seqno", results, this.client);
                this.all_seqno = [];
                results.reverse();
                for (const result of results) {
                    if (count > this.max) break;
                    this.all_seqno.push(result);
                    await this.findmail(result, count, all);
                    ++count;
                }
            } else {
                this.emit("info", "Mailbox is empty", this.client);
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
                        if (mail && mail.attachments && mail.attachments.length > 0) {
                            mail.attachments = mail.attachments.length;
                        } else {
                            mail.attachments = 0;
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

    readAllMails(result, obj, count) {
        const all_mails = [];
        const mails = {};
        let counter = 0;
        return new Promise((resolve) => {
            try {
                const f = this.imap.fetch(result, {
                    bodies: "",
                    ...obj.message.bodie,
                });
                f.on("message", (msg, seqno) => {
                    let attrs;
                    msg.on("attributes", (att) => {
                        attrs = att;
                    });
                    msg.on("body", async (stream, info) => {
                        if (obj.message.parse) {
                            mails["body"] = await simpleParser(stream);
                        } else {
                            mails["body"] = stream;
                        }
                        mails["seqno"] = seqno;
                        mails["attrs"] = attrs;
                        mails["info"] = info;
                        mails["user"] = this.client;
                        ++counter;
                        all_mails.push(mails);
                        if (count == counter) {
                            resolve(all_mails);
                        }
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

    set_move(uid, box) {
        this.imap.move(uid, box, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: move success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_copy(uid, box) {
        this.imap.copy(uid, box, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: copy success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_addFlags(uid, flag) {
        this.imap.addFlags(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: addFlags success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_delFlags(uid, flag) {
        this.imap.delFlags(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: delFlags success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_setFlags(uid, flag) {
        this.imap.setFlags(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: setFlags success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    checkSupport() {
        return this.imap.serverSupports;
    }

    set_setKeywords(uid, flag) {
        this.imap.setKeywords(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: setKeywords success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_delKeywords(uid, flag) {
        this.imap.delKeywords(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: delKeywords success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    set_addKeywords(uid, flag) {
        this.imap.addKeywords(uid, flag, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${uid}: addKeywords success`, this.client);
                this.readMails.call(this);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }
}

module.exports.MailListener = MailListener;
