module.exports = {
    /**
     * @param {object} id
     */
    async createHost(id) {
        let common = {};
        let icons;
        if (id.picture != null && id.picture != "") {
            icons = { icon: id.picture };
        }
        common = {
            name: id.username,
            desc: id.user,
            statusStates: {
                onlineId: `${this.namespace}.${id.user}.online`,
            },
            ...icons,
        };
        await this.createDataPoint(id.user, common, "device");
        common = {
            type: "boolean",
            role: "info.status",
            name: this.helper_translator("Status Host"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: false,
        };
        await this.createDataPoint(`${id.user}.online`, common, "state");
        common = {
            type: "number",
            role: "value.max",
            name: this.helper_translator("total e-mails"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.total`, common, "state");
        common = {
            type: "number",
            role: "value.max",
            name: this.helper_translator("unread"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.total_unread`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("Infos current folder"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.status`, common, "state");
        common = {
            type: "string",
            role: "html",
            name: this.helper_translator("html_code"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.html`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("json_code"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.json`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Hostname"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: id.host,
        };
        await this.createDataPoint(`${id.user}.host`, common, "state");
        common = {
            type: "string",
            role: "info",
            name: this.helper_translator("last activity"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.last_activity`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("json last activity"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.last_activity_json`, common, "state");
        common = {
            type: "string",
            role: "info",
            name: this.helper_translator("Active folder"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.active_inbox`, common, "state");
        this.setState(`${id.user}.active_inbox`, {
            val: id.inbox,
            ack: true,
        });
        common = {
            type: "number",
            role: "info",
            name: this.helper_translator("timestamp last activity"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.last_activity_timestamp`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("qualitiy"),
            desc: "Datapoints Quality",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.quality`, common, "state");
    },
    /**
     * @param {object} id
     */
    async createMails(id) {
        if (id.maxi < 1) id.maxi = 10;
        let common = {};
        let mailid;
        common = {
            name: this.helper_translator("e-Mail"),
            desc: "Create by Adapter",
            icon: "img/email.png",
        };
        await this.createDataPoint(`${id.user}.email`, common, "folder", { id: id.maxi });
        common = {
            name: this.helper_translator("capability"),
            desc: "Create by Adapter",
            icon: "img/info.png",
        };
        await this.createDataPoint(`${id.user}.infos`, common, "folder");
        for (let i = 1; i < id.maxi + 1; i++) {
            mailid = ("0" + i).slice(-2);
            common = {
                name: this.helper_translator("e-Mail"),
                desc: "Create by Adapter",
                icon: "img/email.png",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}`, common, "folder", { id: i });
            common = {
                type: "string",
                role: "html",
                name: this.helper_translator("Mail content"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.content`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("Receive"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.receive`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("e-Mail Subject"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.subject`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("To"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.to`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("From"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.from`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("Text"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.text`, common, "state");
            common = {
                type: "string",
                role: "html",
                name: this.helper_translator("TextHTML"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.texthtml`, common, "state");
            common = {
                type: "string",
                role: "text",
                name: this.helper_translator("Flag"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.flag`, common, "state");
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("UID"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.uid`, common, "state");
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("SEQ"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.seq`, common, "state");
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("SIZE"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                unit: "Byte",
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.size`, common, "state");
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("Attachments"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.attach`, common, "state");
            common = {
                type: "string",
                role: "json",
                name: this.helper_translator("Attachments_JSON"),
                desc: "Create by Adapter",
                read: true,
                write: false,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.attach_json`, common, "state");
        }
    },
    /**
     * @param {string} ident
     * @param {object} common
     * @param {string} types
     * @param {object|null|undefined} [native=null]
     */
    async createDataPoint(ident, common, types, native) {
        try {
            const nativvalue = !native ? { native: {} } : { native: native };
            const obj = await this.getObjectAsync(ident);
            if (!obj) {
                await this.setObjectNotExistsAsync(ident, {
                    type: types,
                    common: common,
                    ...nativvalue,
                }).catch((error) => {
                    this.log.warn(`createDataPoint: ${error}`);
                });
            } else {
                let ischange = false;
                if (Object.keys(obj.common).length == Object.keys(common).length) {
                    for (const key in common) {
                        if (obj.common[key] == null) {
                            ischange = true;
                            break;
                        } else if (JSON.stringify(obj.common[key]) != JSON.stringify(common[key])) {
                            ischange = true;
                            break;
                        }
                    }
                } else {
                    ischange = true;
                }
                if (JSON.stringify(obj.type) != JSON.stringify(types)) {
                    ischange = true;
                }
                if (native) {
                    if (Object.keys(obj.native).length == Object.keys(nativvalue.native).length) {
                        for (const key in obj.native) {
                            if (nativvalue.native[key] == null) {
                                ischange = true;
                                delete obj["native"];
                                obj["native"] = native;
                                break;
                            } else if (JSON.stringify(obj.native[key]) != JSON.stringify(nativvalue.native[key])) {
                                ischange = true;
                                obj.native[key] = nativvalue.native[key];
                                break;
                            }
                        }
                    } else {
                        ischange = true;
                    }
                }
                if (ischange) {
                    this.log.debug(`INFORMATION - Change common: ${this.namespace}.${ident}`);
                    delete obj["common"];
                    obj["common"] = common;
                    obj["type"] = types;
                    await this.setObjectAsync(ident, obj);
                }
            }
        } catch (error) {
            this.log.warn(`createDataPoint e: ${error}`);
        }
    },
    /**
     * @param {object} id
     */
    async createRemote(id) {
        let common = {};
        common = {
            name: this.helper_translator("Remote"),
            desc: "Create by Adapter",
            icon: "img/fernbedienung.png",
        };
        await this.createDataPoint(`${id.user}.remote`, common, "folder");
        common = {
            name: this.helper_translator("move e-mail"),
            desc: "Create by Adapter",
            icon: "img/move.png",
        };
        await this.createDataPoint(`${id.user}.remote.move`, common, "folder");
        common = {
            name: this.helper_translator("copy e-mail to folder"),
            desc: "Create by Adapter",
            icon: "img/copy.png",
        };
        await this.createDataPoint(`${id.user}.remote.copy`, common, "folder");
        common = {
            name: this.helper_translator("HTML"),
            desc: "Create by Adapter",
            icon: "img/html.png",
        };
        await this.createDataPoint(`${id.user}.remote.html`, common, "folder");
        common = {
            name: this.helper_translator("Flags"),
            desc: "Create by Adapter",
            icon: "img/flag.png",
        };
        await this.createDataPoint(`${id.user}.remote.flag`, common, "folder");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Flag Type"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "Seen",
            states: {
                Seen: "Seen",
                Answered: "Answered",
                Flagged: "Flagged",
                Deleted: "Deleted",
                Draft: "Draft",
            },
        };
        await this.createDataPoint(`${id.user}.remote.flag.type`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Set Flag"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "setFlags",
            states: {
                setFlags: "setFlags",
                addFlags: "addFlags",
                delFlags: "delFlags",
            },
        };
        await this.createDataPoint(`${id.user}.remote.flag.set`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("UID"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.remote.flag.uid`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Apply selection"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.flag.apply_flag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("VIS command"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "",
        };
        await this.createDataPoint(`${id.user}.remote.vis_command`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("UID"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.remote.move.uid`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("UID"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.remote.copy.uid`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Apply selection"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.copy.apply_copy`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Apply selection"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.move.apply_move`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("criteria"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: id.flag,
        };
        await this.createDataPoint(`${id.user}.remote.criteria`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("Show maximum emails"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: id.maxi,
        };
        await this.createDataPoint(`${id.user}.remote.show_mails`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Start new search"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.search_start`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Reload emails"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.reload_emails`, common, "state");
        common = {
            type: "boolean",
            role: "button",
            name: this.helper_translator("Apply html changes"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.apply_html`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("body_background"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.body_background`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("p_tag_text_align"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.p_tag_text_align`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("td_tag_cell"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 6,
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_cell`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("td_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_border_color`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("ID"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("ID"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_id`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Header_From"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Header_From"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_from`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Header_Subject"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Header_Subject"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_subject`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Header_Date"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Header_Date"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_date`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Header_Content"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Header_Content"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_content`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Header_SEQ"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Header_SEQ"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_seq`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Flag"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Flag"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_flag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("UID"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("UID"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_uid`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("move or copy"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("move or copy"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_move_or_copy`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Flag action"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: this.helper_translator("Flag action"),
        };
        await this.createDataPoint(`${id.user}.remote.html.text_setflag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: `${this.helper_translator("copy")} - `,
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: `${this.helper_translator("copy")} - `,
        };
        await this.createDataPoint(`${id.user}.remote.html.text_select_copy`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: `${this.helper_translator("move")} - `,
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: `${this.helper_translator("move")} - `,
        };
        await this.createDataPoint(`${id.user}.remote.html.text_select_move`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: "setFlags - ",
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "setFlags - ",
        };
        await this.createDataPoint(`${id.user}.remote.html.text_select_setflag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: "delFlags - ",
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "delFlags - ",
        };
        await this.createDataPoint(`${id.user}.remote.html.text_select_delflag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: "addFlags - ",
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "addFlags - ",
        };
        await this.createDataPoint(`${id.user}.remote.html.text_select_addflag`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Choose content"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "text",
            states: {
                html: "html",
                text: "text",
                textAsHtml: "textAsHtml",
                html_convert: "html_convert",
                textAsHtml_convert: "textAsHtml_convert",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.choose_content`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("td_tag_border_right"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 1,
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_border_right`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("td_tag_border_bottom"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 1,
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_border_bottom`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("table_tag_text_align"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_text_align`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("table_tag_width"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_width`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("table_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_border_color`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("table_tag_cell"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 6,
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_cell`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("td_tag_2_colums"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_2_colums`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("header_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_tag_border_color`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("header_border"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 2,
        };
        await this.createDataPoint(`${id.user}.remote.html.header_border`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("header_width"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_width`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("header_text_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#BDBDBD",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_text_color`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("header_font_size"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 15,
        };
        await this.createDataPoint(`${id.user}.remote.html.header_font_size`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("header_font"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "Helvetica",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_font`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("header_linear_color_1"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_linear_color_1`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("header_linear_color_2"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_linear_color_2`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("headline_height"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 35,
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_height`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("headline_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#BDBDBD",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_color`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("headline_font_size"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 16,
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_font_size`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_style"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "normal",
            states: {
                nnormal: "normal",
                bold: "bold",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_style`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("headline_underlined"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 3,
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_underlined`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("headline_underlined_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_underlined_color`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 1),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_1`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 2),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_2`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 3),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_3`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 4),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_4`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 5),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_5`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 6),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_6`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 7),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_7`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 8),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_8`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 9),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_9`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_column_width", 10),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_10`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 1),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_1`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 2),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_2`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 3),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_3`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 4),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_4`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 5),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_5`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 6),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_6`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 7),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_7`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 8),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_8`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 9),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_9`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("headline_align_column", 10),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "center",
            states: {
                center: "center",
                left: "left",
                right: "right",
                auto: "auto",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_align_column_10`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("top_text_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.top_text_color`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("top_text"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: id.username,
        };
        await this.createDataPoint(`${id.user}.remote.html.top_text`, common, "state");
        common = {
            type: "boolean",
            role: "switch",
            name: this.helper_translator("Disable containers"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: false,
        };
        await this.createDataPoint(`${id.user}.remote.html.jarvis`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("top_font"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "Helvetica",
        };
        await this.createDataPoint(`${id.user}.remote.html.top_font`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("top_font_size"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 20,
        };
        await this.createDataPoint(`${id.user}.remote.html.top_font_size`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("top_font_weight"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "normal",
            states: {
                nnormal: "normal",
                bold: "bold",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.top_font_weight`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("mails_today_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_today_color`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("mails_today_color_odd"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_today_color_odd`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("mails_nextday_color_even"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_nextday_color_even`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("mails_nextday_color_odd"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_nextday_color_odd`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("mails_even_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#333333",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_even_color`, common, "state");
        common = {
            type: "string",
            role: "level.color.rgb",
            name: this.helper_translator("mails_odd_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_odd_color`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("short_subject"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 35,
        };
        await this.createDataPoint(`${id.user}.remote.html.short_subject`, common, "state");
        common = {
            type: "number",
            role: "value",
            name: this.helper_translator("short_content"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 35,
        };
        await this.createDataPoint(`${id.user}.remote.html.short_content`, common, "state");
    },
    /**
     * @param {string} id
     * @param {object|null|undefined} folder
     */
    async createinbox(id, folder) {
        if (folder == null) return;
        let common = {};
        const states = {};
        for (const address of folder) {
            states[address] = address;
        }
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("Change folder"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "",
            states: states,
        };
        await this.createDataPoint(`${id}.remote.change_folder`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Select target folder"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "",
            states: states,
        };
        await this.createDataPoint(`${id}.remote.copy.folder`, common, "state");
        common = {
            type: "string",
            role: "text",
            name: this.helper_translator("Select target folder"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "",
            states: states,
        };
        await this.createDataPoint(`${id}.remote.move.folder`, common, "state");
    },
    /**
     * @param {object} id
     */
    async createSelect(id) {
        let common = {};
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("Last IMAP update"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`json_table`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("IMAP Server"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "",
            states: id.states,
        };
        await this.createDataPoint(`json_imap`, common, "state");
        common = {
            type: "number",
            role: "state",
            name: this.helper_translator("Online_Counter"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`online_counter`, common, "state");
        common = {
            type: "string",
            role: "json",
            name: this.helper_translator("Online_History"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`online_history`, common, "state");
    },
    /**
     * @param {string} id
     * @param {object} info
     */
    async createQuota(id, info) {
        let common = {};
        if (info.data.storage.usage != null || info.data.storage.limit != null) {
            common = {
                name: this.helper_translator("Storage"),
                desc: "Create by Adapter",
                icon: "img/storage.png",
            };
            await this.createDataPoint(`${id}.infos.storage`, common, "folder");
        }
        if (info.data.storage.usage != null) {
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("Usage"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                unit: "kb",
                def: 0,
            };
            await this.createDataPoint(`${id}.infos.storage.storage_usage`, common, "state");
            await this.setStateAsync(`${id}.infos.storage.storage_usage`, {
                val: info.data.storage.usage,
                ack: true,
            });
        }
        if (info.data.storage.limit != null) {
            common = {
                type: "number",
                role: "value",
                name: this.helper_translator("Limit"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                unit: "kb",
                def: 0,
            };
            await this.createDataPoint(`${id}.infos.storage.storage_limit`, common, "state");
            await this.setStateAsync(`${id}.infos.storage.storage_limit`, {
                val: info.data.storage.limit,
                ack: true,
            });
        }
    },
};
