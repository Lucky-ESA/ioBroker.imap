"use strict";

const Imap = require("./Connection.js");
//const Imap = require("node-imap");
const EventEmitter = require("events").EventEmitter;
const simpleParser = require("mailparser").simpleParser;
//const MONTHS = [
//    "Jan",
//    "Feb",
//    "Mar",
//    "Apr",
//    "May",
//    "Jun",
//    "Jul",
//    "Aug",
//    "Sep",
//    "Oct",
//    "Nov",
//    "Dec",
//];

class MailListener extends EventEmitter {
    /**
     * @param {object} options
     * @param {object} loggen loglevel from iobroker
     */
    constructor(options, loggen) {
        super();
        this.logs = loggen;
        try {
            this.flag = JSON.parse(options.flag);
        } catch (e) {
            this.flag = ["ALL"];
        }
        this.seen = { markSeen: false };
        this.mailbox = options.inbox || "INBOX";
        //this.dir = `${__dirname}/lib/attachment`;
        this.client = options.user;
        this.max = options.maxi_html > options.maxi ? options.maxi_html : options.maxi;
        let tlsoption = {};
        this.allMails = {};
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
            xoauth2: options.token,
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
            debug: this.logs.debug,
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
    }

    /**
     *
     */
    onReady() {
        this.getStatus(this.mailbox);
        this.imap.openBox(this.mailbox, false, async (error, mailbox) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                this.imap.on("alert", this.onAlert.bind(this));
                this.imap.on("update", this.onUpdate.bind(this));
                this.imap.on("mail", this.onMail.bind(this));
                this.imap.on("new", this.onNew.bind(this));
                //this.imap.on("type", this.onType.bind(this));
                this.imap.on("uidvalidity", this.onUidvalidity.bind(this));
                this.imap.on("expunge", this.onExpunge.bind(this));
                this.emit("connected", this.client);
                this.emit("mailbox", mailbox, this.client);
                await this.loadAllSeqno("INBOX");
                if (this.imap.serverSupports("SORT")) {
                    this.readMailsSort();
                } else {
                    this.readMails();
                }
                this.setFolder();
            }
        });
    }

    /**
     * @param {string} inbox device name
     * @param {boolean} [second=false]
     */
    loadAllSeqno(inbox, second) {
        return new Promise((resolve) => {
            this.imap.search(["ALL"], async (error, results) => {
                if (error) {
                    this.emit("error", error, this.client);
                    if (!second) this.allMails[inbox] = [];
                    resolve([]);
                }
                if (!second) this.allMails[inbox] = results;
                resolve(results);
            });
        });
    }

    /**
     *
     */
    loadUnseenSeqno() {
        return new Promise((resolve) => {
            this.imap.search(["UNSEEN"], async (error, results) => {
                if (error) {
                    this.emit("error", error, this.client);
                    resolve([]);
                }
                resolve(results);
            });
        });
    }

    /**
     *
     */
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

    /**
     * @param {string} mailboxname
     */
    subscribeBox(mailboxname) {
        this.imap.subscribeBox(mailboxname, (error) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                this.emit("log", "debug", "Subscribe", mailboxname, this.client);
            }
        });
    }

    /**
     * Start
     */
    start() {
        this.imap.connect();
    }

    /**
     * return all inbox folder
     */
    getFolder() {
        return this.folder;
    }

    /**
     * connection stop
     */
    stop() {
        this.imap.end();
    }

    /**
     * connection destroy
     */
    destroy() {
        this.imap.destroy();
    }

    /**
     * return disconnected, connected, authenticated
     */
    imap_state() {
        return this.imap.state;
    }

    /**
     * delimiter inboxfolder e.g. INBOX<delimiter>trash
     */
    imap_delimiter() {
        return this.imap.delimiter;
    }

    /**
     * Contains information (personal, ohter, shared)
     */
    imap_namespaces() {
        return this.imap.namespaces;
    }

    /**
     * start all reads
     */
    onNewRead() {
        if (this.imap.serverSupports("SORT")) {
            this.readMailsSort();
        } else {
            this.readMails();
        }
    }

    /**
     * Status current folder (total and unseen)
     */
    getStatus(folder) {
        this.imap.status(folder, (err, mailbox) => {
            if (err) {
                this.emit("error", err, this.client);
            } else {
                this.emit("status", mailbox, this.client);
            }
        });
    }

    /**
     * Event for delete or move
     * @param {number} seqno
     */
    onExpunge(seqno) {
        const isRange = this.all_seqno.findIndex((number) => number == seqno);
        if (isRange != -1 && (isRange < this.max || isRange == this.max)) {
            this.emit("expunge", "EMail deleted in scope", seqno, this.client);
            if (this.imap.serverSupports("SORT")) {
                this.readMailsSort();
            } else {
                this.readMails();
            }
        } else {
            this.emit("expunge", "EMail deleted", seqno, this.client);
        }
        this.setTotal();
    }

    /**
     * Event if UIDs in this mailbox have changed since the last time this mailbox was opened.
     * @param {number} uidvalidity
     */
    onUidvalidity(uidvalidity) {
        this.emit("uidvalidity", uidvalidity, this.client);
    }

    /**
     * Event with value total, new, unseen
     * @param {object} message
     */
    onAlert(message) {
        this.emit("alert", message, this.client);
    }

    /**
     * Event when message metadata (e.g. flags) changes externally
     * @param {number} seqno
     * @param {object} info
     */
    onUpdate(seqno, info) {
        const isRange = this.all_seqno.findIndex((number) => number == seqno);
        if (isRange != -1 && (isRange < this.max || isRange == this.max)) {
            this.emit("update", "Start Update", seqno, info, this.client);
            this.updatemail(seqno, "update");
        } else {
            this.emit("update", "No Update", seqno, info, this.client);
        }
        this.setTotal();
    }

    /**
     * Read all uids from active mailbox
     * Return total and unread
     */
    async setTotal() {
        const unseen = await this.loadUnseenSeqno();
        let count_unseen = 0;
        let count_all = 0;
        try {
            count_unseen = unseen.length;
        } catch (e) {
            count_unseen = 0;
        }
        try {
            count_all = this.allMails[this.mailbox].length;
        } catch (e) {
            count_all = 0;
        }
        this.emit("total", count_all, count_unseen, this.client);
    }

    /**
     * Event when new mail arrives in the currently open mailbox
     * @param {number} seqno counter new mail
     * @param {object} box
     * @param {object} info
     */
    async onMail(seqno, box, info) {
        this.emit("mailevent", seqno, this.client);
        this.logs.debug(info.text);
        const new_mail = await this.loadAllSeqno("INBOX", true);
        let nextuid = this.diffArray(this.allMails["INBOX"], new_mail, 2);
        if (nextuid.length === 0) {
            nextuid = [box.uidnext];
        }
        if (this.imap.serverSupports("SORT")) {
            this.newMailsSort(nextuid, "new");
        } else {
            if (nextuid.length > 0) {
                this.newMails(nextuid, "new");
            } else {
                this.readMails();
            }
        }
        this.setTotal();
    }

    /**
     * Event when new mail arrives in the currently open mailbox
     * @param {object} box
     * @param {object} info
     */
    async onNew(box, info) {
        this.emit("newmail", box, info, this.client);
    }

    //async onType(box, info, curReq) {
    //    this.emit("type", box, info, curReq, this.client);
    //}

    /**
     * Capability request - Return true or false
     * @param {string} value
     */
    serverSupport(value) {
        return this.imap.serverSupports(value);
    }

    /**
     * Return all capabilities
     */
    serverAllSupport() {
        return this.imap.serverAllSupport();
    }

    /**
     * Return all limits
     */
    serverQuota() {
        this.imap.getQuotaRoot(this.mailbox, (error, info) => {
            if (error) {
                this.emit("error", error, this.client);
            } else {
                this.emit("quota", info, this.client);
            }
        });
        return false;
    }
    /**
     * Event when the connection has completely closed
     * @param {boolean|null|undefined} hadError
     */
    onClose(hadError) {
        this.emit("disconnected", hadError, this.client);
    }

    /**
     * Event when an error occurs
     * @param {string} err
     */
    onError(err) {
        if (err) {
            this.emit("error", err, this.client);
        }
    }

    /**
     * @param {object} seqno
     * @param {boolean} sort
     */
    updateseqno(seqno, sort) {
        if (sort) {
            this.all_seqno = seqno;
        } else {
            const isRange = this.all_seqno.findIndex((number) => number == seqno);
            if (isRange != -1) {
                this.all_seqno[isRange] = seqno;
            }
        }
    }

    /**
     * @param {string} search value from datapoint
     * @param {number} max
     */
    changesearch(search, max) {
        try {
            this.flag = JSON.parse(search);
        } catch (e) {
            this.flag = ["ALL"];
        }
        this.max = max;
        if (this.imap.serverSupports("SORT")) {
            this.readMailsSort();
        } else {
            this.readMails();
        }
    }

    /**
     * Arrival new Mail and capability SORT == true
     * @param {object} uid
     * @param {string} what new mail or update
     */
    newMailsSort(uid, what) {
        for (const uids of uid) {
            const f = this.imap.fetch(uids, {
                bodies: "",
                ...this.seen,
            });
            f.on("message", (msg, seqno) => {
                let attrs;
                this.all_seqno.pop();
                this.all_seqno.push(seqno);
                this.all_seqno.sort((a, b) => b - a);
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
                    this.emit("updatejson", mail, seqno, attrs, info, this.client, what);
                });
            });
            f.once("error", (error) => {
                if (error) {
                    this.emit("error", error, this.client);
                }
            });
        }
    }

    /**
     * Arrival new Mail and capability SORT == false -> Use nextuid
     * @param {object} uid
     * @param {string} what new mail or update
     */
    newMails(uid, what) {
        for (const uids of uid) {
            const f = this.imap.fetch(uids, {
                bodies: "",
                ...this.seen,
            });
            f.on("message", (msg, seqno) => {
                let attrs;
                this.all_seqno.pop();
                this.all_seqno.push(seqno);
                this.all_seqno.sort((a, b) => b - a);
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
                    this.emit("updatejson", mail, seqno, attrs, info, this.client, what);
                });
            });
            f.once("error", (error) => {
                if (error) {
                    this.emit("error", error, this.client);
                }
            });
        }
    }

    /**
     * @param {number} seq
     * @param {string} what new mail or update
     */
    updatemail(seq, what) {
        try {
            const f = this.imap.seq.fetch(seq, {
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
                    this.emit("updatejson", mail, seqno, attrs, info, this.client, what);
                });
            });
            f.once("error", (error) => {
                if (error) {
                    this.emit("error", error, this.client);
                }
            });
        } catch (error) {
            this.emit("error", error, this.client);
        }
    }

    /**
     * Read Mail with search criteria and capability SORT == true
     */
    readMailsSort() {
        //this.imap.sort(["DATE"], this.flag, async (error, results) => {
        this.imap.sort(["-ARRIVAL"], this.flag, async (error, results) => {
            if (error) {
                this.emit("error", error, this.client);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                this.emit("seqno", results, this.client);
                this.all_seqno = [];
                results.sort((a, b) => b - a);
                for (const result of results) {
                    if (count > this.max) break;
                    await this.findmail(result, count, all, true);
                    ++count;
                }
            } else {
                this.emit("info", "Mailbox is empty", this.client);
            }
        });
    }

    /**
     * Read Mail with search criteria and capability SORT == false
     */
    readMails() {
        //const date = new Date();
        //const last_date = new Date(date.setMonth(date.getMonth() - 2));
        //const month = ("0" + last_date.getDate()).slice(-2);
        //const searching = [
        //    this.flag[0],
        //    ["SINCE", MONTHS[last_date.getMonth()] + " " + month + ", " + last_date.getFullYear()],
        //];
        this.imap.search(this.flag, async (error, results) => {
            if (error) {
                this.emit("error", error, this.client);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                this.emit("seqno", results, this.client);
                this.all_seqno = [];
                results.sort((a, b) => b - a);
                //results.reverse();
                for (const result of results) {
                    if (count > this.max) break;
                    await this.findmail(result, count, all, false);
                    ++count;
                }
            } else {
                this.emit("info", "Mailbox is empty", this.client);
            }
        });
    }

    /**
     * @param {number} result
     * @param {number} counter
     * @param {number} all
     * @param {boolean} sort
     */
    async findmail(result, counter, all, sort) {
        return new Promise((resolve) => {
            try {
                const f = this.imap.fetch(result, {
                    bodies: "",
                    ...this.seen,
                });
                f.on("message", (msg, seqno) => {
                    let attrs;
                    this.all_seqno.push(seqno);
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
                        this.emit("mail", mail, seqno, attrs, info, this.client, counter, all, sort);
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

    /**
     * set, add, del: Flags, Labels, Keyword, move or copy
     * @param {string} event
     * @param {number|object} uid
     * @param {string} box
     */
    change_events(event, uid, box) {
        this.imap[event](uid, box, (err) => {
            if (!err) {
                this.emit("log", "info", "SetFlag", `${JSON.stringify(uid)}: ${event} success`, this.client);
            } else {
                this.emit("error", err, this.client);
            }
        });
    }

    /**
     * @param {string} folder
     */
    changeFolder(folder) {
        if (folder == this.mailbox) return;
        if (folder && folder != "") {
            this.mailbox = folder;
            this.getStatus(folder);
            this.imap.openBox(folder, false, async (error, mailbox) => {
                if (error) {
                    this.emit("error", error, this.client);
                } else {
                    this.emit("mailbox", mailbox, this.client);
                    await this.loadAllSeqno(this.mailbox);
                    if (this.imap.serverSupports("SORT")) {
                        this.readMailsSort();
                    } else {
                        this.readMails();
                    }
                }
            });
        } else {
            this.getStatus(this.mailbox);
            this.imap.openBox(this.mailbox, false, async (error, mailbox) => {
                if (error) {
                    this.emit("error", error, this.client);
                } else {
                    this.emit("connected", this.client);
                    this.emit("mailbox", mailbox, this.client);
                    await this.loadAllSeqno(this.mailbox);
                    if (this.imap.serverSupports("SORT")) {
                        this.readMailsSort();
                    } else {
                        this.readMails();
                    }
                }
            });
        }
    }

    /**
     * Blockly Call
     * @param {object} obj
     */
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
                    results.sort((a, b) => b - a);
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

    /**
     * Blockly Call from message event
     * @param {number|object} read_mail
     * @param {object} obj
     * @param {number} count
     */
    async startReadMails(read_mail, obj, count) {
        if (read_mail != null) {
            const result = await this.readAllMails(read_mail, obj, count);
            this.emit("sendTo", obj, result, this.client);
        } else {
            this.emit("sendToError", obj, "Cannot found Mails", this.client);
        }
    }

    /**
     * @param {number|object} result
     * @param {object} obj
     * @param {number} count
     */
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

    /**
     * @param {object} arr1
     * @param {object} arr2
     * @param {number} [from=0]
     */
    diffArray(arr1, arr2, from) {
        const diff = (a, b) => a.filter((item) => b.indexOf(item) === -1);
        if (from === 1) {
            return diff(arr1, arr2);
        }
        if (from === 2) {
            return diff(arr2, arr1);
        }
        const diff1 = diff(arr1, arr2);
        const diff2 = diff(arr2, arr1);
        return [].concat(diff1, diff2);
    }
}

module.exports.MailListener = MailListener;
