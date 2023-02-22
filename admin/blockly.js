"use strict";

if (typeof goog !== "undefined") {
    goog.provide("Blockly.JavaScript.Sendto");
    goog.require("Blockly.JavaScript");
}

Blockly.Translate =
    Blockly.Translate ||
    function (word, lang) {
        lang = lang || systemLang;
        if (Blockly.Words && Blockly.Words[word]) {
            return Blockly.Words[word][lang] || Blockly.Words[word].en;
        } else {
            return word;
        }
    };

/// --- SendTo imap --------------------------------------------------
Blockly.Words["imap"] = {
    en: "IMAP",
    de: "IMAP",
    ru: "ИМАП",
    pt: "IMAPEL",
    nl: "IMAP",
    fr: "IMAP",
    it: "IMAP",
    es: "IMAP",
    pl: "IMAP",
    uk: "ІМ'Я",
    "zh-cn": "IMAP",
};
Blockly.Words["imap_search"] = {
    en: "Search",
    de: "Suche",
    ru: "Поиск",
    pt: "Pesquisar",
    nl: "Zoek",
    fr: "Recherche",
    it: "Ricerca",
    es: "Buscar",
    pl: "Search Search",
    uk: "Пошук",
    "zh-cn": "建 议",
};
Blockly.Words["imap_fetch"] = {
    en: "Use FETCH direct (without search)",
    de: "Verwende FETCH direkt (ohne Suche)",
    ru: "Используйте FETCH прямой (без поиска)",
    pt: "Use FETCH direto (sem pesquisa)",
    nl: "Gebruik FETCH direct",
    fr: "Utilisez FETCH direct (sans recherche)",
    it: "Utilizzare FETCH direttamente (senza ricerca)",
    es: "Use FETCH directo (sin búsqueda)",
    pl: "Wykorzystywanie FETCH (bez wyszukiwania)",
    uk: "Використовуйте FETCH прямо (без пошуку)",
    "zh-cn": "FETCH 直接用途(未经查询)",
};
Blockly.Words["imap_bodies"] = {
    en: "BODIES:",
    de: "BODIES:",
    ru: "ТЕЛА:",
    pt: "ÓRGÃOS:",
    nl: "BODIES:",
    fr: "ORGANES :",
    it: "BODIES:",
    es: "ÓRGANOS:",
    pl: "BODIES:",
    uk: "БОДИ:",
    "zh-cn": "BODIES:",
};
Blockly.Words["imap_choose"] = {
    en: "select mailbox",
    de: "Postfach auswählen",
    ru: "выбрать почтовый ящик",
    pt: "selecionar caixa de correio",
    nl: "kies postbus",
    fr: "sélectionner la boîte aux lettres",
    it: "selezionare casella postale",
    es: "selecto buzón de correo",
    pl: "mailbox",
    uk: "виберіть поштову скриньку",
    "zh-cn": "选择邮件箱",
};
Blockly.Words["imap_max"] = {
    en: "max. emails",
    de: "max. e-mails",
    ru: "макс. email",
    pt: "max. e-mails",
    nl: "max. e-mails",
    fr: "max. e-mails",
    it: "max. e-mail",
    es: "max. correos electrónicos",
    pl: "max. e-mail",
    uk: "макс. новини",
    "zh-cn": "页: 1 电子邮件",
};
Blockly.Words["imap_all"] = {
    en: "All",
    de: "Alle",
    ru: "Все",
    pt: "Todos",
    nl: "Allen",
    fr: "Tout",
    it: "Tutti",
    es: "Todos",
    pl: "Cały",
    uk: "Всі",
    "zh-cn": "一. 导言",
};
Blockly.Words["imap_name"] = {
    en: "IMAP mailbox",
    de: "IMAP Mailbox",
    ru: "IMAP почтовый ящик",
    pt: "Caixa de correio IMAP",
    nl: "IMAP mailbox",
    fr: "Boîte aux lettres IMAP",
    it: "IMAP mailbox",
    es: "Buzón de correo IMAP",
    pl: "IMAP mailbox",
    uk: "Поштова скринька IMAP",
    "zh-cn": "IMAP 邮件箱",
};
Blockly.Words["imap_mailparser"] = {
    en: "Use Mailparser",
    de: "Mailparser verwenden",
    ru: "Используйте Mailparser",
    pt: "Use o Mailparser",
    nl: "Gebruik Mailparser",
    fr: "Utiliser Mailparser",
    it: "Utilizzare Mailparser",
    es: "Use Mailparser",
    pl: "Mailparser",
    uk: "Використовуйте підписку",
    "zh-cn": "使用邮件",
};
Blockly.Words["imap_log"] = {
    en: "Loglevel",
    de: "Loglevel",
    ru: "Войти",
    pt: "Nível de log",
    nl: "Loglevel",
    fr: "Loglevel",
    it: "Livello di registro",
    es: "Nivel de estudios",
    pl: "Logos",
    uk: "Увійти",
    "zh-cn": "后勤问题",
};
Blockly.Words["imap_log_none"] = {
    en: "none",
    de: "kein",
    ru: "нет",
    pt: "nenhum",
    nl: "niemand",
    fr: "aucun",
    it: "nessuno",
    es: "ninguno",
    pl: "żaden",
    uk: "немає",
    "zh-cn": "无",
};
Blockly.Words["imap_log_info"] = {
    en: "info",
    de: "info",
    ru: "инфо",
    pt: "info",
    nl: "info",
    fr: "info",
    it: "info",
    es: "info",
    pl: "info",
    uk: "контакти",
    "zh-cn": "导 言",
};
Blockly.Words["imap_log_debug"] = {
    en: "debug",
    de: "debug",
    ru: "дебаг",
    pt: "depuração",
    nl: "debug",
    fr: "debug",
    it: "debug",
    es: "debug",
    pl: "debug",
    uk: "напляскване",
    "zh-cn": "黑暗",
};
Blockly.Words["imap_log_warn"] = {
    en: "warn",
    de: "warnen",
    ru: "предупреждение",
    pt: "avisem",
    nl: "waarschuwing",
    fr: "prévenir",
    it: "avvertire avvertire",
    es: "warn",
    pl: "ostrzegać",
    uk: "про нас",
    "zh-cn": "战争",
};
Blockly.Words["imap_log_error"] = {
    en: "error",
    de: "fehler",
    ru: "ошибка",
    pt: "erro",
    nl: "error",
    fr: "erreur",
    it: "errore",
    es: "error",
    pl: "błąd",
    uk: "про нас",
    "zh-cn": "错误",
};
Blockly.Words["imap_anyInstance"] = {
    en: "All Instances",
    de: "Alle Instanzen",
    ru: "Все Instances",
    pt: "Todas as instâncias",
    nl: "Alle instanties",
    fr: "All Instances",
    it: "Tutti i ricorsi",
    es: "All Instances",
    pl: "All Instances (ang.)",
    uk: "Всі Інстанції",
    "zh-cn": "所有案件",
};
Blockly.Words["imap_tooltip"] = {
    en: "Change search query",
    de: "Suchanfrage ändern",
    ru: "Изменить запрос поиска",
    pt: "Alterar consulta de pesquisa",
    nl: "Verander de zoektocht",
    fr: "Changer de recherche query",
    it: "Cambia query di ricerca",
    es: "Cambiar la consulta de búsqueda",
    pl: "Wyszukiwanie",
    uk: "Зміна запиту запиту",
    "zh-cn": "改变搜寻",
};
Blockly.Words["imap_help"] = {
    en: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    de: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    ru: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    pt: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    nl: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    fr: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    it: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    es: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    pl: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    uk: "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
    "zh-cn": "https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md",
};
Blockly.Words["imap_with_result"] = {
    en: "with result",
    de: "mit ergebnis",
    ru: "с результатом",
    pt: "com resultado",
    nl: "met resultaat",
    fr: "avec résultat",
    it: "con risultato",
    es: "con resultado",
    pl: "wynik",
    uk: "з результатом",
    "zh-cn": "结果",
};
Blockly.Sendto.blocks["imap"] =
    '<block type="imap">' +
    '     <value name="INSTANCE">' +
    "     </value>" +
    '     <value name="IMAPNAME">' +
    "     </value>" +
    '     <value name="SEARCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">["UNSEEN"]</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="MAX">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">20</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="LOG">' +
    "     </value>" +
    "</block>";

