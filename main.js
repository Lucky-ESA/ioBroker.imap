"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
const { MailListener } = require("./lib/listener");
const helper = require("./lib/helper");
const tl = require("./lib/translator.js");
const format = require("util").format;
const { convert } = require("html-to-text");
const FORBIDDEN_CHARS = /[\][züäöÜÄÖ$@ß€*:.,;'"`<>\\\s?]/g;

class Imap extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "imap",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.on("message", this.onMessage.bind(this));
        this.createDataPoint = helper.createDataPoint;
        this.createHost = helper.createHost;
        this.createMails = helper.createMails;
        this.createRemote = helper.createRemote;
        this.createinbox = helper.createinbox;
        this.qualityInterval = null;
        this.statusInterval = null;
        this.sleepTimer = null;
        this.double_call = {};
        this.save_json = {};
        this.save_seqno = {};
        this.clients = {};
        this.clientsRaw = {};
        this.clientsHTML = {};
        this.clientsRows = {};
        this.restartIMAPConnection = {};
        this.clientsID = [];
        this.countOnline = 0;
        this.lang = "de";
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        const devices = {};
        if (Object.keys(this.config.hosts).length === 0) {
            this.log_translator("info", "No imap");
            return;
        }
        const isChange = await this.configcheck();
        if (isChange) {
            this.log_translator("info", "Adapter restart");
            return;
        }
        const obj = await this.getForeignObjectAsync("system.config");
        if (obj && obj.common && obj.common.language) {
            try {
                this.lang = obj.common.language === this.lang ? this.lang : obj.common.language;
            } catch (e) {
                this.log_translator("info", "try", `getForeignObjectAsync: ${e}`);
            }
        }
        devices["data"] = this.config.hosts;
        for (const dev of devices.data) {
            if (!dev.activ) {
                continue;
            }
            if (dev.inbox == "") {
                this.log_translator("info", "no inbox");
                continue;
            }
            if (dev.host == "") {
                this.log_translator("info", "no host");
                continue;
            }
            if (dev.port == "") {
                dev.port = 993;
                this.log_translator("info", "missing port");
            }
            if (dev.user == "") {
                this.log_translator("info", "missing username");
                continue;
            } else {
                dev["username"] = dev.user;
                dev.user = dev.user.replace(FORBIDDEN_CHARS, "_");
            }
            if (dev.password != "" && dev.password.match(/<LUCKY-ESA>/gi) != null) {
                dev.password = this.decrypt(dev.password.split("<LUCKY-ESA>")[1]);
            } else {
                this.log_translator("info", "missing password");
                continue;
            }
            this.clientsHTML[dev.user] = {};
            this.restartIMAPConnection[dev.user] = null;
            this.clientsRows[dev.user] = "";
            this.clients[dev.user] = null;
            this.clientsRaw[dev.user] = dev;
            this.save_json[dev.user] = [];
            this.save_seqno[dev.user] = [];
            this.clientsID.push(dev.user);
            this.log_translator("info", "create device", dev.user);
            await this.createHost(dev);
            this.log_translator("info", "check mailfolder", dev.user);
            await this.checkMailFolder(dev);
            this.log_translator("info", "create mails", dev.user);
            await this.createMails(dev);
            this.log_translator("info", "create remote", dev.user);
            await this.createRemote(dev);
            this.log_translator("info", "read html", dev.user);
            await this.readHTML(dev);
            await this.imap_connection(dev);
            this.subscribeStates(`${dev.user}.remote.*`);
            this.cleanupQuality();
        }
        this.log_translator("info", "IMAP check start");
        await this.checkDeviceFolder();
        this.qualityInterval = this.setInterval(() => {
            this.cleanupQuality();
        }, 60 * 60 * 24 * 1000);
        this.statusInterval = this.setInterval(() => {
            this.connectionCheck();
        }, 60 * 60 * 1000);
    }

    async connectionCheck() {
        for (const dev of this.clientsID) {
            if (this.clients[dev] != null) {
                const check = await this.clients[dev].imap_namespaces();
                this.log_translator("debug", "IMAP namespaces", dev, JSON.stringify(check));
                const deli = await this.clients[dev].imap_delimiter();
                this.log_translator("debug", "IMAP delimiter", dev, JSON.stringify(deli));
                const state = await this.clients[dev].imap_state();
                this.log_translator("debug", "IMAP connection", dev, state);
            } else {
                this.log_translator("info", "No connection", dev);
            }
        }
    }

    async readHTML(dev) {
        try {
            const all_dp = await this.getObjectListAsync({
                startkey: `${this.namespace}.${dev.user}.remote.html`,
                endkey: `${this.namespace}.${dev.user}.remote.html\u9999`,
            });
            for (const element of all_dp.rows) {
                if (element && element.value && element.value.type && element.value.type === "state") {
                    const last = element.id.split(".").pop();
                    const html = await this.getStateAsync(`${dev.user}.remote.html.${last}`);
                    if (last != undefined) {
                        this.clientsHTML[dev.user][last] = html?.val;
                    }
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `readHTML: ${e}`);
        }
    }

    async checkMailFolder(dev) {
        try {
            const all_dp = await this.getObjectListAsync({
                startkey: `${this.namespace}.${dev.user}.email`,
                endkey: `${this.namespace}.${dev.user}.email\u9999`,
            });
            let change = false;
            for (const element of all_dp.rows) {
                if (element && element.value && element.value.type && element.value.type === "folder") {
                    const last = element.id.split(".").pop();
                    if (last === "email") {
                        if (
                            element.value &&
                            element.value.native &&
                            element.value.native.id &&
                            dev.maxi < element.value.native.id
                        ) {
                            this.log_translator("debug", "Start Delete folder", element.id);
                            change = true;
                        } else {
                            this.log_translator("debug", "Stop Delete folder", element.id);
                            break;
                        }
                    } else if (change) {
                        if (
                            element.value &&
                            element.value.native &&
                            element.value.native.id &&
                            element.value.native.id > dev.maxi
                        ) {
                            this.log_translator("debug", "Delete folder", element.id);
                            await this.delObjectAsync(`${element.id}`, { recursive: true });
                        }
                    }
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `checkMailFolder: ${e}`);
        }
    }

    async checkDeviceFolder() {
        try {
            const devices = await this.getDevicesAsync();
            for (const element of devices) {
                if (this.clientsID.includes(element.common["desc"])) {
                    this.log_translator("debug", "Found data point", element["id"]);
                } else {
                    this.log_translator("debug", "Deleted data point", element["id"]);
                    await this.delObjectAsync(`${element["id"]}`, { recursive: true });
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `checkDeviceFolder: ${e}`);
        }
    }

    async configcheck() {
        try {
            let isdecode = false;
            // @ts-ignore
            const adapterconfigs = this.adapterConfig;
            if (adapterconfigs && adapterconfigs.native && adapterconfigs.native.hosts) {
                for (const pw of adapterconfigs.native.hosts) {
                    if (pw.password != "" && pw.password.match(/<LUCKY-ESA>/gi) === null) {
                        pw.password = `<LUCKY-ESA>${this.encrypt(pw.password)}`;
                        isdecode = true;
                    }
                }
            }
            if (isdecode) {
                this.log_translator("info", "Encrypt");
                if (adapterconfigs.native.hosts[0] === null) {
                    adapterconfigs.native.hosts = [];
                }
                this.updateConfig(adapterconfigs);
                return true;
            }
            return false;
        } catch (error) {
            this.log_translator("error", "try", `configcheck: ${error}`);
        }
    }

    async imap_connection(dev) {
        if (this.clients[dev.user] != null) {
            this.clients[dev.user].stop();
            this.clients[dev.user] = null;
        }
        this.restartIMAPConnection[dev.user] && this.clearTimeout(this.restartIMAPConnection[dev.user]);
        this.clients[dev.user] = new MailListener(dev, this.log.debug);
        this.clients[dev.user].start();
        this.clients[dev.user].on("connected", (clientID) => {
            this.log_translator("info", "connection", clientID);
            ++this.countOnline;
            if (this.countOnline === 1) {
                this.setStateAsync("info.connection", true, true);
            }
            this.setState(`${clientID}.online`, {
                val: true,
                ack: true,
            });
        });

        this.clients[dev.user].on("log", (level, text, info, clientID) => {
            this.log_translator(level, text, info, clientID);
        });

        this.clients[dev.user].on("sub", (folder, clientID) => {
            this.createinbox(clientID, folder);
            this.log_translator("info", "INBOXFOLDER", clientID);
        });

        this.clients[dev.user].on("update", (log, seqno, info, clientID) => {
            this.log_translator("info", log, clientID, JSON.stringify(info), seqno);
            info["seqno"] = seqno;
            this.setUpdate(clientID, info, "update");
        });

        this.clients[dev.user].on("status", (info, clientID) => {
            this.log_translator("debug", "Status eMail folder", clientID, JSON.stringify(info));
            this.setState(`${clientID}.total`, {
                val: info.messages && info.messages.total != null ? info.messages.total : 0,
                ack: true,
            });
            this.setState(`${clientID}.total_unread`, {
                val: info.messages && info.messages.unseen != null ? info.messages.unseen : 0,
                ack: true,
            });
        });

        this.clients[dev.user].on("mailevent", (seqno, clientID) => {
            this.log_translator("info", "Start new Mail", clientID, seqno);
            this.setUpdate(clientID, { flags: [], new_mail: seqno }, "new mail");
            this.setTotal(clientID, true, "total");
        });

        this.clients[dev.user].on("uidvalidity", (uidvalidity, clientID) => {
            this.log_translator("info", "UID validity changes", clientID, uidvalidity);
        });

        this.clients[dev.user].on("expunge", (seqno, clientID) => {
            this.log_translator("info", "EMail deleted", clientID, seqno);
            this.setTotal(clientID, false, "total");
        });

        this.clients[dev.user].on("seqno", (seqno, clientID) => {
            this.save_seqno[clientID] = seqno;
        });

        this.clients[dev.user].on("mailbox", (mailbox, clientID) => {
            this.log_translator("debug", "mailbox", `${clientID} - ${JSON.stringify(mailbox)}`);
            this.setState(`${clientID}.total`, {
                val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                ack: true,
            });
        });

        this.clients[dev.user].on("disconnected", (error, clientID) => {
            error = !error ? "FALSE" : "TRUE";
            this.log_translator("info", "disconnected", clientID, error);
            this.log_translator("info", "Restart", clientID, 60);
            this.clients[clientID].stop();
            this.clients[clientID] = null;
            this.restartIMAPConnection[clientID] = this.setTimeout(() => {
                this.log_translator("info", "Restart now", clientID);
                this.imap_connection(this.clientsRaw[clientID]);
            }, 1000 * 60);
            --this.countOnline;
            if (this.countOnline === 0) {
                this.setStateAsync("info.connection", true, true);
            }
            this.setState(`${clientID}.online`, {
                val: false,
                ack: true,
            });
        });

        this.clients[dev.user].on("info", (info, clientID) => {
            this.log_translator("info", "Info", clientID, tl.trans[info][this.lang]);
        });

        this.clients[dev.user].on("error", (err, clientID) => {
            this.log_translator("error", "Error", clientID, err);
        });

        this.clients[dev.user].on("sendTo", (obj, results, clientID) => {
            this.log_translator("info", "BLOCKLY value", clientID);
            this.sendTo(obj.from, obj.command, results, obj.callback);
        });

        this.clients[dev.user].on("sendToError", (obj, results) => {
            this.sendTo(obj.from, obj.command, this.helper_translator(results), obj.callback);
        });

        this.clients[dev.user].on("alert", (err, clientID) => {
            this.log_translator("info", "Alert", clientID, err);
        });
        this.clients[dev.user].on("mail", (mail, seqno, attrs, info, clientID, count, all) => {
            if (count < this.clientsRaw[clientID].maxi || this.clientsRaw[clientID].maxi == count) {
                this.setStatesValue(mail, seqno, clientID, count, attrs);
            }
            if (count < this.clientsRaw[clientID].maxi_html || this.clientsRaw[clientID].maxi_html == count) {
                this.createHTMLRows(mail, seqno, clientID, count, all, attrs);
            }
            this.log_translator(
                "debug",
                "Mail",
                clientID,
                `${JSON.stringify(mail)} Attributes: ${JSON.stringify(attrs)} Sequense: ${seqno} INFO: ${JSON.stringify(
                    info,
                )}`,
            );
            //this.log_translator("debug", "Attributes", clientID, JSON.stringify(attrs));
            //this.log_translator("debug", "Sequense", clientID, seqno);
            //this.log_translator("debug", "Info", clientID, JSON.stringify(info));
        });
    }

    async setTotal(clientID, event, dp) {
        const actual = await this.getStateAsync(`${clientID}.${dp}`);
        if (actual && actual["val"] != null) {
            let total = Number(actual["val"]);
            if (event) {
                ++total;
            } else {
                --total;
            }
            this.setState(`${clientID}.${dp}`, {
                val: total,
                ack: true,
            });
        }
    }

    async setUpdate(clientID, info, trans) {
        const activity = this.helper_translator(trans) != null ? this.helper_translator(trans) : "";
        await this.setStateAsync(`${clientID}.last_activity`, {
            val: activity,
            ack: true,
        });
        await this.setStateAsync(`${clientID}.last_activity_json`, {
            val: typeof info === "object" ? JSON.stringify(info) : JSON.stringify({ seqno: "0" }),
            ack: true,
        });
        await this.setStateAsync(`${clientID}.last_activity_timestamp`, {
            val: Date.now(),
            ack: true,
        });
    }

    async setStatesValue(mail, seqno, clientID, count, attrs) {
        try {
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.subject`, {
                val: mail.subject != null ? mail.subject : this.helper_translator("Unknown"),
                ack: true,
            });
            //const receive_date = mail.date.toISOString().replace("T", " ").replace(/\..+/, "");
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.receive`, {
                val: mail.date != null ? mail.date.toString() : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.content`, {
                val: mail.html != null && mail.html ? mail.html : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.text`, {
                val: mail.text != null ? mail.text : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.texthtml`, {
                val: mail.textAsHtml != null ? mail.textAsHtml : this.helper_translator("Unknown"),
                ack: true,
            });
            let add = [];
            if (mail.to && mail.to.value != null) {
                for (const address of mail.to.value) {
                    if (address.address != null) {
                        add.push(address.address);
                    }
                }
            }
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.to`, {
                val: JSON.stringify(add),
                ack: true,
            });
            add = [];
            if (mail.from && mail.from.value != null) {
                for (const address of mail.from.value) {
                    if (address.address != null) {
                        add.push(address.address);
                    }
                }
            }
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.from`, {
                val: JSON.stringify(add),
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.flag`, {
                val: attrs.flags != null ? JSON.stringify(attrs.flags) : "",
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.uid`, {
                val: attrs.uid != null ? attrs.uid : "",
                ack: true,
            });
            await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.seq`, {
                val: seqno != null ? seqno : "",
                ack: true,
            });
        } catch (e) {
            this.log_translator("error", "try", `setStatesValue: ${e}`);
        }
    }

    /**
     * @param {ioBroker.Message} obj
     */
    async onMessage(obj) {
        if (this.double_call[obj._id] != null) {
            return;
        }
        this.double_call[obj._id] = true;
        this.log_translator("debug", "Message", JSON.stringify(obj));
        let adapterconfigs = {};
        let _obj = {};
        try {
            // @ts-ignore
            adapterconfigs = this.adapterConfig;
            _obj = JSON.parse(JSON.stringify(obj));
        } catch (error) {
            this.log_translator("error", "catch", `onMessage: ${error}`);
            this.sendTo(obj.from, obj.command, [], obj.callback);
            delete this.double_call[obj._id];
            return;
        }
        let icon_array = [];
        const icons = [];
        switch (obj.command) {
            case "getIconList":
                if (obj.callback) {
                    try {
                        if (_obj && _obj.message && _obj.message.icon && _obj.message.icon.icons) {
                            icon_array = _obj.message.icon.icons;
                        } else if (adapterconfigs && adapterconfigs.native && adapterconfigs.native.icons) {
                            icon_array = adapterconfigs.native.icons;
                        }
                        if (icon_array && Object.keys(icon_array).length > 0) {
                            for (const icon of icon_array) {
                                const label = icon.iconname;
                                icons.push({ label: label, value: icon.picture });
                            }
                            icons.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));
                            this.sendTo(obj.from, obj.command, icons, obj.callback);
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    } catch (error) {
                        delete this.double_call[obj._id];
                        this.log_translator("error", "catch", `onMessage: ${error}`);
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                }
                delete this.double_call[obj._id];
                break;
            case "getBlockly":
                if (
                    obj.message &&
                    obj.message["search"] != "" &&
                    obj.message["device"] != "" &&
                    obj.message["max"] > 0 &&
                    obj.message["max"] < 100
                ) {
                    if (obj.message["device"] === "all") {
                        for (const dev in this.clientsRaw) {
                            const userdev = this.clientsRaw[dev];
                            if (userdev.activ) {
                                this.setStateSearch(userdev.user, obj.message["search"], obj.message["max"]);
                            }
                        }
                    } else {
                        const user = obj.message["device"].replace(FORBIDDEN_CHARS, "_");
                        if (this.clientsRaw[user]) {
                            if (this.clientsRaw[user].activ) {
                                this.setStateSearch(user, obj.message["search"], obj.message["max"]);
                            } else {
                                this.log_translator("info", "IMAP disabled", `${user} - ${obj.message["device"]}`);
                            }
                        } else {
                            this.log_translator("info", "not found imap", `${user} - ${obj.message["device"]}`);
                        }
                    }
                }
                break;
            case "getIMAPRequest":
                if (obj.callback) {
                    if (
                        obj.message &&
                        obj.message["search"] != "" &&
                        obj.message["name"] != "" &&
                        obj.message["bodie"] != "" &&
                        obj.message["parse"] != ""
                    ) {
                        if (obj.message["name"] !== "all") {
                            const user = obj.message["name"].replace(FORBIDDEN_CHARS, "_");
                            this.clients[user].custom_search(_obj);
                        } else {
                            this.log_translator("info", "No IMAP selected");
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    }
                }
                break;
            case "getIMAPData":
                if (obj.callback) {
                    if (obj.message && obj.message["name"] != "" && obj.message["value"] != "") {
                        if (obj.message["name"] !== "all") {
                            const user = obj.message["name"].replace(FORBIDDEN_CHARS, "_");
                            if (obj.message["value"] === "data") {
                                this.sendTo(obj.from, obj.command, this.save_json[user], obj.callback);
                            } else {
                                this.sendTo(obj.from, obj.command, this.save_seqno[user], obj.callback);
                            }
                        } else {
                            this.log_translator("info", "No IMAP selected");
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    }
                }
                break;
            case "getFlags":
                if (
                    obj.message &&
                    obj.message["flag"] != "" &&
                    obj.message["seqno"] > 0 &&
                    obj.message["name"] != "" &&
                    obj.message["flagtype"] != "" &&
                    obj.message["name"] !== "all"
                ) {
                    this.log_translator(
                        "info",
                        "Set Flags",
                        obj.message["flag"],
                        obj.message["seqno"],
                        obj.message["flagtype"],
                    );
                    const user = obj.message["name"].replace(FORBIDDEN_CHARS, "_");
                    const flags = [];
                    for (const flag of obj.message["flagtype"].split(",")) {
                        flags.push("\\" + flag);
                    }
                    if (obj.message["flag"] === "addFlags" && typeof this.clients[user] === "object") {
                        this.clients[user].set_addFlags(obj.message["seqno"], _obj.message["flagtype"]);
                    } else if (obj.message["flag"] === "delFlags" && typeof this.clients[user] === "object") {
                        this.clients[user].set_delFlags(obj.message["seqno"], _obj.message["flagtype"]);
                    }
                    if (obj.message["flag"] === "setFlags" && typeof this.clients[user] === "object") {
                        this.clients[user].set_setFlags(obj.message["seqno"], flags);
                    }
                }
                break;
            default:
                this.sendTo(obj.from, obj.command, [], obj.callback);
                delete this.double_call[obj._id];
        }
    }

    async setStateSearch(id, user, max) {
        await this.setStateAsync(`${id}.remote.criteria`, {
            val: user,
            ack: true,
        });
        await this.setStateAsync(`${id}.remote.show_mails`, {
            val: max,
            ack: true,
        });
        await this.setStateAsync(`${id}.remote.search_start`, {
            val: true,
            ack: false,
        });
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            for (const dev of this.clientsID) {
                this.clients[dev.user].stop();
                this.restartIMAPConnection[dev] && this.clearTimeout(this.restartIMAPConnection[dev]);
            }
            this.qualityInterval && this.clearInterval(this.qualityInterval);
            this.statusInterval && this.clearInterval(this.statusInterval);
            this.sleepTimer && this.clearTimeout(this.sleepTimer);
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        if (state && !state.ack) {
            const command = id.split(".").pop();
            const clientID = id.split(".")[2];
            if (
                this.clientsHTML[clientID] != null &&
                command != null &&
                this.clientsHTML[clientID][command] != null &&
                state.val != null
            ) {
                this.log_translator("debug", "change_attribut", command, clientID);
                this.clientsHTML[clientID][command] = state.val;
                this.setAckFlag(id);
                return;
            }
            if (command === "criteria") {
                this.setAckFlag(id);
                return;
            }
            if (command === "show_mails") {
                this.setAckFlag(id);
                return;
            }
            if (command === "search_start") {
                const criteria = await this.getStateAsync(`${clientID}.remote.criteria`);
                const show = await this.getStateAsync(`${clientID}.remote.show_mails`);
                if (criteria && criteria.val && show && show.val != null) {
                    this.clientsRaw[clientID].flag = criteria.val;
                    this.clientsRaw[clientID].maxi_html = show.val;
                    this.imap_connection(this.clientsRaw[clientID]);
                }
                this.setAckFlag(id, { val: false });
                return;
            }
            if (command === "change_folder" && state.val != "") {
                if (this.clients[clientID]) {
                    this.clients[clientID].onReady(state.val);
                    this.setState(`${clientID}.active_inbox`, {
                        val: state.val,
                        ack: true,
                    });
                    this.setAckFlag(id);
                }
                return;
            }
            if (command === "reload_emails") {
                if (this.clients[clientID]) {
                    this.clients[clientID].onNewRead();
                    this.setAckFlag(id, { val: false });
                }
                return;
            }
        }
    }

    async setAckFlag(id, value) {
        try {
            if (id) {
                this.setState(id, {
                    ack: true,
                    ...value,
                });
            }
        } catch (e) {
            this.log_translator("error", "try", `setAckFlag: ${e}`);
        }
    }

    log_translator(level, text, merge_array, merge_array2, merge_array3) {
        try {
            const loglevel = !!this.log[level];
            if (loglevel && level != "debug") {
                //if (loglevel) {
                if (tl.trans[text] != null) {
                    if (merge_array3) {
                        this.log[level](format(tl.trans[text][this.lang], merge_array, merge_array2, merge_array3));
                    } else if (merge_array2) {
                        this.log[level](format(tl.trans[text][this.lang], merge_array, merge_array2));
                    } else if (merge_array) {
                        this.log[level](format(tl.trans[text][this.lang], merge_array));
                    } else {
                        this.log[level](tl.trans[text][this.lang]);
                    }
                } else {
                    this.log.warn(format(tl.trans["Cannot find translation"][this.lang], text));
                }
            }
        } catch (e) {
            this.log.error("try log_translator: " + e + " - " + text);
        }
    }

    helper_translator(text, merge_array, merge_array1) {
        try {
            if (tl.trans[text][this.lang]) {
                if (merge_array1) {
                    return format(tl.trans[text][this.lang], merge_array, merge_array1);
                } else if (merge_array) {
                    return format(tl.trans[text][this.lang], merge_array);
                } else {
                    return tl.trans[text][this.lang];
                }
            } else {
                return tl.trans["Unknown"][this.lang];
            }
        } catch (e) {
            this.log.error("try helper_translator: " + e);
        }
    }

    async createHTMLRows(mail, seqno, clientID, count, all, attrs) {
        if (count == 1) {
            this.clientsRows[clientID] = "";
            this.save_json[clientID] = [];
        }
        const id = this.clientsHTML[clientID];
        mail.seqno = seqno;
        mail.attrs = attrs;
        this.save_json[clientID].push(mail);
        const isEven = count % 2 != 0 ? id["mails_even_color"] : id["mails_odd_color"];
        const isToday = (someDate) => {
            const today = new Date();
            return (
                someDate.getDate() == today.getDate() &&
                someDate.getMonth() == today.getMonth() &&
                someDate.getFullYear() == today.getFullYear()
            );
        };
        let days;
        if (isToday(new Date(mail.date))) {
            days = count % 2 != 0 ? id["mails_today_color"] : id["mails_today_color_odd"];
        } else {
            days = count % 2 != 0 ? id["mails_nextday_color_even"] : id["mails_nextday_color_odd"];
        }
        const weight = attrs.flags != "" ? "normal" : "bold";
        let from = this.helper_translator("Unknown");
        let org_from = this.helper_translator("Unknown");
        if (mail.from && mail.from.value && mail.from.value[0].name != null && mail.from.value[0].name != "") {
            from = mail.from.value[0].name;
            org_from = mail.from.value[0].address;
        } else if (
            mail.from &&
            mail.from.value &&
            mail.from.value[0].address != null &&
            mail.from.value[0].address != ""
        ) {
            from = mail.from.value[0].address;
            org_from = mail.from.value[0].address;
        }
        const org_subject = mail.subject;
        let subject = mail.subject;
        let content = mail.text != null ? mail.text : convert(mail.html);
        if (id["choose_content"] == "html") {
            content = mail.html != null ? mail.html : "";
        } else if (id["choose_content"] == "text") {
            content = mail.text != null ? mail.text : convert(mail.html);
        } else if (id["choose_content"] == "textAsHtml") {
            content = mail.textAsHtml != null ? mail.textAsHtml : mail.text;
        } else if (id["choose_content"] == "html_convert") {
            content = mail.html != null ? convert(mail.html) : mail.text;
        } else if (id["choose_content"] == "textAsHtml_convert") {
            content = mail.textAsHtml != null ? convert(mail.textAsHtml) : mail.text;
        }
        let org_content = content;
        if (org_content != null && org_content != "") {
            org_content = org_content
                .toString()
                .replace(/"/g, "'")
                .replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
        }
        if (mail.subject && mail.subject.toString().length > id["short_subject"] && id["short_subject"] > 0) {
            subject = mail.subject.substring(0, id["short_subject"]);
        }
        if (content && content.toString().length > id["short_content"] && id["short_content"] > 0) {
            content = content.substring(0, id["short_content"]);
        }
        attrs.flags = attrs.flags != "" ? attrs.flags.toString().replace(/\\/, "") : "unseen";
        this.clientsRows[clientID] += `
        <tr style="background-color:${isEven}; 
        color:${days};
        font-weight:${weight};
        font-size:${id["header_font_size"]}px;">
        <td style="text-align:${id["headline_align_column_1"]}">${count}</td>
        <td title="${org_from}" style="text-align:${id["headline_align_column_2"]}">${from}</td>
        <td title="${org_subject}" style="text-align:${id["headline_align_column_3"]}">${subject}</td>
        <td style="text-align:${id["headline_align_column_4"]}">
        ${this.formatDate(new Date(mail.date).getTime(), "TT.MM.JJ - SS:mm")}</td>
        <td title="${org_content}" style="text-align:${id["headline_align_column_5"]}">${content}</td>
        <td style="text-align:${id["headline_align_column_6"]}">${seqno}</td>
        <td style="text-align:${id["headline_align_column_7"]}">${attrs.flags}</td>
        </tr>`;
        if (count == all || this.clientsRaw[clientID].maxi_html == count) {
            await this.createHTML(clientID, this.clientsRows[clientID], count, all);
            this.clientsRows[clientID] = "";
        }
    }

    async createHTML(ident, htmltext, count, all) {
        try {
            const id = this.clientsHTML[ident];
            let div = '<div class="container">';
            let div_css = `
            div.container {
                align-items: center;
                justify-content: center
            }`;
            if (id["jarvis"]) {
                div = "<div>";
                div_css = "";
            }
            const htmlStart = `
            <!DOCTYPE html>
            <html lang="${this.lang}">
            <head>
            <title>IMAP</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
            <meta http-equiv="content-type" content="text/html; charset=utf-8">
            <style>
            * {
                margin: 0;
            }
            body {
                background-color: ${id["body_background"]}; margin: 0 auto;
            }
            p {
                padding-top: 10px; padding-bottom: 10px; text-align: ${id["p_tag_text_align"]}
            }
            td {
                padding:${id["td_tag_cell"]}px; border:0px solid ${id["td_tag_border_color"]}; 
                border-right:${id["td_tag_border_right"]}px solid ${id["td_tag_border_color"]};
                border-bottom:${id["td_tag_border_bottom"]}px solid ${id["td_tag_border_color"]};
            }
            table {
                width: ${id["table_tag_width"]};
                margin: ${id["table_tag_text_align"]};
                border:1px solid ${id["table_tag_border_color"]};
                border-spacing: ${id["table_tag_cell"]}px;
                border-collapse: collapse;
            }
            td:nth-child(1) {
                width: ${id["td_tag_2_colums"]}
            }
            td:nth-child(2) {
                width:${id["td_tag_2_colums"]}
            }
            ${div_css}
            thread {
                display: table-header-group
            }
            tbody {
                display: table-row-group
            }
            tfoot {
                display: table-footer-group
            }
            </style>
            </head>
            <body>
            ${div}
            <table style="width:${id["header_width"]};
            border:${id["header_border"]}px; border-color:${id["header_tag_border_color"]}; 
            color:${id["header_text_color"]}; font-size:${id["header_font_size"]}px; 
            font-family:${id["header_font"]}; 
            background-image: linear-gradient(42deg,${id["header_linear_color_2"]},
            ${id["header_linear_color_1"]});">
            <thead>
            <tr>
            <th colspan="7" scope="colgroup">
            <p style="color:${id["top_text_color"]}; font-family:${id["top_font"]}; 
            font-size:${id["top_font_size"]}px; font-weight:${id["top_font_weight"]}">
            ${id["top_text"]}&ensp;&ensp;${this.helper_translator("top_last_update")} 
            ${this.formatDate(new Date(), "TT.MM.JJJJ hh:mm:ss")}</p></th>
            </tr>
            <tr style="color:${id["headline_color"]}; height:${id["headline_height"]}px;
            font-size: ${id["headline_font_size"]}px; font-weight: ${id["headline_style"]}; 
            border-bottom: ${id["headline_underlined"]}px solid ${id["headline_underlined_color"]}">
            <th style="text-align:${id["headline_align_column_1"]}; width:${id["headline_column_width_1"]}">
            &ensp;${this.helper_translator("ID")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_2"]}; width:${id["headline_column_width_2"]}">
            &ensp;${this.helper_translator("Header_From")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_3"]}; width:${id["headline_column_width_3"]}">
            &ensp;${this.helper_translator("Header_Subject")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_4"]}; width:${id["headline_column_width_4"]}">
            &ensp;${this.helper_translator("Header_Date")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_5"]}; width:${id["headline_column_width_5"]}">
            &ensp;${this.helper_translator("Header_Content")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_6"]}; width:${id["headline_column_width_6"]}">
            &ensp;${this.helper_translator("Header_SEQ")}&ensp;
            </th>
            <th style="text-align:${id["headline_align_column_7"]}; width:${id["headline_column_width_7"]}">
            &ensp;${this.helper_translator("Flag")}&ensp;
            </th>
            </tr>
            </thead>
            <tfoot>
            <tr>
            <th colspan="7" scope="colgroup">
            <p style="color:${id["top_text_color"]}; font-family:${id["top_font"]}; 
            font-size:${id["top_font_size"]}px; font-weight:${id["top_font_weight"]}">
            ${this.helper_translator("footer", count, all)}</p></th>
            </tr>
            </tfoot>
            <tbody>
            ${htmltext}
            </tbody>
            `;
            const htmlEnd = `</table></div></body></html>`;
            await this.setStateAsync(`${ident}.html`, {
                val: htmlStart + htmlEnd,
                ack: true,
            });
            this.json_table(this.save_json[ident], ident);
        } catch (e) {
            this.log_translator("error", "try", `createHTML: ${e}`);
        }
    }

    async json_table(jsons, id) {
        try {
            if (typeof jsons != "object") {
                return;
            }
            let count = 0;
            const new_array = [];
            let new_json = {};
            let addaddress = [];
            let addname = [];
            for (const element of jsons) {
                new_json = {};
                new_json["id"] = ++count;
                new_json["date"] = element.date ? this.formatDate(element.date, "TT.MM.JJJJ hh:mm:ss") : "";
                addaddress = [];
                addname = [];
                if (element.from && element.from.value != null) {
                    for (const address of element.from.value) {
                        if (address.address != null) {
                            addaddress.push(address.address);
                            addname.push(address.name);
                        }
                    }
                }
                new_json["from"] = addaddress;
                new_json["from_name"] = addname;
                addaddress = [];
                addname = [];
                if (element.to && element.to.value != null) {
                    for (const address of element.to.value) {
                        if (address.address != null) {
                            addaddress.push(address.address);
                            addname.push(address.name);
                        }
                    }
                }
                new_json["to"] = addaddress;
                new_json["to_name"] = addname;
                new_json["subject"] = element.subject ? element.subject : "";
                new_json["text"] = element.text ? element.text : "";
                new_json["html"] = element.html ? element.html : "";
                new_json["textAsHtml"] = element.textAsHtml ? element.textAsHtml : "";
                new_json["seqno"] = element.seqno ? element.seqno : "";
                new_json["flag"] = element.attrs.flags ? element.attrs.flags : "";
                new_array.push(new_json);
            }
            await this.setStateAsync(`${id}.json`, {
                val: JSON.stringify(new_array),
                ack: true,
            });
        } catch (e) {
            this.log_translator("error", "try", `json_table: ${e}`);
        }
    }

    async cleanupQuality() {
        this.log_translator("debug", "Data point quality is cleaned up");
        const quality = {
            0: "0x00 - good",
            1: "0x01 - general problem",
            2: "0x02 - no connection problem",
            16: "0x10 - substitute value from controller",
            17: "0x11 - general problem by instance",
            18: "0x12 - instance not connected",
            32: "0x20 - substitute initial value",
            64: "0x40 - substitute value from device or instance",
            65: "0x41 - general problem by device",
            66: "0x42 - device not connected",
            68: "0x44 - device reports error",
            128: "0x80 - substitute value from sensor",
            129: "0x81 - general problem by sensor",
            130: "0x82 - sensor not connected",
            132: "0x84 - sensor reports error",
        };
        try {
            for (const deviceId of this.clientsID) {
                const all_dp = await this.getObjectListAsync({
                    startkey: `${this.namespace}.${deviceId}.`,
                    endkey: `${this.namespace}.${deviceId}.\u9999`,
                });
                const dp_array = [];
                if (all_dp && all_dp.rows) {
                    let role;
                    for (const dp of all_dp.rows) {
                        if (dp.value.type === "state") {
                            const states = await this.getStateAsync(dp.id);
                            if (states && states.q != null && states.q != 0) {
                                this.log_translator("debug", "Datapoint", `${dp.id} - ${JSON.stringify(states)}`);
                                if (quality[states.q]) {
                                    const isfind = dp_array.find((mes) => mes.message === quality[states.q]);
                                    if (isfind) {
                                        this.log_translator("debug", "Found", JSON.stringify(isfind));
                                        ++isfind.counter;
                                        isfind.dp[isfind.counter] = dp.id;
                                    } else {
                                        this.log_translator("debug", "Found", JSON.stringify(isfind));
                                        const new_array = {
                                            message: quality[states.q],
                                            quality: states.q,
                                            counter: 1,
                                            dp: { 1: dp.id },
                                        };
                                        dp_array.push(new_array);
                                    }
                                    if (dp.value.common.role.toString().match(/button/gi) != null) {
                                        role = { val: false };
                                    } else {
                                        role = null;
                                    }
                                    if (quality[states.q] === "0x20 - substitute initial value") {
                                        await this.setStateAsync(`${dp.id}`, {
                                            ack: true,
                                            ...role,
                                        });
                                    }
                                } else {
                                    this.log_translator("debug", "Missing quality", states.q);
                                }
                            }
                        }
                    }
                }
                await this.setStateAsync(`${deviceId}.quality`, {
                    val:
                        Object.keys(dp_array).length > 0
                            ? JSON.stringify(dp_array)
                            : JSON.stringify({ message: "No Message" }),
                    ack: true,
                });
            }
        } catch (e) {
            this.log_translator("error", "try", `cleanupQuality: ${e}`);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Imap(options);
} else {
    // otherwise start the instance directly
    new Imap();
}
