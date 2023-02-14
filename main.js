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
const util = require("node:util");
const FORBIDDEN_CHARS = /[\][züäöÜÄÖ$@ß€*:.,;'"`<>\\\s?]/g;
const lucky = false;

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
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.createDataPoint = helper.createDataPoint;
        this.createHost = helper.createHost;
        this.createMails = helper.createMails;
        this.createRemote = helper.createRemote;
        this.qualityInterval = null;
        this.clients = {};
        this.clientsRaw = {};
        this.imap_client = {};
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
            this.log_translator("info", "No device");
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
            this.qualityInterval = this.setInterval(() => {
                this.cleanupQuality();
            }, 60 * 60 * 24 * 1000);
        }
        this.log_translator("info", "IMAP check start");
        await this.checkDeviceFolder();
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
            const all_dp = await this.getObjectListAsync({
                startkey: `${this.namespace}`,
                endkey: `${this.namespace}\u9999`,
            });
            for (const element of all_dp.rows) {
                if (element && element.value && element.value.type && element.value.type === "device") {
                    if (element.value && element.value.common && element.value.common.desc) {
                        if (this.clientsID.includes(element.value.common.desc)) {
                            this.log_translator("debug", "Found data point", element.id);
                        } else {
                            this.log_translator("debug", "Deleted data point", element.id);
                            await this.delObjectAsync(`${element.id}`, { recursive: true });
                        }
                    }
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
        this.clients[dev.user] = new MailListener(dev, this);

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

        this.clients[dev.user].on("update", (seqno, info, clientID) => {
            this.log_translator("error", "Start Update", clientID, JSON.stringify(info), seqno);
        });

        this.clients[dev.user].on("mailevent", (seqno, clientID) => {
            this.log_translator("error", "Start new Mail", clientID, seqno);
        });

        this.clients[dev.user].on("mailbox", (mailbox, clientID) => {
            this.log_translator("debug", "mailbox", `${clientID} - ${JSON.stringify(mailbox)}`);
            this.setState(`${clientID}.total`, {
                val: mailbox.messages && mailbox.messages.total != null ? mailbox.messages.total : 0,
                ack: true,
            });
        });

        this.clients[dev.user].on("disconnected", (error, clientID) => {
            this.log_translator("info", "disconnected", clientID, error);
            this.log_translator("info", "Restart", clientID, 60);
            this.restartIMAPConnection[clientID] = setTimeout(() => {
                this.log_translator("info", "Restart now", clientID);
                this.imap_connection(this.clientsRaw[clientID]);
                this.restartIMAPConnection[clientID] = null;
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

        this.clients[dev.user].on("error", (err, clientID) => {
            this.log_translator("error", "Error", clientID, err);
        });

        this.clients[dev.user].on("alert", (err, clientID) => {
            this.log.info("ALERT: " + err + " - " + clientID);
        });
        this.clients[dev.user].on("mail", (mail, seqno, attrs, info, clientID, count, all) => {
            if (this.clientsRaw[clientID].maxi < count && this.clientsRaw[clientID].maxi == count) {
                this.setStatesValue(mail, seqno, clientID, count, attrs);
            }
            this.createHTMLRows(this.clientsHTML[clientID], mail, seqno, clientID, count, all, attrs);
            this.log_translator("debug", "Mail", clientID, JSON.stringify(mail));
            this.log_translator("debug", "Attributes", clientID, JSON.stringify(attrs));
            this.log_translator("debug", "Sequense", clientID, seqno);
            this.log_translator("debug", "Info", clientID, JSON.stringify(info));
        });
    }

    async setStatesValue(mail, seqno, clientID, count, attrs) {
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.subject`, {
            val: mail.subject != null ? mail.subject : "",
            ack: true,
        });
        //const receive_date = mail.date.toISOString().replace("T", " ").replace(/\..+/, "");
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.receive`, {
            val: mail.date != null ? mail.date.toString() : "",
            ack: true,
        });
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.content`, {
            val: mail.html != null && mail.html ? mail.html : "",
            ack: true,
        });
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.text`, {
            val: mail.text != null ? mail.text : "",
            ack: true,
        });
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.texthtml`, {
            val: mail.textAsHtml != null ? mail.textAsHtml : "",
            ack: true,
        });
        let add = [];
        for (const address of mail.to.value) {
            if (address.address != null) {
                add.push(address.address);
            }
        }
        await this.setStateAsync(`${clientID}.email.email_${("0" + count).slice(-2)}.to`, {
            val: JSON.stringify(add),
            ack: true,
        });
        add = [];
        for (const address of mail.from.value) {
            if (address.address != null) {
                add.push(address.address);
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
            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    async onStateChange(id, state) {
        if (state && !state.ack) {
            const command = id.split(".").pop();
            const clientID = id.split(".")[2];
            this.log_translator("debug", "Command", command, clientID);
            if (
                this.clientsHTML[clientID] &&
                this.clientsHTML[clientID].command &&
                state.val != null &&
                state.val != ""
            ) {
                this.log_translator("debug", "change_attribut", command, clientID);
                this.clientsHTML[clientID].command = state.val;
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
                const criteria = await this.getStateAsync(`${clientID}.criteria`);
                const show = await this.getStateAsync(`${clientID}.show_mails`);
                if (criteria && criteria.val && show && show.val != null) {
                    this.clientsRaw[clientID].flag = criteria.val;
                    this.clientsRaw[clientID].maxi_html = show.val;
                    this.imap_connection(this.clientsRaw[clientID]);
                }
                this.setAckFlag(id, { val: false });
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
            if (level !== "debug" || lucky) {
                if (tl.trans[text] != null) {
                    if (merge_array3) {
                        this.log[level](
                            util.format(tl.trans[text][this.lang], merge_array, merge_array2, merge_array3),
                        );
                    } else if (merge_array2) {
                        this.log[level](util.format(tl.trans[text][this.lang], merge_array, merge_array2));
                    } else if (merge_array) {
                        this.log[level](util.format(tl.trans[text][this.lang], merge_array));
                    } else {
                        this.log[level](tl.trans[text][this.lang]);
                    }
                } else {
                    this.log_translator("warn", "Cannot find translation", text);
                }
            }
        } catch (e) {
            this.log.error("try log_translator: " + e);
        }
    }

    helper_translator(text, merge_array) {
        try {
            if (tl.trans[text][this.lang]) {
                if (!merge_array) {
                    return tl.trans[text][this.lang];
                } else {
                    return util.format(tl.trans[text][this.lang], merge_array);
                }
            } else {
                return tl.trans["Unknown"][this.lang];
            }
        } catch (e) {
            this.log.error("try helper_translator: " + e);
        }
    }

    async createHTMLRows(id, mail, seqno, clientID, count, all, attrs) {
        if (count === 1) {
            this.clientsRows[clientID] = "";
        }
        const isEven = count % 2 != 0 ? id["mails_even_color"] : id["mails_odd_color"];
        const isToday = (someDate) => {
            const today = new Date();
            return (
                someDate.getDate() == today.getDate() &&
                someDate.getMonth() == today.getMonth() &&
                someDate.getFullYear() == today.getFullYear()
            );
        };
        const today = isToday(new Date(mail.date)) ? id["mails_today_color"] : id["header_text_color"];
        const weight = attrs.flags != "" ? "normal" : "bold";
        let from = this.helper_translator("Unknown");
        if (mail.from && mail.from.value && mail.from.value[0].name != null) from = mail.from.value[0].name;
        const subject = mail.subject.substring(0, id["short_subject"]);
        const content = mail.text.substring(0, id["short_content"]);
        this.clientsRows[clientID] += `
        <tr style="background-color:${isEven}; 
        color:${today};
        font-weight:${weight};
        font-size:${id["header_font_size"]}px;">
        <td style="text-align:${id["headline_align_column_1"]}">${count}</td>
        <td style="text-align:${id["headline_align_column_2"]}">${from}</td>
        <td class="tooltip" style="text-align:${id["headline_align_column_3"]}">${subject}
        <span class="tooltiptext">${mail.subject}</span></td>
        <td style="text-align:${id["headline_align_column_4"]}">
        ${this.formatDate(new Date(mail.date).getTime(), "TT.MM.JJ - SS:mm")}</td>
        <td class="tooltip" style="text-align:${id["headline_align_column_5"]}">${content}
        <span class="tooltiptext">${mail.text}</span></td>
        <td style="text-align:${id["headline_align_column_6"]};">${seqno}</td>
        </tr>`;
        if (count == all || this.clientsRaw[clientID].maxi_html == count) {
            await this.createHTML(id, clientID, this.clientsRows[clientID]);
        }
    }

    async createHTML(id, ident, htmltext) {
        try {
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
            div.container {
                align-items: center;
                justify-content: center
            }
            .tooltip {
                position: relative;
                display: inline-block;
                border-bottom: 1px dotted black;
              }
              
              .tooltip .tooltiptext {
                visibility: hidden;
                width: 120px;
                background-color: #555;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 5px 0;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                margin-left: -60px;
                opacity: 0;
                transition: opacity 0.3s;
              }
              
              .tooltip .tooltiptext::after {
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: #555 transparent transparent transparent;
              }
              
              .tooltip:hover .tooltiptext {
                visibility: visible;
                opacity: 1;
              }
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
            <div class="container">
            <table style="width:${id["header_width"]};
            border:${id["header_border"]}px; border-color:${id["header_tag_border_color"]}; 
            color:${id["header_text_color"]}; font-size:${id["header_font_size"]}px; 
            font-family:${id["header_font"]}; 
            background-image: linear-gradient(42deg,${id["header_linear_color_2"]},
            ${id["header_linear_color_1"]});">
            <thead>
            <tr>
            <th colspan="6" scope="colgroup">
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
            </tr>
            </thead>
            <tfoot>
            <tr>
            <th colspan="6" scope="colgroup">
            <p style="color:${id["top_text_color"]}; font-family:${id["top_font"]}; 
            font-size:${id["top_font_size"]}px; font-weight:${id["top_font_weight"]}">
            ${id["top_text"]}&ensp;&ensp;${this.helper_translator("top_last_update")} 
            ${this.formatDate(new Date(), "TT.MM.JJJJ hh:mm:ss")}</p></th>
            </tr>
            </tfoot>
            <tbody>
            ${htmltext}
            </tbody>
            `;
            const htmlEnd = `</table></div></body></html>`;
            await this.setStateAsync(`${ident}.html`, {
                val: htmlStart + htmltext + htmlEnd,
                ack: true,
            });
        } catch (e) {
            this.log_translator("error", "try", `createHTML: ${e}`);
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