Blockly.Blocks["imap"] = {
    init: function () {
        var options_user = [];
        var options_instance = [];
        options_user.push([Blockly.Translate("imap_all"), "all"]);
        if (typeof main !== "undefined" && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                var m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    var n = parseInt(m[1], 10);
                    options_instance.push(["imap." + n, "." + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (var a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            //Checking active in the main.js.
                            var id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + "." + id, id]);
                        }
                    }
                }
            }
        }

        this.appendDummyInput("INSTANCE")
            .appendField(Blockly.Translate("imap"))
            .appendField(new Blockly.FieldDropdown(options_instance), "INSTANCE");
        this.appendDummyInput("IMAPNAME")
            .appendField(Blockly.Translate("imap_name"))
            .appendField(new Blockly.FieldDropdown(options_user), "IMAPNAME");

        this.appendValueInput("SEARCH").appendField(Blockly.Translate("imap_search"));

        this.appendValueInput("MAX").appendField(Blockly.Translate("imap_max"));

        this.appendDummyInput("LOG")
            .appendField(Blockly.Translate("imap_log"))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate("imap_log_none"), ""],
                    [Blockly.Translate("imap_log_info"), "log"],
                    [Blockly.Translate("imap_log_debug"), "debug"],
                    [Blockly.Translate("imap_log_warn"), "warn"],
                    [Blockly.Translate("imap_log_error"), "error"],
                ]),
                "LOG",
            );

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate("imap_tooltip"));
        this.setHelpUrl(Blockly.Translate("imap_help"));
    },
};

