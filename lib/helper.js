module.exports = {
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
            role: "info.count",
            name: this.helper_translator("total e-mails"),
            desc: "Create by Adapter",
            read: true,
            write: false,
            def: 0,
        };
        await this.createDataPoint(`${id.user}.total`, common, "state");
        common = {
            type: "string",
            role: "info.html",
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
            name: this.helper_translator("qualitiy"),
            desc: "Datapoints Quality",
            read: true,
            write: false,
            def: "",
        };
        await this.createDataPoint(`${id.user}.quality`, common, "state");
    },
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
                role: "info.html",
                name: this.helper_translator("Mail content"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.content`, common, "state");
            common = {
                type: "string",
                role: "info.receive",
                name: this.helper_translator("Receive"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.receive`, common, "state");
            common = {
                type: "string",
                role: "info.subject",
                name: this.helper_translator("e-Mail Subject"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.subject`, common, "state");
            common = {
                type: "string",
                role: "info.to",
                name: this.helper_translator("To"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.to`, common, "state");
            common = {
                type: "string",
                role: "info.from",
                name: this.helper_translator("From"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.from`, common, "state");
            common = {
                type: "string",
                role: "info.text",
                name: this.helper_translator("Text"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.text`, common, "state");
            common = {
                type: "string",
                role: "info.texthtml",
                name: this.helper_translator("TextHTML"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.texthtml`, common, "state");
            common = {
                type: "string",
                role: "info.flag",
                name: this.helper_translator("Flag"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: "",
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.flag`, common, "state");
            common = {
                type: "number",
                role: "info.uid",
                name: this.helper_translator("UID"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.uid`, common, "state");
            common = {
                type: "number",
                role: "info.seq",
                name: this.helper_translator("SEQ"),
                desc: "Create by Adapter",
                read: true,
                write: false,
                def: 0,
            };
            await this.createDataPoint(`${id.user}.email.email_${mailid}.seq`, common, "state");
        }
    },
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
                    this.log_translator("error", "catch", `createDataPoint: ${error}`);
                });
            } else {
                let ischange = false;
                if (JSON.stringify(obj.common) != JSON.stringify(common)) ischange = true;
                else if (JSON.stringify(obj.type) != JSON.stringify(types)) ischange = true;
                if (native) {
                    if (JSON.stringify(obj.native) != JSON.stringify(nativvalue)) {
                        ischange = true;
                        delete obj["native"];
                        obj["native"] = native;
                    }
                }
                if (ischange) {
                    this.log_translator("debug", "Change common", `${this.namespace}.${ident}`);
                    delete obj["common"];
                    obj["common"] = common;
                    obj["type"] = types;
                    await this.setObjectAsync(ident, obj);
                }
            }
        } catch (e) {
            this.log_translator("error", "try", `createDataPoint: ${e}`);
        }
    },
    async createRemote(id) {
        let common = {};
        common = {
            name: this.helper_translator("Remote"),
            desc: "Create by Adapter",
            icon: "img/fernbedienung.png",
        };
        await this.createDataPoint(`${id.user}.remote`, common, "folder");
        common = {
            name: this.helper_translator("HTML"),
            desc: "Create by Adapter",
            icon: "img/html.png",
        };
        await this.createDataPoint(`${id.user}.remote.html`, common, "folder");
        common = {
            type: "string",
            role: "value",
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
            type: "string",
            role: "value.background",
            name: this.helper_translator("body_background"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.body_background`, common, "state");
        common = {
            type: "string",
            role: "value.p",
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
            role: "value.td",
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
            role: "value.td",
            name: this.helper_translator("td_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_border_color`, common, "state");
        common = {
            type: "number",
            role: "value.td",
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
            role: "value.td",
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
            role: "value.table",
            name: this.helper_translator("table_tag_text_align"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_text_align`, common, "state");
        common = {
            type: "string",
            role: "value.table",
            name: this.helper_translator("table_tag_width"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_width`, common, "state");
        common = {
            type: "string",
            role: "value.table",
            name: this.helper_translator("table_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.table_tag_border_color`, common, "state");
        common = {
            type: "number",
            role: "value.table",
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
            role: "value.table",
            name: this.helper_translator("td_tag_2_colums"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.td_tag_2_colums`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_tag_border_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_tag_border_color`, common, "state");
        common = {
            type: "number",
            role: "value.header",
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
            role: "value.header",
            name: this.helper_translator("header_width"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_width`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_rules"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "none",
            states: {
                none: "none",
                all: "all",
                cols: "cols",
                rows: "rows",
            },
        };
        await this.createDataPoint(`${id.user}.remote.html.header_rules`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_text_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#BDBDBD",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_text_color`, common, "state");
        common = {
            type: "number",
            role: "value.header",
            name: this.helper_translator("header_font_size"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            unit: "px",
            def: 6,
        };
        await this.createDataPoint(`${id.user}.remote.html.header_font_size`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_font"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "Helvetica",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_font`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_linear_color_1"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_linear_color_1`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("header_linear_color_2"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#424242",
        };
        await this.createDataPoint(`${id.user}.remote.html.header_linear_color_2`, common, "state");
        common = {
            type: "number",
            role: "value.header",
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
            role: "value.header",
            name: this.helper_translator("headline_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#BDBDBD",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_color`, common, "state");
        common = {
            type: "number",
            role: "value.header",
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
            role: "value.header",
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
            role: "value.header",
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
            role: "value.header",
            name: this.helper_translator("headline_underlined_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_underlined_color`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 1),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_1`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 2),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_2`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 3),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_3`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 4),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_4`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 5),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_5`, common, "state");
        common = {
            type: "string",
            role: "value.header",
            name: this.helper_translator("headline_column_width", 6),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "auto",
        };
        await this.createDataPoint(`${id.user}.remote.html.headline_column_width_6`, common, "state");
        common = {
            type: "string",
            role: "value.table",
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
            role: "value.table",
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
            role: "value.table",
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
            role: "value.table",
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
            role: "value.table",
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
            role: "value.table",
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
            role: "value.top",
            name: this.helper_translator("top_text_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.top_text_color`, common, "state");
        common = {
            type: "string",
            role: "value.top",
            name: this.helper_translator("top_text"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "example@example.com",
        };
        await this.createDataPoint(`${id.user}.remote.html.top_text`, common, "state");
        common = {
            type: "string",
            role: "value.top",
            name: this.helper_translator("top_font"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "Helvetica",
        };
        await this.createDataPoint(`${id.user}.remote.html.top_font`, common, "state");
        common = {
            type: "number",
            role: "value.top",
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
            role: "value.top",
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
            role: "value.color",
            name: this.helper_translator("mails_today_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#ffffff",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_today_color`, common, "state");
        common = {
            type: "string",
            role: "value.color",
            name: this.helper_translator("mails_even_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#333333",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_even_color`, common, "state");
        common = {
            type: "string",
            role: "value.color",
            name: this.helper_translator("mails_odd_color"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: "#000000",
        };
        await this.createDataPoint(`${id.user}.remote.html.mails_odd_color`, common, "state");
        common = {
            type: "number",
            role: "value.top",
            name: this.helper_translator("short_subject"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 35,
        };
        await this.createDataPoint(`${id.user}.remote.html.short_subject`, common, "state");
        common = {
            type: "number",
            role: "value.top",
            name: this.helper_translator("short_content"),
            desc: "Create by Adapter",
            read: true,
            write: true,
            def: 35,
        };
        await this.createDataPoint(`${id.user}.remote.html.short_content`, common, "state");
    },
};
