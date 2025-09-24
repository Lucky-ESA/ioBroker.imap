"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
const helper = require("./lib/helper");
const tl = require("./lib/translator");
const format = require("util").format;
const { convert } = require("html-to-text");
const imap_connect = require("imap-iobroker");
const imap_event = require("./lib/imap_event");
const FORBIDDEN_CHARS = /[üäöÜÄÖ$@ß€*:.]|[^._\-/ :!#$%&()+=@^{}|~\p{Ll}\p{Lu}\p{Nd}]+/gu;
const empty = {
    subject: "",
    date: "",
    html: "",
    text: "",
    textAsHtml: "",
    to: {
        value: [],
    },
    from: {
        value: [],
    },
    flag: "",
    uid: 0,
    size: 0,
    attachments: 0,
    attachments_info: [],
};
const limited_history = 50;

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
        this.createSelect = helper.createSelect;
        this.createQuota = helper.createQuota;
        this.createCounter = helper.createCounter;
        this.getStatus = imap_event.getStatus;
        this.setFolder = imap_event.setFolder;
        this.subscribeBox = imap_event.subscribeBox;
        this.readMailsSort = imap_event.readMailsSort;
        this.readMails = imap_event.readMails;
        this.findmail = imap_event.findmail;
        this.findmail_wo_att = imap_event.findmail_wo_att;
        this.loadAllSeqno = imap_event.loadAllSeqno;
        this.setTotal = imap_event.setTotal;
        this.newMailsSort = imap_event.newMailsSort;
        this.newMails = imap_event.newMails;
        this.readMails = imap_event.readMails;
        this.diffArray = imap_event.diffArray;
        this.updateseqno = imap_event.updateseqno;
        this.updatemail = imap_event.updatemail;
        this.change_events = imap_event.change_events;
        this.addBox = imap_event.addBox;
        this.deleteBox = imap_event.deleteBox;
        this.rename = imap_event.rename;
        this.changeFolder = imap_event.changeFolder;
        this.custom_search = imap_event.custom_search;
        this.loadUnseenSeqno = imap_event.loadUnseenSeqno;
        this.changesearch = imap_event.changesearch;
        this.startReadMails = imap_event.startReadMails;
        this.readAllMails = imap_event.readAllMails;
        this.updateattachments = imap_event.updateattachments;
        this.updateTotal = imap_event.updateTotal;
        this.qualityInterval = null;
        this.statusInterval = null;
        this.totalTimeout = {};
        this.sleepTimer = null;
        this.double_call = {};
        this.boxfolder = {};
        this.save_json = {};
        this.save_seqno = {};
        this.clients = {};
        this.reconnect_count = {};
        this.clientsRaw = {};
        this.clientsHTML = {};
        this.clientsRows = {};
        this.restartIMAPConnection = {};
        this.clientsID = [];
        this.clientsIDdelete = [];
        this.all_seqno = {};
        this.countOnline = {};
        this.lang = "de";
        this.loglevel = "info";
        this.seen = { struct: true, markSeen: false };
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        const loglevel = await this.getForeignStateAsync(`system.adapter.${this.namespace}.logLevel`);
        if (loglevel && loglevel.val) {
            this.loglevel = typeof loglevel.val == "string" ? loglevel.val : "info";
        }
        // Initialize your adapter here
        const devices = {};
        const selectbox = {};
        this.config.max_mb = this.config.max_mb > 600 ? 600 : this.config.max_mb;
        this.config.max_mb = this.config.max_mb < 100 ? 100 : this.config.max_mb;
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
        //check duplicate icon or nodemailer names
        let check_name = {};
        let config_array = this.config.icons;
        if (Object.keys(config_array).length > 0) {
            for (const jsons of config_array) {
                if (check_name[jsons.iconname]) {
                    this.log_translator("info", "duplicate_icon", jsons.iconname);
                }
                check_name[jsons.iconname] = jsons.iconname;
            }
        }
        check_name = {};
        config_array = this.config.nodemailer_options;
        if (Object.keys(config_array).length > 0) {
            for (const jsons of config_array) {
                if (check_name[jsons.nodename]) {
                    this.log_translator("info", "duplicate_nodemailer", jsons.nodename);
                }
                check_name[jsons.nodename] = jsons.nodename;
            }
        }
        devices.data = this.config.hosts;
        selectbox.states = {};
        await this.createCounter();
        for (const dev of devices.data) {
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
                dev.username = dev.user;
                dev.user = dev.user.replace(FORBIDDEN_CHARS, "_");
            }
            if (dev.password != "" && dev.password.includes("<LUCKY-ESA>")) {
                try {
                    const decrypt_pw = dev.password.split("<LUCKY-ESA>")[1];
                    if (decrypt_pw != "") {
                        dev.password = this.decrypt(decrypt_pw);
                    } else {
                        this.log_translator("info", "Cannot found password", dev.user);
                        continue;
                    }
                } catch {
                    this.log_translator("info", "decrypt pw", dev.user);
                    continue;
                }
            } else if (dev.password == "") {
                this.log_translator("info", "missing password");
                continue;
            } else if (dev.token == "") {
                this.log_translator("info", "missing password");
                continue;
            }
            dev.node_option = config_array.find(node => node.nodename === dev.node_option);
            if (
                dev.node_option &&
                dev.node_option.maxHtmlLengthToParse != null &&
                dev.node_option.maxHtmlLengthToParse == 0
            ) {
                dev.node_option.maxHtmlLengthToParse = undefined;
            }
            if (dev.node_option == -1) {
                dev.node_option = {};
            } else if (dev.node_option && dev.node_option.nodename != null) {
                delete dev.node_option.nodename;
            } else {
                dev.node_option = {};
            }
            dev.maxi_html = dev.maxi_html > 99 ? 99 : dev.maxi_html;
            dev.maxi_html = dev.maxi_html < 1 ? 1 : dev.maxi_html;
            dev.maxi = dev.maxi > 99 ? 99 : dev.maxi;
            dev.maxi = dev.maxi < 1 ? 1 : dev.maxi;
            dev.max = dev.maxi_html > dev.maxi ? dev.maxi_html : dev.maxi;
            dev.inbox_activ = dev.inbox;
            this.clientsIDdelete.push(dev);
            if (!dev.activ) {
                await this.cleanupDatapoints(dev);
                continue;
            }
            dev.onExpunge = 0;
            dev.seqonExpunge = [];
            dev.isonExpunge = false;
            dev.onExpungeTimer = null;
            this.clientsHTML[dev.user] = {};
            this.boxfolder[dev.user] = {};
            this.restartIMAPConnection[dev.user] = null;
            this.clientsRows[dev.user] = "";
            selectbox.states[dev.user] = dev.user;
            this.clients[dev.user] = null;
            this.totalTimeout[dev.user] = null;
            this.clientsRaw[dev.user] = dev;
            this.all_seqno[dev.user] = [];
            this.reconnect_count[dev.user] = 0;
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
            this.setStateSearchRestart(dev);
        }
        await this.createSelect(selectbox);
        this.log_translator("info", "IMAP check start");
        await this.checkDeviceFolder();
        this.qualityInterval = this.setInterval(
            () => {
                this.cleanupQuality();
                this.memrsscheck();
            },
            60 * 60 * 24 * 1000,
        );
        this.statusInterval = this.setInterval(
            () => {
                this.connectionCheck();
            },
            60 * 60 * 1000,
        );
        this.cleanupQuality();
        this.checksupport();
        this.subscribeStates(`json_imap`);
        this.subscribeForeignStates(`system.adapter.${this.namespace}.memRss`);
    }

    /**
     * @param {object} dev
     */
    async cleanupDatapoints(dev) {
        if (dev.user != null && dev.user != "") {
            const isDP = await this.getStateAsync(`${dev.user}.online`);
            if (isDP != null) {
                await this.setState(`${dev.user}.online`, {
                    val: false,
                    ack: true,
                });
            }
        }
    }

    /**
     * @param {object} dev
     */
    async setStateSearchRestart(dev) {
        this.setState(`${dev.user}.remote.criteria`, {
            val: JSON.stringify(dev.flag),
            ack: true,
        });
        const max = dev.maxi > dev.maxi_html ? dev.maxi : dev.maxi_html;
        this.setState(`${dev.user}.remote.show_mails`, {
            val: max,
            ack: true,
        });
    }

    /**
     * connectionCheck
     */
    async connectionCheck() {
        for (const dev of this.clientsID) {
            if (this.clients[dev] != null && this.clientsRaw[dev].activ) {
                this.log_translator("debug", "IMAP namespaces", dev, this.clients[dev].namespaces);
                this.log_translator("debug", "IMAP delimiter", dev, this.clients[dev].delimiter);
                this.log_translator("debug", "IMAP connection", dev, this.clients[dev].state);
                if (this.clients[dev].serverSupports("QUOTA")) {
                    this.clients[dev].getQuotaRoot(this.clientsRaw[dev].inbox_activ, (error, info) => {
                        if (error) {
                            this.log_translator("error", "Error", dev, error);
                        } else {
                            this.log_translator("debug", "Storage_value", dev, JSON.stringify(info));
                            if (info && info.data && info.data.storage) {
                                this.createQuota(dev, info);
                            }
                        }
                    });
                }
            } else if (this.clients[dev] == null && this.clientsRaw[dev].activ && this.reconnect_count[dev] > 0) {
                this.reconnect_count[dev] = 0;
                await this.imap_connection(this.clientsRaw[dev]);
            } else {
                this.log_translator("debug", "No connection", dev);
            }
        }
    }

    /**
     * @param {object} dev
     */
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
                    if (html != undefined && last != undefined && this.clientsHTML[dev.user] != null) {
                        this.clientsHTML[dev.user][last] = html.val;
                    }
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `readHTML: ${e}`);
        }
    }

    /**
     * @param {object} dev
     */
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

    /**
     * checkDeviceFolder
     */
    async checkDeviceFolder() {
        try {
            const devices = await this.getDevicesAsync();
            for (const element of devices) {
                const id = element["_id"].split(".").pop();
                const isfind = this.clientsIDdelete.find(mes => mes.user === id);
                if (isfind) {
                    this.log_translator("debug", "Found data point", element["_id"]);
                } else {
                    this.log_translator("debug", "Deleted data point", element["_id"]);
                    await this.delObjectAsync(`${id}`, { recursive: true });
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `checkDeviceFolder: ${e}`);
        }
    }

    /**
     * configcheck
     */
    async configcheck() {
        try {
            let isdecode = false;
            const adapterconfigs = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
            if (adapterconfigs && adapterconfigs.native && adapterconfigs.native.hosts) {
                for (const pw of adapterconfigs.native.hosts) {
                    if (pw.password != "" && !pw.password.includes("<LUCKY-ESA>")) {
                        pw.password = `<LUCKY-ESA>${this.encrypt(pw.password)}`;
                        isdecode = true;
                    }
                }
            }
            if (adapterconfigs && adapterconfigs.native && adapterconfigs.native.oauth_token) {
                for (const pw of adapterconfigs.native.oauth_token) {
                    if (pw.secureid != "" && !pw.secureid.includes("<LUCKY-ESA>")) {
                        pw.secureid = `<LUCKY-ESA>${this.encrypt(pw.secureid)}`;
                        isdecode = true;
                    }
                }
            }
            if (isdecode) {
                this.log_translator("info", "Encrypt");
                if (adapterconfigs && adapterconfigs.native.hosts[0] === null) {
                    adapterconfigs.native.hosts = [];
                }
                if (adapterconfigs && adapterconfigs.native.oauth_token[0] === null) {
                    adapterconfigs.native.oauth_token = [];
                }
                await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                    native: adapterconfigs ? adapterconfigs.native : [],
                });
                //this.updateConfig(adapterconfigs);
                return true;
            }
            return false;
        } catch (e) {
            this.log_translator("error", "try", `configcheck: ${e}`);
        }
    }

    async loadToken(dev) {
        const search_token = {};
        search_token["token"] = this.config.oauth_token;
        let msalConfig;
        const isfind = search_token["token"].find(tok => tok.name === dev.token);
        if (
            isfind != null &&
            isfind.name != null &&
            isfind.provider == "office365" &&
            isfind.clientid != "" &&
            isfind.secureid != "" &&
            isfind.pathid != ""
        ) {
            const msal = require("@azure/msal-node");
            if (isfind.secureid != "" && isfind.secureid.includes("<LUCKY-ESA>")) {
                try {
                    const decrypt_pw = isfind.secureid.split("<LUCKY-ESA>")[1];
                    if (decrypt_pw != "") {
                        isfind.secureid = this.decrypt(decrypt_pw);
                    } else {
                        this.log_translator("info", "Security-ID", isfind.user);
                        dev.token = null;
                    }
                } catch {
                    return (dev.token = null);
                }
            } else {
                dev.token = null;
            }
            msalConfig = {
                auth: {
                    clientId: isfind.clientid,
                    authority: `https://login.microsoftonline.com/${isfind.pathid}`,
                    clientSecret: isfind.secureid,
                },
            };
            const cca = msal ? new msal.ConfidentialClientApplication(msalConfig) : null;
            const tokenRequest = {
                scopes: ["https://graph.microsoft.com/.default"],
            };
            let accessT;
            if (cca) {
                try {
                    accessT = await cca.acquireTokenByClientCredential(tokenRequest);
                } catch (e) {
                    this.log.error(`TokenCredential error: ${e}`);
                    dev.token = null;
                }
            } else {
                this.log.debug(`Credential error!!`);
                dev.token = null;
            }
            if (accessT && accessT.accessToken) {
                dev.token = Buffer.from(
                    [`user=${dev.user}`, `auth=Bearer ${accessT.accessToken}`, "", ""].join("\x01"),
                    "utf-8",
                ).toString("base64");
                return dev.token;
            }
            dev.token = null;
        }
        dev.token = null;
    }

    /**
     * @param {object} dev
     */
    async imap_connection(dev) {
        if (this.clients[dev.user] != null) {
            this.clients[dev.user].destroy();
            await this.sleep(5000);
            this.clients[dev.user] = null;
        }
        this.restartIMAPConnection[dev.user] && this.clearTimeout(this.restartIMAPConnection[dev.user]);
        this.restartIMAPConnection[dev.user] = null;
        if (
            dev.token &&
            dev.token != "" &&
            this.config.oauth_token != null &&
            Object.keys(this.config.oauth_token).length > 0
        ) {
            dev.token = await this.loadToken(dev);
            if (dev.token == null) {
                this.log_translator("info", "Token could not be created", dev.user);
                if (dev.password == null || dev.password == "") {
                    this.log_translator("info", "Token cannot be created", dev.user);
                    this.clients[dev.user] = null;
                    return;
                }
            } else {
                dev.password = null;
                this.log_translator("info", "Token was created", dev.user);
            }
        } else {
            dev.token = null;
        }
        try {
            if (typeof dev.flag === "object") {
                this.clientsRaw[dev.user].flag = JSON.parse(JSON.stringify(dev.flag));
            } else {
                this.clientsRaw[dev.user].flag = JSON.parse(dev.flag);
            }
        } catch {
            this.clientsRaw[dev.user].flag = ["ALL"];
        }
        //this.dir[dev.user] = `${__dirname}/lib/attachment`;
        let tlsoption = {};
        try {
            if (typeof dev.tlsoption === "object") {
                tlsoption = JSON.parse(JSON.stringify(dev.tlsoption));
            } else {
                tlsoption = JSON.parse(dev.tlsoption);
            }
        } catch {
            this.log_translator("warn", "TLSOPTION", dev.user);
        }
        this.clientsRaw[dev.user].inbox_activ = dev.inbox;
        dev.token = null;
        this.clients[dev.user] = new imap_connect({
            xoauth2: dev.token,
            xoauth: null,
            user: dev.username,
            password: dev.password,
            client: dev.user,
            inbox: dev.inbox,
            host: dev.host,
            port: dev.port,
            tls: dev.tls,
            autotls: dev.autotls,
            tlsOptions: tlsoption,
            connTimeout: 10000,
            authTimeout: 5000,
            debug: this.log.debug,
            socketTimeout: 0,
            keepalive: {
                interval: 10000,
                idleInterval: 0,
                forceNoop: true,
            },
        });
        this.clients[dev.user].once("isready", imap_event.onReadyImap.bind(this));
        this.clients[dev.user].once("close", imap_event.onCloseImap.bind(this));
        this.clients[dev.user].on("error", imap_event.onErrorImap.bind(this));
        this.clients[dev.user].connect();
    }

    /**
     * @param {string} client
     */
    setBinds(client) {
        this.clients[client].on("alert", imap_event.onAlert.bind(this));
        this.clients[client].on("update", imap_event.onUpdate.bind(this));
        this.clients[client].on("mail", imap_event.onMail.bind(this));
        this.clients[client].on("new", imap_event.onNew.bind(this));
        this.clients[client].on("type", imap_event.onType.bind(this));
        this.clients[client].on("uidvalidity", imap_event.onUidvalidity.bind(this));
        this.clients[client].on("expunge", imap_event.onExpunge.bind(this));
    }

    /**
     * @param {object} mail
     * @param {number} seqno
     * @param {object} attrs
     * @param {object} info
     * @param {string} clientID device id
     * @param {string} what
     */
    updatejson(mail, seqno, attrs, info, clientID, what) {
        mail.seqno = seqno;
        mail.attrs = attrs;
        mail.info = info;
        if (what === "new") {
            const del_seqno = this.save_json[clientID].pop();
            this.save_json[clientID].push(mail);
            this.save_json[clientID] = this.save_json[clientID].sort((a, b) => b.date - a.date);
            this.updateseqno(clientID, del_seqno["seqno"], false);
        } else {
            const merge = this.save_json[clientID].findIndex(merge => merge.seqno === seqno);
            if (merge != -1) {
                this.save_json[clientID][merge] = mail;
            }
        }
        this.updateIMAPData(clientID, false, false);
    }

    /**
     * @param {object} mail
     * @param {number} seqno
     * @param {object} attrs
     * @param {object} info
     * @param {string} clientID device id
     * @param {number} count
     * @param {number} all
     * @param {boolean} sort
     */
    setMail(mail, seqno, attrs, info, clientID, count, all, sort) {
        if (count == 1) {
            this.save_json[clientID] = [];
        }
        const higher_max =
            this.clientsRaw[clientID].maxi > this.clientsRaw[clientID].maxi_html
                ? this.clientsRaw[clientID].maxi
                : this.clientsRaw[clientID].maxi_html;
        if (count < higher_max || higher_max == count) {
            mail.seqno = seqno;
            mail.attrs = attrs;
            mail.info = info;
            this.save_json[clientID].push(mail);
        }
        if (count == all || higher_max == count) {
            this.updateIMAPData(clientID, sort, false);
        }
        this.log_translator(
            "debug",
            "Mail",
            clientID,
            `${JSON.stringify(mail)} Attributes: ${JSON.stringify(attrs)} Sequense: ${seqno} INFO: ${JSON.stringify(
                info,
            )}`,
        );
    }

    /**
     * checksupport
     */
    async checksupport() {
        await this.sleep(5000);
        let quota = false;
        const capabilitys = [
            "SORT",
            "ESEARCH",
            "QUOTA",
            "SORT=DISPLAY",
            "THREAD=REFERENCES",
            "THREAD=ORDEREDSUBJECT",
            "IDLE",
            "NAMESPACE",
            "STARTTLS",
            "LOGINDISABLED",
            "AUTH=XOAUTH",
            "AUTH=XOAUTH2",
            "AUTH=CRAM-MD5",
            "LITERAL+",
            "ID",
            "CONDSTORE",
            "UNSELECT",
            "MOVE",
            "X-GM-EXT-1",
            "SASL-IR",
        ];
        let common = {};
        for (const dev of this.clientsID) {
            quota = false;
            if (this.clients[dev] && this.clientsRaw[dev].activ) {
                try {
                    for (const capability of capabilitys) {
                        const sorts = await this.clients[dev].serverSupports(capability);
                        if (capability === "QUOTA") {
                            quota = sorts;
                        }
                        const dp_capability = capability.replace(/[=|-|+]/g, "_");
                        common = {
                            type: "boolean",
                            role: "state",
                            name: this.helper_translator("Is supported", capability),
                            desc: "Create by Adapter",
                            read: true,
                            write: false,
                            def: false,
                        };
                        await this.createDataPoint(`${dev}.infos.${dp_capability.toLowerCase()}`, common, "state");
                        await this.setState(`${dev}.infos.${dp_capability.toLowerCase()}`, {
                            val: sorts,
                            ack: true,
                        });
                    }
                    const caps = await this.clients[dev].serverAllSupport();
                    if (caps != null) {
                        common = {
                            type: "string",
                            role: "state",
                            name: this.helper_translator("All support"),
                            desc: "Create by Adapter",
                            read: true,
                            write: false,
                            def: "",
                        };
                        await this.createDataPoint(`${dev}.infos.all_capability`, common, "state");
                        await this.setState(`${dev}.infos.all_capability`, {
                            val: JSON.stringify(caps),
                            ack: true,
                        });
                    }
                    if (quota) {
                        this.clients[dev].getQuotaRoot(this.clientsRaw[dev].inbox_activ, (error, info) => {
                            if (error) {
                                this.log_translator("error", "Error", dev, error);
                            } else {
                                this.log_translator("debug", "Storage_value", dev, JSON.stringify(info));
                                if (info && info.data && info.data.storage) {
                                    this.createQuota(dev, info);
                                }
                            }
                        });
                    }
                } catch (e) {
                    this.log_translator("error", "Error", `checksupport: ${e} - ${dev}`);
                }
            }
        }
    }

    /**
     * @param {string} info
     * @param {string} clientID
     */
    readinfo(info, clientID) {
        this.log_translator("info", "Info", clientID, tl.trans[info][this.lang]);
    }

    /**
     * @param {string} clientID
     * @param {boolean} sorts
     * @param {boolean} html
     */
    updateIMAPData(clientID, sorts, html) {
        if (!this.save_json[clientID] || Object.keys(this.save_json[clientID]).length === 0) {
            return;
        }
        const max = this.clientsRaw[clientID].maxi;
        const max_html = this.clientsRaw[clientID].maxi_html;
        let count = 0;
        const sort_seq = [];
        let count_all = Object.keys(this.save_json[clientID]).length;
        const sorted = this.save_json[clientID].sort((a, b) => b.date - a.date);
        for (const mail of sorted) {
            ++count;
            if (count < max || max == count) {
                this.setStatesValue(mail, mail.seqno, clientID, count, mail.attrs, mail.info);
            }
            if (count < max_html || max_html == count) {
                this.createHTMLRows(mail, mail.seqno, clientID, count, count_all, mail.attrs, html);
            }
            sort_seq.push(mail.seqno);
        }
        if (sorts) {
            this.updateseqno(clientID, sort_seq, true);
        }
        ++count_all;
        if (count_all < max) {
            for (let i = count_all; i < max + 1; i++) {
                this.setStatesValue(empty, 0, clientID, i, empty, empty);
            }
        }
    }

    /**
     * @param {string} clientID
     * @param {object} info
     * @param {string} trans
     */
    async setUpdate(clientID, info, trans) {
        const activity = this.helper_translator(trans) != null ? this.helper_translator(trans) : "";
        await this.setState(`${clientID}.last_activity`, {
            val: activity,
            ack: true,
        });
        await this.setState(`${clientID}.last_activity_json`, {
            val: typeof info === "object" ? JSON.stringify(info) : JSON.stringify({ seqno: "0" }),
            ack: true,
        });
        await this.setState(`${clientID}.last_activity_timestamp`, {
            val: Date.now(),
            ack: true,
        });
    }

    /**
     * @param {object} mail
     * @param {number} seqno
     * @param {string} clientID
     * @param {number} count
     * @param {object} attrs
     * @param {object} info
     */
    async setStatesValue(mail, seqno, clientID, count, attrs, info) {
        try {
            const id = `${clientID}.email.email_${`0${count}`.slice(-2)}`;
            await this.setState(`${id}.subject`, {
                val: mail.subject != null ? mail.subject : this.helper_translator("Unknown"),
                ack: true,
            });
            //const receive_date = mail.date.toISOString().replace("T", " ").replace(/\..+/, "");
            await this.setState(`${id}.receive`, {
                val: mail.date != null ? mail.date.toString() : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setState(`${id}.content`, {
                val: mail.html != null && mail.html ? mail.html : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setState(`${id}.text`, {
                val: mail.text != null ? mail.text : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setState(`${id}.texthtml`, {
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
            await this.setState(`${id}.to`, {
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
            await this.setState(`${id}.from`, {
                val: JSON.stringify(add),
                ack: true,
            });
            await this.setState(`${id}.flag`, {
                val: attrs.flags != null ? JSON.stringify(attrs.flags) : this.helper_translator("Unknown"),
                ack: true,
            });
            await this.setState(`${id}.uid`, {
                val: attrs.uid != null ? attrs.uid : 0,
                ack: true,
            });
            await this.setState(`${id}.seq`, {
                val: seqno != null ? seqno : 0,
                ack: true,
            });
            await this.setState(`${id}.size`, {
                val: info.size != null ? info.size : 0,
                ack: true,
            });
            await this.setState(`${id}.attach`, {
                val: mail.attachments != null ? mail.attachments : 0,
                ack: true,
            });
            await this.setState(`${id}.attach_json`, {
                val: mail.attachments_info != null ? JSON.stringify(mail.attachments_info) : JSON.stringify([]),
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
        let _obj = {};
        try {
            _obj = JSON.parse(JSON.stringify(obj));
        } catch (e) {
            this.log_translator("error", "catch", `onMessage: ${e}`);
            this.sendTo(obj.from, obj.command, [], obj.callback);
            delete this.double_call[obj._id];
            return;
        }
        switch (obj.command) {
            case "getIconList":
                if (obj.callback) {
                    try {
                        let icon_array = [];
                        const icons = [];
                        if (_obj && _obj.message && _obj.message.icon && _obj.message.icon.icons) {
                            icon_array = _obj.message.icon.icons;
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                            return;
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
                    } catch (e) {
                        delete this.double_call[obj._id];
                        this.log_translator("error", "catch", `onMessage: ${e}`);
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                }
                delete this.double_call[obj._id];
                break;
            case "getTokenList":
                if (obj.callback) {
                    try {
                        let token_array = [];
                        const tokens = [];
                        if (_obj && _obj.message && _obj.message.token && _obj.message.token.tokens) {
                            token_array = _obj.message.token.tokens;
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                            return;
                        }
                        if (token_array && Object.keys(token_array).length > 0) {
                            for (const token of token_array) {
                                tokens.push({ label: token.name, value: token.name });
                            }
                            tokens.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));
                            const new_token = [{ label: this.helper_translator("none select"), value: "" }].concat(
                                tokens,
                            );
                            this.sendTo(obj.from, obj.command, new_token, obj.callback);
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    } catch (e) {
                        delete this.double_call[obj._id];
                        this.log_translator("error", "catch", `onMessage: ${e}`);
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                }
                delete this.double_call[obj._id];
                break;
            case "getNodeList":
                if (obj.callback) {
                    try {
                        let mailer_array = [];
                        const mailers = [];
                        if (_obj && _obj.message && _obj.message.node_option && _obj.message.node_option.node_options) {
                            mailer_array = _obj.message.node_option.node_options;
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                            return;
                        }
                        if (mailer_array && Object.keys(mailer_array).length > 0) {
                            for (const mailer of mailer_array) {
                                mailers.push({ label: mailer.nodename, value: mailer.nodename });
                            }
                            mailers.sort((a, b) => (a.label > b.label ? 1 : b.label > a.label ? -1 : 0));
                            const new_mailer = [{ label: this.helper_translator("none select"), value: "" }].concat(
                                mailers,
                            );
                            this.sendTo(obj.from, obj.command, new_mailer, obj.callback);
                        } else {
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    } catch (e) {
                        delete this.double_call[obj._id];
                        this.log_translator("error", "catch", `onMessage: ${e}`);
                        this.sendTo(obj.from, obj.command, [], obj.callback);
                    }
                }
                delete this.double_call[obj._id];
                break;
            case "getBlockly":
                if (
                    obj.message &&
                    obj.message.search != "" &&
                    obj.message.device != "" &&
                    obj.message.max > 0 &&
                    obj.message.max < 100
                ) {
                    if (obj.message.device === "all") {
                        for (const dev in this.clientsRaw) {
                            const userdev = this.clientsRaw[dev];
                            if (userdev.activ) {
                                this.setStateSearch(userdev.user, obj.message.search, obj.message.max);
                            }
                        }
                    } else {
                        const user = obj.message.device.replace(FORBIDDEN_CHARS, "_");
                        if (this.clientsRaw[user]) {
                            if (this.clientsRaw[user].activ) {
                                this.setStateSearch(user, obj.message.search, obj.message.max);
                            } else {
                                this.log_translator("info", "IMAP disabled", `${user} - ${obj.message.device}`);
                            }
                        } else {
                            this.log_translator("info", "not found imap", `${user} - ${obj.message.device}`);
                        }
                    }
                } else if (obj.message && obj.message.max < 1 && obj.message.max > 100) {
                    this.log_translator("info", "max_mail");
                } else {
                    this.sendTo(obj.from, obj.command, [], obj.callback);
                }
                break;
            case "getIMAPRequest":
                if (obj.callback) {
                    if (
                        obj.message &&
                        obj.message.search != "" &&
                        obj.message.name != "" &&
                        obj.message.bodie != "" &&
                        obj.message.parse != null &&
                        obj.message.max > 0 &&
                        obj.message.max < 100
                    ) {
                        if (obj.message.name !== "all") {
                            const user = obj.message.name.replace(FORBIDDEN_CHARS, "_");
                            try {
                                this.custom_search(user, _obj);
                            } catch {
                                this.sendTo(obj.from, obj.command, [], obj.callback);
                            }
                        } else {
                            this.log_translator("info", "No IMAP selected");
                            this.sendTo(obj.from, obj.command, [], obj.callback);
                        }
                    }
                } else if (obj.message && obj.message.max < 1 && obj.message.max > 100) {
                    this.log_translator("info", "max_mail");
                } else {
                    this.sendTo(obj.from, obj.command, [], obj.callback);
                }
                break;
            case "getIMAPData":
                if (obj.callback) {
                    if (obj.message && obj.message.name != "" && obj.message.value != "") {
                        if (obj.message.name !== "all") {
                            const user = obj.message.name.replace(FORBIDDEN_CHARS, "_");
                            if (obj.message.value === "data") {
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
                    obj.message.flag != "" &&
                    obj.message.uid > 0 &&
                    obj.message.name != "" &&
                    obj.message.flagtype != "" &&
                    obj.message.name !== "all"
                ) {
                    const user = obj.message.name.replace(FORBIDDEN_CHARS, "_");
                    const check_flag = obj.message.flag;
                    this.log_translator("info", "Set Flags", obj.message.flag, obj.message.uid, obj.message.flagtype);
                    const flags = [];
                    const types = obj.message["flagtype"].replace(/ /g, "").split(",");
                    for (const flag of types) {
                        if (check_flag == "setFlags" || check_flag == "addFlags" || check_flag == "delFlags") {
                            flags.push(`\\${flag}`);
                        } else {
                            flags.push(flag);
                        }
                    }
                    if (typeof this.clients[user] === "object") {
                        this.change_events(user, obj.message.flag, obj.message.uid, flags);
                    }
                }
                break;
            default:
                this.sendTo(obj.from, obj.command, [], obj.callback);
                delete this.double_call[obj._id];
        }
    }

    /**
     * @param {number} id
     * @param {string} criteria
     * @param {number} max
     */
    async setStateSearch(id, criteria, max) {
        await this.setState(`${id}.remote.criteria`, {
            val: criteria,
            ack: true,
        });
        await this.setState(`${id}.remote.show_mails`, {
            val: max,
            ack: true,
        });
        await this.setState(`${id}.remote.search_start`, {
            val: true,
            ack: false,
        });
    }

    /**
     * @param {number} ms
     */
    sleep(ms) {
        return new Promise(resolve => {
            this.sleepTimer = this.setTimeout(() => {
                resolve(true);
            }, ms);
        });
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            for (const dev of this.clientsID) {
                this.clientsRaw[dev].onExpungeTimer && this.clearTimeout(this.clientsRaw[dev].onExpungeTimer);
                this.clients[dev] = null;
                this.restartIMAPConnection[dev] && this.clearTimeout(this.restartIMAPConnection[dev]);
                this.totalTimeout[dev] && this.clearTimeout(this.totalTimeout[dev]);
                this.setState(`${dev}.online`, {
                    val: false,
                    ack: true,
                });
                this.clientsRaw[dev] = null;
            }
            this.qualityInterval && this.clearInterval(this.qualityInterval);
            this.statusInterval && this.clearInterval(this.statusInterval);
            this.sleepTimer && this.clearTimeout(this.sleepTimer);
            this.setState("online_counter", 0, true);
            this.setState("info.connection", false, true);
            callback();
        } catch (e) {
            this.log.error(`onunload - ${e}`);
            callback();
        }
    }

    /**
     * @param {string} client
     * @param {number} count
     * @param {string|object} err
     */
    async setCounterHistory(client, count, err) {
        this.setState("online_counter", count, true);
        let history_value;
        history_value = await this.getStateAsync("online_history");
        try {
            if (history_value != null && history_value.val != null && typeof history_value.val == "string") {
                history_value = JSON.parse(history_value.val);
            } else {
                history_value = [];
            }
        } catch {
            history_value = [];
        }
        if (Object.keys(history_value).length > limited_history) {
            history_value.pop();
        }
        const new_data = {
            client: client,
            time: Date.now(),
            status: err,
        };
        history_value.push(new_data);
        history_value = history_value.sort((a, b) => {
            if (a.time > b.time) {
                return -1;
            }
        });
        this.setState("online_history", JSON.stringify(history_value), true);
    }
    /**
     * @param {string} id Is called if a subscribed state changes
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        if (state && state.ack) {
            const command = id.split(".").pop();
            if (command === "memRss") {
                if (
                    typeof state.val === "number" &&
                    state.val > this.config.max_mb &&
                    this.config.max_mb_selection === 1
                ) {
                    this.memrsscheck();
                }
            }
        }
        if (state && !state.ack) {
            const command = id.split(".").pop();
            const clientID = id.split(".")[2];
            if (
                clientID != null &&
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
            if (command === "set") {
                this.setAckFlag(id);
                return;
            }
            if (command === "type") {
                this.setAckFlag(id);
                return;
            }
            if (command === "folder") {
                this.setAckFlag(id);
                return;
            }
            if (command === "uid") {
                this.setAckFlag(id);
                return;
            }
            if (command === "mailbox_folder_create") {
                const val = typeof state.val === "string" ? state.val : JSON.stringify(state.val);
                this.addBox(clientID, val);
                this.setAckFlag(id, { val: "" });
                return;
            }
            if (command === "mailbox_folder_delete") {
                const val = typeof state.val === "string" ? state.val : JSON.stringify(state.val);
                this.deleteBox(clientID, val);
                this.setAckFlag(id, { val: "" });
                return;
            }
            if (command === "mailbox_folder_change_name") {
                const val = typeof state.val === "string" ? JSON.parse(state.val) : [];
                this.rename(clientID, val[0], val[1]);
                this.setAckFlag(id, { val: JSON.stringify(["oldname", "newname"]) });
                return;
            }
            if (command === "apply_move" && state.val) {
                this.applyCopyMove("move", clientID);
                this.setAckFlag(id, { val: false });
                return;
            }
            if (command === "apply_copy" && state.val) {
                this.applyCopyMove("copy", clientID);
                this.setAckFlag(id, { val: false });
                return;
            }
            if (command === "apply_flag" && state.val) {
                this.applyFlag(clientID);
                this.setAckFlag(id, { val: false });
                return;
            }
            if (command === "vis_command") {
                if (state.val != "") {
                    const value = state.val != null ? state.val.toString().split("<L>") : [];
                    if (value != null && value[0] != null && value[1] != null && value[2] != null) {
                        if (value[0] === "copy" || value[0] === "move") {
                            this.applyCopyMove(value[0], clientID, Number(value[1]), value[2]);
                        } else {
                            this.applyFlag(clientID, value[0], Number(value[1]), value[2]);
                        }
                    }
                }
                this.setAckFlag(id);
                return;
            }
            if (command === "search_start" && state.val) {
                const criteria = await this.getStateAsync(`${clientID}.remote.criteria`);
                const show = await this.getStateAsync(`${clientID}.remote.show_mails`);
                if (criteria && criteria.val && show && show.val != null) {
                    this.clientsRaw[clientID].flag =
                        typeof criteria.val == "string" ? JSON.parse(criteria.val) : criteria.val;
                    show.val = typeof show.val === "number" ? show.val : Number(show.val);
                    show.val = show.val > 99 ? 99 : show.val;
                    show.val = show.val < 1 ? 1 : show.val;
                    this.clientsRaw[clientID].maxi_html = show.val;
                    this.clientsRaw[clientID].max = show.val;
                    if (this.clients[clientID]) {
                        this.changesearch(clientID);
                    }
                }
                this.setAckFlag(id, { val: false });
                return;
            }
            if (command === "change_folder" && state.val != "") {
                if (this.clients[clientID]) {
                    this.changeFolder(clientID, state.val);
                    this.clientsRaw[clientID].inbox_activ = state.val;
                    this.setState(`${clientID}.active_inbox`, {
                        val: state.val,
                        ack: true,
                    });
                    this.setAckFlag(id);
                }
                return;
            }
            if (command === "apply_html" && state.val) {
                if (this.clients[clientID]) {
                    if (this.save_json[clientID] && Object.keys(this.save_json[clientID]).length > 0) {
                        this.updateIMAPData(clientID, false, true);
                    } else {
                        if (this.clients[clientID].serverSupports("SORT")) {
                            this.readMailsSort(clientID);
                        } else {
                            this.readMails(clientID);
                        }
                    }
                    this.setAckFlag(id, { val: false });
                }
                return;
            }
            if (command === "reload_emails" && state.val) {
                if (this.clients[clientID]) {
                    if (this.clients[clientID].serverSupports("SORT")) {
                        this.readMailsSort(clientID);
                    } else {
                        this.readMails(clientID);
                    }
                    this.setAckFlag(id, { val: false });
                }
                return;
            }
            if (command === "json_imap" && state.val != "") {
                this.setJson_table(state);
                this.setAckFlag(id);
                return;
            }
        }
    }

    /**
     * @param {ioBroker.State | null | undefined} state
     */
    async setJson_table(state) {
        if (state == null) {
            return;
        }
        const jsons = await this.getStateAsync(`${state.val}.json`);
        if (jsons && jsons.val) {
            this.setState(`json_table`, {
                val: jsons.val,
                ack: true,
            });
        }
    }

    /**
     * @param {string} clientID
     * @param {string} [set=""]
     * @param {number} [uid=0]
     * @param {string} [type=""]
     */
    async applyFlag(clientID, set, uid, type) {
        if (this.clients[clientID]) {
            if (set == "" || set == null) {
                const sets = await this.getStateAsync(`${clientID}.remote.flag.set`);
                set = sets && sets.val ? sets.val.toString() : "";
            }
            if (uid === 0 || uid == null) {
                const uids = await this.getStateAsync(`${clientID}.remote.flag.uid`);
                uid = uids && uids.val != null ? Number(uids.val) : 0;
            }
            if (type == "" || type == null) {
                const types = await this.getStateAsync(`${clientID}.remote.flag.type`);
                type = types && types.val ? types.val.toString() : "";
            }
            if (set == "" || set == null) {
                this.log_translator("info", "Flag Type is empty");
                return;
            }
            if (uid === 0) {
                this.log_translator("info", "No UID specified");
                return;
            }
            if (type == "" || type == null) {
                this.log_translator("info", "Type is empty");
                return;
            }
            const flags = [];
            const types = type.replace(/ /g, "").split(",");
            for (const flag of types) {
                flags.push(flag);
            }
            if (typeof this.clients[clientID] === "object") {
                this.change_events(clientID, set, uid, flags);
            }
        }
    }

    /**
     * @param {string} command
     * @param {string} clientID
     * @param {number} [uid=0]
     * @param {string | null | undefined} [folder=null]
     */
    async applyCopyMove(command, clientID, uid, folder) {
        if (!folder) {
            const folders = await this.getStateAsync(`${clientID}.remote.${command}.folder`);
            folder = folders && folders.val ? folders.val.toString() : "";
        }
        if (uid === 0 || uid == null) {
            const uids = await this.getStateAsync(`${clientID}.remote.${command}.uid`);
            uid = uids && uids.val != null ? Number(uids.val) : 0;
        }
        if (!folder || folder == "") {
            this.log_translator("info", "No folder selected");
            return;
        }
        if (uid == null || uid === 0) {
            this.log_translator("info", "No UID specified");
            return;
        }
        if (this.clients[clientID]) {
            this.change_events(clientID, command, uid, folder);
        }
    }

    /**
     * @param {string} id
     * @param {object} [value=null]
     */
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

    /**
     * @param {string} level
     * @param {string} text
     * @param {string | number} [merge_1=null]
     * @param {string | number | boolean} [merge_2=null]
     * @param {string | number} [merge_3=null]
     */
    log_translator(level, text, merge_1, merge_2, merge_3) {
        try {
            let loglevel = true;
            if (this.loglevel !== "debug" && level === "debug") {
                loglevel = false;
            }
            if (loglevel) {
                if (tl.trans[text] != null) {
                    if (merge_3) {
                        this.log[level](format(tl.trans[text][this.lang], merge_1, merge_2, merge_3));
                    } else if (merge_2) {
                        this.log[level](format(tl.trans[text][this.lang], merge_1, merge_2));
                    } else if (merge_1) {
                        this.log[level](format(tl.trans[text][this.lang], merge_1));
                    } else {
                        this.log[level](tl.trans[text][this.lang]);
                    }
                } else {
                    this.log.warn(format(tl.trans["Cannot find translation"][this.lang], text));
                }
            }
        } catch (e) {
            this.log.error(`try log_translator: ${e} - ${text} - ${level}`);
        }
    }

    /**
     * @param {string} text
     * @param {string | number} [merge=null]
     * @param {string | number} [merge_1=null]
     */
    helper_translator(text, merge, merge_1) {
        try {
            if (tl.trans[text][this.lang]) {
                if (merge_1) {
                    return format(tl.trans[text][this.lang], merge, merge_1);
                } else if (merge) {
                    return format(tl.trans[text][this.lang], merge);
                }
                return tl.trans[text][this.lang];
            }
            return tl.trans["Unknown"][this.lang];
        } catch (e) {
            this.log.error(`try helper_translator: ${e} - ${text}`);
        }
    }

    /**
     * @param {object} mail
     * @param {number} seqno
     * @param {string} clientID
     * @param {number} count
     * @param {number} all
     * @param {object} attrs
     * @param {boolean} html
     */
    async createHTMLRows(mail, seqno, clientID, count, all, attrs, html) {
        if (count == 1) {
            this.clientsRows[clientID] = "";
        }
        const id = this.clientsHTML[clientID];
        const isEven = count % 2 != 0 ? id.mails_even_color : id.mails_odd_color;
        const isToday = someDate => {
            const today = new Date();
            return (
                someDate.getDate() == today.getDate() &&
                someDate.getMonth() == today.getMonth() &&
                someDate.getFullYear() == today.getFullYear()
            );
        };
        const all_flags = ["Seen", "Answered", "Flagged", "Deleted", "Draft"];
        let days;
        let action = "";
        let action_copy = "";
        let flags = "";
        let flags_add = "";
        let flags_del = "";
        if (isToday(new Date(mail.date))) {
            days = count % 2 != 0 ? id.mails_today_color : id.mails_today_color_odd;
        } else {
            days = count % 2 != 0 ? id.mails_nextday_color_even : id.mails_nextday_color_odd;
        }
        const weight = attrs && attrs.flags != "" ? "normal" : "bold";
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
        if (id.choose_content == "html") {
            content = mail.html != null ? mail.html : "";
        } else if (id.choose_content == "text") {
            content = mail.text != null ? mail.text : convert(mail.html);
        } else if (id.choose_content == "textAsHtml") {
            content = mail.textAsHtml != null ? mail.textAsHtml : mail.text;
        } else if (id.choose_content == "html_convert") {
            content = mail.html != null ? convert(mail.html) : mail.text;
        } else if (id.choose_content == "textAsHtml_convert") {
            content = mail.textAsHtml != null ? convert(mail.textAsHtml) : mail.text;
        }
        let org_content = content;
        if (org_content != null && org_content != "") {
            org_content = convert(org_content).replace(/["]+|[']+/g, "");
        }
        if (mail.subject && mail.subject.toString().length > id.short_subject && id.short_subject > 0) {
            subject = mail.subject.substring(0, id.short_subject);
        }
        if (content && content.toString().length > id.short_content && id.short_content > 0) {
            content = content.substring(0, id.short_content);
        }
        attrs.flags = attrs && attrs.flags != "" ? attrs.flags.toString().replace(/\\/g, "") : "unseen";
        action = `<option value="" selected="selected"></option>`;
        for (const inbox of this.boxfolder[clientID]) {
            if (inbox != this.clientsRaw[clientID].inbox_activ) {
                action_copy += `<option value="copy<L>${attrs.uid}<L>${inbox}">${id.text_select_copy}${inbox}</option>`;
                action += `<option value="move<L>${attrs.uid}<L>${inbox}">${id.text_select_move}${inbox}</option>`;
            }
        }
        action += action_copy;
        flags = `<option value="" selected="selected"></option>`;
        for (const key of all_flags) {
            if (attrs.flags.indexOf(key) !== -1) {
                flags_del += `<option value="delFlags<L>${attrs.uid}<L>${key}">${id.text_select_delflag}${key}</option>`;
            } else {
                flags += `<option value="setFlags<L>${attrs.uid}<L>${key}">${id.text_select_setflag}${key}</option>`;
                flags_add += `<option value="addFlags<L>${attrs.uid}<L>${key}">${id.text_select_addflag}${key}</option>`;
            }
        }
        flags += flags_add;
        flags += flags_del;
        this.clientsRows[clientID] += `
        <tr style="background-color:${isEven}; 
        color:${days};
        font-weight:${weight};
        font-size:${id.header_font_size}px;">
        <td style="text-align:${id.headline_align_column_1}">${count}</td>
        <td title="${org_from}" style="text-align:${id.headline_align_column_2}">${from}</td>
        <td title="${org_subject}" style="text-align:${id.headline_align_column_3}">${subject}</td>
        <td style="text-align:${id.headline_align_column_4}">
        ${this.formatDate(new Date(mail.date).getTime(), "TT.MM.JJ - SS:mm")}</td>
        <td title="${org_content}" style="text-align:${id.headline_align_column_5}">${content}</td>
        <td style="text-align:${id.headline_align_column_6}">${seqno}</td>
        <td style="text-align:${id.headline_align_column_7}">${attrs.flags}</td>
        <td style="text-align:${id.headline_align_column_8}">${attrs.uid}</td>
        <td style="text-align:${id.headline_align_column_9}">
        <select onchange="setState('${this.namespace}.${clientID}.remote.vis_command', this.value)">
        ${action}</select></td>
        <td style="text-align:${id.headline_align_column_10}">
        <select onchange="setState('${this.namespace}.${clientID}.remote.vis_command', this.value)">
        ${flags}</select></td>
        </tr>`;
        if (count == all || this.clientsRaw[clientID].maxi_html == count) {
            await this.createHTML(clientID, this.clientsRows[clientID], count, all, html);
            this.clientsRows[clientID] = "";
        }
    }

    /**
     * @param {string} ident
     * @param {string} htmltext
     * @param {number} count
     * @param {number} all
     * @param {boolean} html
     */
    async createHTML(ident, htmltext, count, all, html) {
        try {
            const id = this.clientsHTML[ident];
            let div = '<div class="container">';
            let div_css = `
            div.container {
                align-items: center;
                justify-content: center
            }`;
            let min = "";
            if (id.jarvis) {
                div = "<div>";
                div_css = "";
                min = "min-width:100%;";
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
                background-color: ${id.body_background}; margin: 0 auto;
            }
            p {
                padding-top: 10px; padding-bottom: 10px; text-align: ${id.p_tag_text_align}
            }
            td {
                padding:${id.td_tag_cell}px; border:0px solid ${id.td_tag_border_color}; 
                border-right:${id.td_tag_border_right}px solid ${id.td_tag_border_color};
                border-bottom:${id.td_tag_border_bottom}px solid ${id.td_tag_border_color};
            }
            table {
                width: ${id.table_tag_width};
                margin: ${id.table_tag_text_align};
                border:1px solid ${id.table_tag_border_color};
                border-spacing: ${id.table_tag_cell}px;
                border-collapse: collapse;
            }
            td:nth-child(1) {
                width: ${id.td_tag_2_colums}
            }
            td:nth-child(2) {
                width:${id.td_tag_2_colums}
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
            <script> 
            function setState(stateId, value) {
                this.servConn._socket.emit("setState", stateId, value);
            }
            </script>
            </head>
            <body>
            ${div}
            <table style="${min} width:${id.header_width};
            border:${id.header_border}px; border-color:${id.header_tag_border_color}; 
            color:${id.header_text_color}; font-size:${id.header_font_size}px; 
            font-family:${id.header_font}; 
            background-image: linear-gradient(42deg,${id.header_linear_color_2},
            ${id.header_linear_color_1});">
            <thead>
            <tr>
            <th colspan="10" scope="colgroup">
            <p style="color:${id.top_text_color}; font-family:${id.top_font}; 
            font-size:${id.top_font_size}px; font-weight:${id.top_font_weight}">
            ${id.top_text}&ensp;&ensp;${this.helper_translator("top_last_update")} 
            ${this.formatDate(new Date(), "TT.MM.JJJJ hh:mm:ss")}</p></th>
            </tr>
            <tr style="color:${id.headline_color}; height:${id.headline_height}px;
            font-size: ${id.headline_font_size}px; font-weight: ${id.headline_style}; 
            border-bottom: ${id.headline_underlined}px solid ${id.headline_underlined_color}">
            <th style="text-align:${id.headline_align_column_1}; width:${id.headline_column_width_1}">
            ${id.text_id}
            </th>
            <th style="text-align:${id.headline_align_column_2}; width:${id.headline_column_width_2}">
            ${id.text_from}
            </th>
            <th style="text-align:${id.headline_align_column_3}; width:${id.headline_column_width_3}">
            ${id.text_subject}
            </th>
            <th style="text-align:${id.headline_align_column_4}; width:${id.headline_column_width_4}">
            ${id.text_date}
            </th>
            <th style="text-align:${id.headline_align_column_5}; width:${id.headline_column_width_5}">
            ${id.text_content}
            </th>
            <th style="text-align:${id.headline_align_column_6}; width:${id.headline_column_width_6}">
            ${id.text_seq}
            </th>
            <th style="text-align:${id.headline_align_column_7}; width:${id.headline_column_width_7}">
            ${id.text_flag}
            </th>
            <th style="text-align:${id.headline_align_column_8}; width:${id.headline_column_width_8}">
            ${id.text_uid}
            </th>
            <th style="text-align:${id.headline_align_column_9}; width:${id.headline_column_width_9}">
            ${id.text_move_or_copy}
            </th>
            <th style="text-align:${id.headline_align_column_10}; width:${id.headline_column_width_10}">
            ${id.text_setflag}
            </th>
            </tr>
            </thead>
            <tfoot>
            <tr>
            <th colspan="10" scope="colgroup">
            <p style="color:${id.top_text_color}; font-family:${id.top_font}; 
            font-size:${id.top_font_size}px; font-weight:${id.top_font_weight}">
            ${this.helper_translator("footer", count, all)}</p></th>
            </tr>
            </tfoot>
            <tbody>
            ${htmltext}
            </tbody>
            `;
            const htmlEnd = `</table></div></body></html>`;
            await this.setState(`${ident}.html`, {
                val: htmlStart + htmlEnd,
                ack: true,
            });
            this.json_table(this.save_json[ident], ident, html);
        } catch (e) {
            this.log_translator("error", "try", `createHTML: ${e}`);
        }
    }

    /**
     * @param {object} jsons
     * @param {string} id
     * @param {boolean} html
     */
    async json_table(jsons, id, html) {
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
                new_json["attach"] = element.attachments != null ? element.attachments : 0;
                new_json["attach_info"] = element.attachments_info != null ? element.attachments_info : [];
                new_json["to"] = addaddress;
                new_json["to_name"] = addname;
                new_json["subject"] = element.subject != null ? element.subject : "";
                new_json["text"] = element.text != null ? element.text : "";
                new_json["html"] = element.html != null ? element.html : "";
                new_json["textAsHtml"] = element.textAsHtml != null ? element.textAsHtml : "";
                new_json["seqno"] = element.seqno != null ? element.seqno : 0;
                new_json["uid"] = element.attrs && element.attrs.uid != null ? element.attrs.uid : 0;
                new_json["size"] = element.info.size != null ? element.info.size : 0;
                new_json["flag"] = element.attrs && element.attrs.flags != null ? element.attrs.flags : "";
                new_array.push(new_json);
            }
            await this.setState(`${id}.json`, {
                val: JSON.stringify(new_array),
                ack: true,
            });
            if (!html) {
                await this.setState(`json_table`, {
                    val: JSON.stringify(new_array),
                    ack: true,
                });
                await this.setState(`json_imap`, {
                    val: id,
                    ack: true,
                });
            }
        } catch (e) {
            this.log_translator("error", "try", `json_table: ${e}`);
        }
    }

    /**
     * Object qualitiy clean up
     */
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
                                    const isfind = dp_array.find(mes => mes.message === quality[states.q]);
                                    if (isfind) {
                                        this.log_translator("debug", "Found", JSON.stringify(isfind));
                                        ++isfind.counter;
                                        isfind.dp[isfind.counter] = dp.id;
                                    } else {
                                        this.log_translator("debug", "Not found", JSON.stringify(isfind));
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
                                        await this.setState(`${dp.id}`, {
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
                await this.setState(`${deviceId}.quality`, {
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

    /**
     * @param {string} client
     */
    current_date(client) {
        return {
            id: 0,
            date: this.formatDate(new Date(), "TT.MM.JJJJ hh:mm:ss"),
            from: [],
            from_name: [],
            attach: 0,
            attach_info: [],
            to: [],
            to_name: [],
            subject: this.helper_translator("greater_than", this.clientsRaw[client].node_option.maxHtmlLengthToParse),
            text: "",
            html: "",
            textAsHtml: "",
            seqno: 0,
            uid: 0,
            size: 0,
            flag: "",
        };
    }

    async memrsscheck() {
        const memrss = await this.getForeignStateAsync(`system.adapter.${this.namespace}.memRss`);
        const memrss_value = memrss != null && typeof memrss.val === "number" ? memrss.val : 0;
        if (memrss_value > this.config.max_mb) {
            if (this.config.max_mb_selection === 1) {
                const instances = this.config.max_mb_telegram.replace(/ /g, "").split(",");
                const instancesUser = this.config.max_mb_telegram_user.replace(/ /g, "").split(",");
                for (const instance of instances) {
                    const text = this.helper_translator("Restart Adapter Text", memrss_value);
                    const title = this.helper_translator("Restart Adapter Header");
                    if (instancesUser.length > 0) {
                        for (const user of instancesUser) {
                            if (instance.includes("pushover")) {
                                await this.sendToAsync(instance, {
                                    device: user,
                                    message: text,
                                    title: title,
                                });
                            } else if (instance.includes("signal-cmb")) {
                                await this.sendToAsync(instance, "send", {
                                    text: text,
                                    phone: user,
                                });
                            } else {
                                await this.sendToAsync(instance, { user: user, text: text });
                            }
                        }
                    } else {
                        if (instance.includes("pushover")) {
                            await this.sendToAsync(instance, { message: text, title: title });
                        } else if (instance.includes("signal-cmb")) {
                            await this.sendToAsync(instance, "send", {
                                text: text,
                            });
                        } else {
                            await this.sendToAsync(instance, text);
                        }
                    }
                }
            } else if (this.config.max_mb_selection === 2) {
                this.log_translator("info", "Restart Adapter", memrss_value, this.config.max_mb);
                //this.restart();
                try {
                    await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, {
                        native: { max_mb_last_restart: Date.now() },
                    });
                } catch (e) {
                    this.log_translator("info", "Adapter could not restart", e.message);
                }
            } else if (this.config.max_mb_selection === 3) {
                if (this.config.max_mb_object != "") {
                    await this.setState(this.config.max_mb_object, true, false);
                    this.log_translator("info", "Restart Adapter Text", memrss_value);
                } else {
                    this.log_translator("info", "Restart Adapter Text NO DP", memrss_value);
                }
            }
        } else {
            this.log_translator("info", "No threshold", memrss_value);
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = options => new Imap(options);
} else {
    // otherwise start the instance directly
    new Imap();
}