Blockly.JavaScript["imap"] = function (block) {
    var dropdown_instance = block.getFieldValue("INSTANCE");
    var logLevel = block.getFieldValue("LOG");
    var value_name = block.getFieldValue("IMAPNAME");
    var value_search = Blockly.JavaScript.valueToCode(block, "SEARCH", Blockly.JavaScript.ORDER_ATOMIC);
    var value_max = Blockly.JavaScript.valueToCode(block, "MAX", Blockly.JavaScript.ORDER_ATOMIC);

    var logText;
    if (logLevel) {
        logText =
            "console." + logLevel + '("imap: " + ' + value_search + " + " + value_max + " + " + value_name + ");\n";
    } else {
        logText = "";
    }

    return (
        'sendTo("imap' +
        dropdown_instance +
        '", "getBlockly", {search: ' +
        value_search +
        ", max: " +
        value_max +
        ", device: '" +
        value_name +
        "'});\n" +
        logText
    );
};

Blockly.Sendto.blocks["imap_request"] =
    '<block type="imap_request">' +
    '     <value name="INSTANCE">' +
    "     </value>" +
    '     <value name="IMAPNAME">' +
    "     </value>" +
    '     <value name="SEARCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">["ALL", ["SINCE", "May 20, 2022"], ["BEFORE", "May 28, 2022"]]</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="FETCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">{"fetch": false, "seqno": [1,2,3,4], "single": "1:10"}</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="BODIES">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">{bodies: "", markSeen: false}</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="MAX">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">20</field>' +
    "         </shadow>" +
    "     </value>" +
    '     <value name="MAILPARSER">' +
    "     </value>" +
    '     <value name="LOG">' +
    "     </value>" +
    '     <value name="STATEMENT">' +
    "     </value>" +
    "</block>";

