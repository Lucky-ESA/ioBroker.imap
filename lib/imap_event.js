const simpleParser = require("mailparser").simpleParser;
const limited_reconnect = 5;
module.exports = {
    /**
     * @param {string} box folder inbox
     * @param {string} client client id
     */
    async onReadyImap(box, client) {
        this.getStatus(box, client);
        this.clients[client].openBox(box, false, async (error, mailbox) => {
            if (error) {
                this.log_translator("error", "Error", client, error);
                this.setCounterHistory(client, Object.keys(this.countOnline).length, error);
            } else {
                this.setBinds(client);
                if (this.reconnect_count[client] === 0) {
                    this.log_translator("info", "connection", client);
                }
                this.countOnline[client] = true;
                this.setState("info.connection", true, true);
                this.setCounterHistory(client, Object.keys(this.countOnline).length, this.helper_translator("Online"));
                this.reconnect_count[client] = 0;
                this.setState(`${client}.online`, {
                    val: true,
                    ack: true,
                });
                this.log_translator("debug", "mailbox", `${client} - ${JSON.stringify(mailbox)}`);
                this.setState(`${client}.total`, {
                    val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                    ack: true,
                });
                this.setState(`${client}.status`, {
                    val: JSON.stringify(mailbox),
                    ack: true,
                });
                await this.loadAllSeqno(client, "INBOX");
                if (this.clients[client].serverSupports("SORT")) {
                    this.readMailsSort(client);
                } else {
                    this.readMails(client);
                }
                this.setFolder(client);
            }
        });
    },
    /**
     * Read Mail with search criteria and capability SORT == true
     * @param {string} client client id
     */
    readMailsSort(client) {
        //this.clients[client].sort(["DATE"], this.flag, async (error, results) => {
        this.clients[client].sort(["-ARRIVAL"], this.clientsRaw[client].flag, async (error, results) => {
            if (error) {
                this.log_translator("error", "Error", client, error);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                this.save_seqno[client] = results;
                this.all_seqno[client] = [];
                results.sort((a, b) => b - a);
                for (const result of results) {
                    if (count > this.clientsRaw[client].max) break;
                    if (this.clientsRaw[client].att) {
                        await this.findmail(client, result, count, all, true);
                    } else {
                        await this.findmail_wo_att(client, result, count, all, true);
                    }
                    ++count;
                }
            } else {
                this.readinfo("Mailbox is empty", client);
            }
        });
    },
    /**
     * Read Mail with search criteria and capability SORT == false
     * @param {string} client client id
     */
    readMails(client) {
        //const date = new Date();
        //const last_date = new Date(date.setMonth(date.getMonth() - 2));
        //const month = ("0" + last_date.getDate()).slice(-2);
        //const searching = [
        //    this.flag[0],
        //    ["SINCE", MONTHS[last_date.getMonth()] + " " + month + ", " + last_date.getFullYear()],
        //];
        this.clients[client].search(this.clientsRaw[client].flag, async (error, results) => {
            if (error) {
                this.log_translator("error", "Error", client, error);
            } else if (results.length > 0) {
                const all = results.length;
                let count = 1;
                this.save_seqno[client] = results;
                this.all_seqno[client] = [];
                results.sort((a, b) => b - a);
                for (const result of results) {
                    if (count > this.clientsRaw[client].max) break;
                    if (this.clientsRaw[client].att) {
                        await this.findmail(client, result, count, all, false);
                    } else {
                        await this.findmail_wo_att(client, result, count, all, false);
                    }
                    ++count;
                }
            } else {
                this.readinfo("Mailbox is empty", this.client);
            }
        });
    },
    /**
     * @param {string} client client id
     * @param {number} result
     * @param {number} counter
     * @param {number} all
     * @param {boolean} sort
     */
    async findmail_wo_att(client, result, counter, all, sort) {
        return new Promise((resolve) => {
            try {
                let attrs;
                let header_mail;
                const f = this.clients[client].fetch(result, {
                    bodies: ["TEXT"],
                    struct: true,
                });
                f.on("message", (msg) => {
                    msg.once("attributes", (att) => {
                        attrs = att;
                    });
                    msg.on("body", async (stream) => {
                        header_mail = stream;
                        stream.resume();
                    });
                });
                f.once("end", async () => {
                    let bodies;
                    const all_att = await this.updateattachments(attrs);
                    if (all_att.attach > 0) {
                        bodies = ["HEADER.FIELDS (FROM TO SUBJECT DATE)"];
                    } else {
                        bodies = "";
                    }
                    const e = this.clients[client].fetch(result, {
                        bodies: bodies,
                    });
                    e.on("message", (next_msg, seqno) => {
                        let new_attrs;
                        next_msg.once("attributes", (att) => {
                            new_attrs = att;
                        });
                        next_msg.on("body", async (stream, info) => {
                            let mail;
                            try {
                                mail = await simpleParser(stream, this.clientsRaw[client].node_option);
                            } catch (e) {
                                mail = this.current_date(client);
                            }
                            const att = {
                                ...new_attrs,
                                ...attrs,
                            };
                            if (all_att.attach > 0) {
                                let mail_header;
                                try {
                                    mail_header = await simpleParser(header_mail, this.clientsRaw[client].node_option);
                                } catch (e) {
                                    header_mail = this.current_date(client);
                                }
                                mail.text = mail_header.text != null ? mail_header.text : "";
                                mail.html = mail_header.html != null ? mail_header.html : "";
                                mail.textAsHtml = mail_header.textAsHtml != null ? mail_header.textAsHtml : "";
                            }
                            mail.attachments = all_att.attach;
                            mail.attachments_info = all_att.attach_info;
                            if (mail.headerLines) mail.headerLines = [];
                            this.setMail(mail, seqno, att, info, client, counter, all, sort);
                            stream.resume();
                            resolve(true);
                        });
                    });
                    e.once("error", (error) => {
                        if (error) {
                            this.log_translator("error", "Error", client, error);
                        }
                        resolve(false);
                    });
                });
                f.once("error", (error) => {
                    if (error) {
                        this.log_translator("error", "Error", client, error);
                    }
                    resolve(false);
                });
            } catch (error) {
                this.log_translator("error", "Error", client, error);
                resolve(false);
            }
        });
    },
    /**
     * @param {string} client client id
     * @param {number} result
     * @param {number} counter
     * @param {number} all
     * @param {boolean} sort
     */
    async findmail(client, result, counter, all, sort) {
        return new Promise((resolve) => {
            try {
                const f = this.clients[client].fetch(result, {
                    bodies: "",
                    ...this.seen,
                });
                f.on("message", (msg, seqno) => {
                    let attrs;
                    this.all_seqno[client].push(seqno);
                    msg.on("attributes", (att) => {
                        attrs = att;
                    });
                    msg.on("body", async (stream, info) => {
                        let mail;
                        try {
                            mail = await simpleParser(stream, this.clientsRaw[client].node_option);
                        } catch (e) {
                            mail = this.current_date(client);
                        }
                        const all_att = await this.updateattachments(attrs);
                        mail.attachments = all_att.attach;
                        mail.attachments_info = all_att.attach_info;
                        if (mail.headerLines) mail.headerLines = [];
                        this.setMail(mail, seqno, attrs, info, client, counter, all, sort);
                        stream.resume();
                        resolve(true);
                    });
                });
                f.once("error", (error) => {
                    if (error) {
                        this.log_translator("error", "Error", client, error);
                    }
                    resolve(false);
                });
            } catch (error) {
                this.log_translator("error", "Error", client, error);
                resolve(false);
            }
        });
    },
    /**
     * @param {string} client client id
     */
    setFolder(client) {
        this.clients[client].getBoxes((error, boxes) => {
            if (error) {
                this.log_translator("error", "Error", client, error);
            } else {
                const folder = [];
                for (const key in boxes) {
                    if (key != "[Gmail]" && key != "[Google Mail]") {
                        folder.push(key);
                    }
                    if (boxes[key].children) {
                        for (const keys in boxes[key].children) {
                            const foldername = `${key}${boxes[key].delimiter}${keys}`;
                            folder.push(foldername);
                            this.subscribeBox(foldername, client);
                        }
                    }
                }
                this.createinbox(client, folder);
                if (Object.keys(this.boxfolder[client]).length === 0) {
                    this.log_translator("info", "INBOXFOLDER", client);
                }
                this.boxfolder[client] = folder;
            }
        });
    },
    /**
     * @param {string} mailboxname
     * @param {string} client client id
     */
    subscribeBox(mailboxname, client) {
        this.clients[client].subscribeBox(mailboxname, (error) => {
            if (error) {
                this.log_translator("error", "Error", client, error);
            } else {
                this.log_translator("debug", "Subscribe", mailboxname, client);
            }
        });
    },
    /**
     * Event for delete or move
     * @param {number} seqno
     * @param {string} client client id
     */
    onExpunge(seqno, client) {
        const isRange = this.all_seqno[client].findIndex((number) => number == seqno);
        if (isRange != -1 && (isRange < this.clientsRaw[client].max || isRange == this.clientsRaw[client].max)) {
            this.log_translator("info", "EMail deleted in scope", client, seqno);
            this.clientsRaw[client].isonExpunge = true;
        } else {
            this.log_translator("info", "EMail deleted", client, seqno);
        }
        this.clientsRaw[client].seqonExpunge.push(seqno);
        if (this.clientsRaw[client].onExpungeTimer) {
            this.clearTimeout(this.clientsRaw[client].onExpungeTimer);
            this.clientsRaw[client].onExpungeTimer = null;
            ++this.clientsRaw[client].onExpunge;
        }
        this.clientsRaw[client].onExpungeTimer = this.setTimeout(() => {
            if (this.clientsRaw[client].onExpunge > 1) {
                if (this.clientsRaw[client].isonExpunge) {
                    if (this.clients[client].serverSupports("SORT")) {
                        this.readMailsSort(client);
                    } else {
                        this.readMails(client);
                    }
                }
                this.setUpdate(client, { seqno: this.clientsRaw[client].seqonExpunge }, "move_copy");
            } else {
                if (this.clientsRaw[client].isonExpunge) {
                    if (this.clients[client].serverSupports("SORT")) {
                        this.readMailsSort(client);
                    } else {
                        this.readMails(client);
                    }
                    this.setUpdate(client, { seqno: seqno }, "move_copy");
                }
            }
            this.clientsRaw[client].seqonExpunge = [];
            this.setTotal(client, this.clientsRaw[client].inbox_activ);
            this.clientsRaw[client].onExpunge = 0;
            this.clientsRaw[client].isonExpunge = false;
        }, 1000);
    },
    /**
     * Event if UIDs in this mailbox have changed since the last time this mailbox was opened.
     * @param {number} uidvalidity
     * @param {string} client client id
     */
    onUidvalidity(uidvalidity, client) {
        this.log_translator("info", "UID validity changes", client, uidvalidity);
    },
    /**
     * Event with value total, new, unseen
     * @param {object} message
     * @param {string} client client id
     */
    onAlert(message, client) {
        this.log_translator("info", "Alert", client, JSON.stringify(message));
    },
    /**
     * @param {boolean|null|undefined} error
     * @param {string} clientID client id
     */
    onCloseImap(error, clientID) {
        const err = !error ? "FALSE" : "TRUE";
        this.log_translator("debug", "disconnected", clientID, err);
        this.log_translator("debug", "Restart", clientID, 60);
        this.clients[clientID].end();
        this.clients[clientID] = null;
        if (this.reconnect_count[clientID] == limited_reconnect) {
            this.log_translator("warn", "Connection attempt", clientID);
        } else {
            this.restartIMAPConnection[clientID] = this.setTimeout(() => {
                this.log_translator("debug", "Restart now", clientID);
                this.imap_connection(this.clientsRaw[clientID]);
            }, 1000 * 60);
        }
        ++this.reconnect_count[clientID];
        this.countOnline[clientID] && delete this.countOnline[clientID];
        this.setCounterHistory(clientID, Object.keys(this.countOnline).length, this.helper_translator("Closed"));
        this.setState("info.connection", false, true);
        this.setState(`${clientID}.online`, {
            val: false,
            ack: true,
        });
    },
    /**
     * @param {string|object} err
     * @param {string} clientID client id
     */
    onErrorImap(err, clientID, where) {
        let level = "warn";
        try {
            if (JSON.stringify(err).indexOf("EPIPE") !== -1) {
                level = "debug";
            }
        } catch (e) {
            this.log_translator(level, "Error", clientID, `${err} - ${e} - ${where}`);
        }
        this.log_translator(level, "Error", clientID, `${err} - ${where}`);
        this.setCounterHistory(clientID, Object.keys(this.countOnline).length, `${err} - ${where}`);
    },
    /**
     * Status current folder (total and unseen)
     * @param {string} folder
     * @param {string} client client id
     */
    getStatus(folder, client) {
        this.clients[client].status(folder, (err, mailbox) => {
            if (err) {
                this.log_translator("error", "Error", client, err);
            } else {
                this.log_translator("debug", "Status eMail folder", client, JSON.stringify(mailbox));
                this.setState(`${client}.total`, {
                    val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                    ack: true,
                });
                this.setState(`${client}.total_unread`, {
                    val: mailbox.messages && mailbox.messages.unseen != null ? mailbox.messages.unseen : 0,
                    ack: true,
                });
            }
        });
    },
    /**
     * @param {string} client device id
     * @param {string} inbox folder name
     * @param {boolean} [second=false]
     */
    loadAllSeqno(client, inbox, second) {
        return new Promise((resolve) => {
            this.clients[client].search(["ALL"], async (error, results) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                    if (!second) this.clientsRaw[client][inbox] = [];
                    resolve([]);
                }
                if (!second) this.clientsRaw[client][inbox] = results;
                resolve(results);
            });
        });
    },
    /**
     * Read all uids from active mailbox
     * Return total and unread
     * @param {string} client device id
     * @param {string} inbox folder name
     */
    async setTotal(client, inbox) {
        const unseen = await this.loadUnseenSeqno(client);
        let count_unseen = 0;
        let count_all = 0;
        try {
            count_unseen = unseen.length;
        } catch (e) {
            count_unseen = 0;
        }
        try {
            count_all = this.clientsRaw[client][inbox].length;
        } catch (e) {
            count_all = 0;
        }
        await this.setStateAsync(`${client}.total`, {
            val: count_all,
            ack: true,
        });
        await this.setStateAsync(`${client}.total_unread`, {
            val: count_unseen,
            ack: true,
        });
    },
    /**
     * Event when new mail arrives in the currently open mailbox
     * @param {object} box
     * @param {object} info
     * @param {object} curReq
     * @param {string} client device id
     */
    onType(box, info, curReq, client) {
        this.log_translator(
            "debug",
            "Type",
            `${client} - ${JSON.stringify(curReq.fullcmd)}`,
            JSON.stringify(box),
            JSON.stringify(info),
        );
    },
    /**
     * Event when new mail arrives in the currently open mailbox
     * @param {object} box
     * @param {object} info
     * @param {string} client device id
     */
    async onNew(box, info, state, client) {
        this.log_translator("debug", "Type recent", client, JSON.stringify(box), `${JSON.stringify(info)} - ${state}`);
    },
    /**
     * Event when new mail arrives in the currently open mailbox
     * @param {number} count counter new mail
     * @param {object} box
     * @param {object} info
     * @param {string} client device id
     */
    async onMail(count, box, info, client) {
        if (count === 1) {
            this.log_translator("info", "Start new Mail", count, client);
        } else {
            this.log_translator("info", "Start new Mails", count, client);
        }
        this.setUpdate(client, { flags: [], new_mail: count }, "new mail");
        const inbox = this.clientsRaw[client].inbox_activ;
        const new_mail = await this.loadAllSeqno(client, inbox, true);
        let nextuid = this.diffArray(this.clientsRaw[client][inbox], new_mail, 2, client);
        this.clientsRaw[client][inbox] = new_mail;
        if (nextuid.length === 0) {
            nextuid = [box.uidnext];
        }
        if (this.clients[client].serverSupports("SORT")) {
            this.newMails(client, nextuid, "new", true);
        } else {
            if (nextuid.length > 0) {
                this.newMails(client, nextuid, "new", false);
            } else {
                this.readMails(client);
            }
        }
        this.setTotal(client, this.clientsRaw[client].inbox_activ);
    },
    /**
     * @param {string} client device id
     */
    changesearch(client) {
        if (this.clients[client].serverSupports("SORT")) {
            this.readMailsSort(client);
        } else {
            this.readMails(client);
        }
    },
    /**
     * Arrival new Mail and capability SORT == false -> Use nextuid
     * Arrival new Mail and capability SORT == true
     * @param {string} client device id
     * @param {object} uid
     * @param {string} what new mail or update
     * @param {boolean} sort Implementation in the next release
     */
    newMails(client, uid, what, sort) {
        this.log.debug(sort);
        this.log.info(JSON.stringify(uid));
        for (const uids of uid) {
            let attrs;
            let header_mail;
            const f = this.clients[client].fetch(uids, {
                bodies: ["TEXT"],
                struct: true,
            });
            f.on("message", (msg) => {
                msg.once("attributes", (att) => {
                    attrs = att;
                });
                msg.on("body", async (stream) => {
                    header_mail = stream;
                    stream.resume();
                });
            });
            f.once("end", async () => {
                let bodies;
                const all_att = await this.updateattachments(attrs);
                if (all_att.attach > 0 && !this.clientsRaw[client].att) {
                    bodies = ["HEADER.FIELDS (FROM TO SUBJECT DATE)"];
                } else {
                    bodies = "";
                }
                const e = this.clients[client].fetch(uids, {
                    bodies: bodies,
                });
                e.on("message", (next_msg, seqno) => {
                    this.all_seqno[client].pop();
                    this.all_seqno[client].push(seqno);
                    this.all_seqno[client].sort((a, b) => b - a);
                    let new_attrs;
                    next_msg.once("attributes", (att) => {
                        new_attrs = att;
                    });
                    next_msg.on("body", async (stream, info) => {
                        let mail;
                        try {
                            mail = await simpleParser(stream, this.clientsRaw[client].node_option);
                        } catch (e) {
                            mail = this.current_date(client);
                        }
                        const att = {
                            ...new_attrs,
                            ...attrs,
                        };
                        if (all_att.attach > 0 && !this.clientsRaw[client].att) {
                            let mail_header;
                            try {
                                mail_header = await simpleParser(header_mail, this.clientsRaw[client].node_option);
                            } catch (e) {
                                mail_header = this.current_date(client);
                            }
                            mail.text = mail_header.text;
                            mail.html = mail_header.html;
                            mail.textAsHtml = mail_header.textAsHtml;
                        }
                        mail.attachments = all_att.attach;
                        mail.attachments_info = all_att.attach_info;
                        if (mail.headerLines) mail.headerLines = [];
                        this.updatejson(mail, seqno, att, info, client, what);
                        stream.resume();
                    });
                });
                e.once("error", (error) => {
                    if (error) {
                        this.log_translator("error", "Error", client, error);
                    }
                });
            });
            f.once("error", (error) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                }
            });
        }
    },
    /**
     * @param {object} arr1
     * @param {object} arr2
     * @param {number} [from=0]
     * @param {string} [client=""]
     */
    diffArray(arr1, arr2, from, client) {
        try {
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
        } catch (e) {
            this.log_translator(
                "warn",
                "Error",
                client,
                `${JSON.stringify(arr1)} - ${JSON.stringify(arr2)} - ${JSON.stringify(from)}`,
            );
            return 0;
        }
    },
    /**
     * @param {string} client device id
     * @param {object} seqno
     * @param {boolean} sort
     */
    updateseqno(client, seqno, sort) {
        if (sort) {
            this.all_seqno[client] = seqno;
        } else {
            const isRange = this.all_seqno[client].findIndex((number) => number == seqno);
            if (isRange != -1) {
                this.all_seqno[client][isRange] = seqno;
            }
        }
    },
    /**
     * Event when message metadata (e.g. flags) changes externally
     * @param {number} seqno
     * @param {object} info
     * @param {string} client device id
     */
    onUpdate(seqno, info, client) {
        const isRange = this.all_seqno[client].findIndex((number) => number == seqno);
        if (isRange != -1 && (isRange < this.clientsRaw[client].max || isRange == this.clientsRaw[client].max)) {
            this.log_translator("info", "Start Update", seqno, client, JSON.stringify(info));
            info["seqno"] = seqno;
            this.setUpdate(client, info, "update");
            this.updatemail(client, seqno, "update");
        } else {
            this.log_translator("info", "No Update", seqno, client, JSON.stringify(info));
        }
        this.setTotal(client, this.clientsRaw[client].inbox_activ);
    },
    /**
     * @param {object} attrs
     */
    async updateattachments(attrs) {
        return new Promise((resolve) => {
            const all_att = [];
            let counter_att = 0;
            if (attrs && attrs.struct) {
                for (const att of attrs.struct) {
                    if (Array.isArray(att)) {
                        for (const atts of att) {
                            if (
                                atts.disposition &&
                                atts.disposition.type &&
                                atts.disposition.params &&
                                atts.disposition.params.filename
                            ) {
                                const att_data = {
                                    partID: 0,
                                    id: null,
                                    uid: 0,
                                    size: 0,
                                    filename: "",
                                    type: "",
                                    encoding: "",
                                };
                                att_data.partID = atts.partID != null ? atts.partID : 0;
                                att_data.id = atts.id != null ? atts.id : null;
                                att_data.uid = attrs.uid != null ? attrs.uid : 0;
                                att_data.filename =
                                    atts.disposition.params.filename != null
                                        ? atts.disposition.params.filename
                                        : this.helper_translator("Unknown");
                                att_data.type =
                                    atts.disposition.type != null
                                        ? atts.disposition.type
                                        : this.helper_translator("Unknown");
                                att_data.encoding = atts.encoding != null ? atts.encoding : 0;
                                if (atts.disposition && atts.disposition.params && atts.disposition.params.size) {
                                    att_data.size = atts.disposition.params.size;
                                } else {
                                    att_data.size = atts.size != null ? atts.size : 0;
                                }
                                all_att.push(att_data);
                                ++counter_att;
                            }
                        }
                    }
                }
                resolve({
                    attach: counter_att,
                    attach_info: all_att,
                });
            }
        });
    },
    /**
     * @param {string} client device id
     * @param {number} seq
     * @param {string} what new mail or update
     */
    updatemail(client, seq, what) {
        try {
            let attrs;
            let header_mail;
            const f = this.clients[client].seq.fetch(seq, {
                bodies: ["TEXT"],
                struct: true,
            });
            f.on("message", (msg) => {
                msg.once("attributes", (att) => {
                    attrs = att;
                });
                msg.on("body", async (stream) => {
                    header_mail = stream;
                    stream.resume();
                });
            });
            f.once("end", async () => {
                let bodies;
                const all_att = await this.updateattachments(attrs);
                if (all_att.attach > 0 && !this.clientsRaw[client].att) {
                    bodies = ["HEADER.FIELDS (FROM TO SUBJECT DATE)"];
                } else {
                    bodies = "";
                }
                const e = this.clients[client].seq.fetch(seq, {
                    bodies: bodies,
                });
                e.on("message", (next_msg, seqno) => {
                    let new_attrs;
                    next_msg.once("attributes", (att) => {
                        new_attrs = att;
                    });
                    next_msg.on("body", async (stream, info) => {
                        let mail;
                        try {
                            mail = await simpleParser(stream, this.clientsRaw[client].node_option);
                        } catch (e) {
                            mail = this.current_date(client);
                        }
                        const att = {
                            ...new_attrs,
                            ...attrs,
                        };
                        if (all_att.attach > 0 && !this.clientsRaw[client].att) {
                            let mail_header;
                            try {
                                mail_header = await simpleParser(header_mail, this.clientsRaw[client].node_option);
                            } catch (e) {
                                mail_header = this.current_date(client);
                            }
                            mail.text = mail_header.text;
                            mail.html = mail_header.html;
                            mail.textAsHtml = mail_header.textAsHtml;
                        }
                        mail.attachments = all_att.attach;
                        mail.attachments_info = all_att.attach_info;
                        if (mail.headerLines) mail.headerLines = [];
                        this.updatejson(mail, seqno, att, info, client, what);
                        stream.resume();
                    });
                });
                e.once("error", (error) => {
                    if (error) {
                        this.log_translator("error", "Error", client, error);
                    }
                });
            });
            f.once("error", (error) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                }
            });
        } catch (error) {
            this.log_translator("error", "Error", client, error);
        }
    },
    /**
     * set, add, del: Flags, Labels, Keyword, move or copy
     * @param {string} client device id
     * @param {string} event
     * @param {number|object} uid
     * @param {string|object} flags
     */
    change_events(client, event, uid, flags) {
        try {
            this.clients[client][event](uid, flags, (err) => {
                if (!err) {
                    this.log_translator(
                        "info",
                        "SetFlag",
                        `${JSON.stringify(flags)}: ${uid} - ${event} success`,
                        client,
                    );
                } else {
                    this.log_translator("error", "Error", client, err);
                }
            });
        } catch (e) {
            this.log_translator("error", "Error", client, `change_events - ${e}`);
        }
    },
    /**
     * @param {string} client device id
     * @param {any} folder
     */
    changeFolder(client, folder) {
        if (folder == this.clientsRaw[client].inbox_activ) return;
        if (folder && folder != "") {
            this.clientsRaw[client].inbox_activ = folder;
            this.getStatus(folder, client);
            this.clients[client].openBox(folder, false, async (error, mailbox) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                } else {
                    this.log_translator("debug", "mailbox", `${client} - ${JSON.stringify(mailbox)}`);
                    this.setState(`${client}.total`, {
                        val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                        ack: true,
                    });
                    this.setState(`${client}.status`, {
                        val: JSON.stringify(mailbox),
                        ack: true,
                    });
                    await this.loadAllSeqno(client, this.clientsRaw[client].inbox_activ);
                    if (this.clients[client].serverSupports("SORT")) {
                        this.readMailsSort(client);
                    } else {
                        this.readMails(client);
                    }
                }
            });
        } else {
            this.getStatus(this.clientsRaw[client].inbox_activ, client);
            this.clients[client].openBox(this.mailbox, false, async (error, mailbox) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                } else {
                    this.log_translator("debug", "mailbox", `${client} - ${JSON.stringify(mailbox)}`);
                    this.setState(`${client}.total`, {
                        val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                        ack: true,
                    });
                    this.setState(`${client}.status`, {
                        val: JSON.stringify(mailbox),
                        ack: true,
                    });
                    await this.loadAllSeqno(client, this.clientsRaw[client].inbox_activ);
                    if (this.clients[client].serverSupports("SORT")) {
                        this.readMailsSort(client);
                    } else {
                        this.readMails(client);
                    }
                }
            });
        }
    },
    /**
     *
     */
    loadUnseenSeqno(client) {
        return new Promise((resolve) => {
            this.clients[client].search(["UNSEEN"], async (error, results) => {
                if (error) {
                    this.emit("error", error, this.client);
                    resolve([]);
                }
                resolve(results);
            });
        });
    },
    /**
     * Blockly Call
     * @param {string} client device id
     * @param {object} obj
     */
    async custom_search(client, obj) {
        let read_mail = null;
        if (obj.message.fetch.fetch) {
            if (obj.message.fetch.uid != null) {
                read_mail = obj.message.fetch.uid;
                this.startReadMails(client, read_mail, obj, read_mail.length);
            } else if (obj.message.fetch.single != null) {
                read_mail = obj.message.fetch.single;
                this.startReadMails(client, read_mail, obj, read_mail.split(":")[1]);
            } else {
                this.log_translator("error", "Missing fetch", client);
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
                this.log_translator("error", "Error", client, e);
                this.sendTo(obj.from, obj.command, this.helper_translator("Error parse"), obj.callback);
                return;
            }
            await this.clients[client].search(flag, (error, results) => {
                if (error) {
                    this.log_translator("error", "Error", client, error);
                    this.sendTo(obj.from, obj.command, this.helper_translator("Error search"), obj.callback);
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
                    this.startReadMails(client, read_mail, obj, read_mail.length);
                } else {
                    this.sendTo(obj.from, obj.command, this.helper_translator("Mailbox is empty"), obj.callback);
                }
            });
        }
    },
    /**
     * Blockly Call from message event
     * @param {string} client device id
     * @param {number|object} read_mail
     * @param {object} obj
     * @param {number} count
     */
    async startReadMails(client, read_mail, obj, count) {
        if (read_mail != null) {
            const result = await this.readAllMails(client, read_mail, obj, count);
            this.log_translator("info", "BLOCKLY value", client);
            this.sendTo(obj.from, obj.command, result, obj.callback);
        } else {
            this.sendTo(obj.from, obj.command, this.helper_translator("Cannot found Mails"), obj.callback);
        }
    },
    /**
     * @param {string} client device id
     * @param {number|object} result
     * @param {object} obj
     * @param {number} count
     */
    readAllMails(client, result, obj, count) {
        const all_mails = [];
        let counter = 0;
        return new Promise((resolve) => {
            try {
                const f = this.clients[client].fetch(result, {
                    bodies: "",
                    ...obj.message.bodie,
                });
                f.on("message", (msg, seqno) => {
                    let attrs;
                    msg.on("attributes", (att) => {
                        attrs = att;
                    });
                    msg.on("body", async (stream, info) => {
                        const mails = {};
                        if (obj.message.parse) {
                            mails["body"] = await simpleParser(stream);
                        } else {
                            mails["body"] = stream;
                        }
                        mails["seqno"] = seqno;
                        mails["attrs"] = attrs;
                        mails["info"] = info;
                        mails["user"] = client;
                        ++counter;
                        all_mails.push(mails);
                        stream.resume();
                        if (count == counter) {
                            resolve(all_mails);
                        }
                    });
                });
                f.once("error", (error) => {
                    if (error) {
                        this.log_translator("error", "Error", client, error);
                    }
                    resolve(false);
                });
            } catch (error) {
                this.log_translator("error", "Error", client, error);
                resolve(false);
            }
        });
    },
};