Blockly.Blocks["imap_request"] = {
    init: function () {
        var options_user = [];
        var options_instance = [];
        options_user.push([Blockly.Translate("imap_choose"), "all"]);
        if (typeof main !== "undefined" && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                var m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    var n = parseInt(m[1], 10);
                    options_instance.push(["imap." + n, "." + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (var a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            //Checking active in the main.js.
                            var id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + "." + id, id]);
                        }
                    }
                }
            }
        }

        this.appendDummyInput("INSTANCE")
            .appendField(Blockly.Translate("imap"))
            .appendField(new Blockly.FieldDropdown(options_instance), "INSTANCE");

        this.appendDummyInput("IMAPNAME")
            .appendField(Blockly.Translate("imap_name"))
            .appendField(new Blockly.FieldDropdown(options_user), "IMAPNAME");

        this.appendValueInput("SEARCH").appendField(Blockly.Translate("imap_search"));

        this.appendValueInput("FETCH").appendField(Blockly.Translate("imap_fetch"));

        this.appendValueInput("BODIES").appendField(Blockly.Translate("imap_bodies"));

        this.appendValueInput("MAX").appendField(Blockly.Translate("imap_max"));

        this.appendDummyInput("MAILPARSER")
            .appendField(Blockly.Translate("imap_mailparser"))
            .appendField(new Blockly.FieldCheckbox("TRUE"), "MAILPARSER");

        this.appendDummyInput("LOG")
            .appendField(Blockly.Translate("imap_log"))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate("imap_log_none"), ""],
                    [Blockly.Translate("imap_log_info"), "log"],
                    [Blockly.Translate("imap_log_debug"), "debug"],
                    [Blockly.Translate("imap_log_warn"), "warn"],
                    [Blockly.Translate("imap_log_error"), "error"],
                ]),
                "LOG",
            );
        this.appendStatementInput("STATEMENT").setCheck(null);

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate("imap_tooltip"));
        this.setHelpUrl(Blockly.Translate("imap_help"));
    },
};

Blockly.JavaScript["imap_request"] = function (block) {
    var dropdown_instance = block.getFieldValue("INSTANCE");
    var logLevel = block.getFieldValue("LOG");
    var value_name = block.getFieldValue("IMAPNAME");
    var value_search = Blockly.JavaScript.valueToCode(block, "SEARCH", Blockly.JavaScript.ORDER_ATOMIC);
    var value_fetch = Blockly.JavaScript.valueToCode(block, "FETCH", Blockly.JavaScript.ORDER_ATOMIC);
    var value_bodie = Blockly.JavaScript.valueToCode(block, "BODIES", Blockly.JavaScript.ORDER_ATOMIC);
    var value_max = Blockly.JavaScript.valueToCode(block, "MAX", Blockly.JavaScript.ORDER_ATOMIC);
    var value_parse = block.getFieldValue("MAILPARSER");
    value_parse = value_parse === "TRUE" || value_parse === "true" || value_parse === true;

    var para_fetch = "";
    if (value_fetch !== null && value_fetch !== "") {
        if (typeof value_fetch === "object") {
            para_fetch = " JSON.parse(" + JSON.stringify(value_fetch) + ")";
        } else {
            para_fetch = " JSON.parse(" + value_fetch + ")";
        }
    }

    var text = "{\n";
    text += '  name: "' + value_name + '",\n';
    text += "   max: " + value_max + ",\n";
    text += "   search: " + value_search + ",\n";
    text += "   fetch: " + para_fetch + ",\n";
    text += "   bodie: " + value_bodie + ",\n";
    text += "   parse: " + value_parse + ",\n";
    text += "}";

    var args = [];
    args.push('\n   "name": "' + value_name + '"');
    args.push('\n   "max": ' + value_max);
    args.push('\n   "search": ' + value_search);
    args.push('\n   "fetch": ' + value_fetch);
    args.push('\n   "bodie": ' + value_bodie);
    args.push('\n   "parse": ' + value_parse);
    var logText;
    if (logLevel) {
        logText =
            "console." +
            logLevel +
            '("' +
            dropdown_instance +
            ': " + "' +
            (args.length ? args.join(",") + "\n" : "") +
            '");\n';
    } else {
        logText = "";
    }
    var statement;
    statement = Blockly.JavaScript.statementToCode(block, "STATEMENT");
    var command = "getIMAPRequest";
    return (
        'sendTo("imap' +
        dropdown_instance +
        '", "' +
        command +
        '", ' +
        text +
        ", async function (result) {\n  " +
        statement +
        "  });\n" +
        logText
    );
};
