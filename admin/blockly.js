/* eslint-disable no-var */
/* eslint-disable no-undef */
// @ts-nocheck
'use strict';

if (typeof goog !== 'undefined') {
    goog.provide('Blockly.JavaScript.Sendto');
    goog.require('Blockly.JavaScript');
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
Blockly.Words['no_instance_found'] = {
    en: 'No instance found',
    de: 'Keine Instanz gefunden',
    ru: 'Не найден',
    pt: 'Nenhuma instância encontrada',
    nl: 'Geen instantie gevonden',
    fr: 'Aucune instance trouvée',
    it: 'Nessun caso trovato',
    es: 'No hay caso encontrado',
    pl: 'Brak',
    uk: 'Не знайдено',
    'zh-cn': '未找到实例',
};
Blockly.Words['imap'] = {
    en: 'IMAP',
    de: 'IMAP',
    ru: 'ИМАП',
    pt: 'IMAPEL',
    nl: 'IMAP',
    fr: 'IMAP',
    it: 'IMAP',
    es: 'IMAP',
    pl: 'IMAP',
    uk: 'ІМ\'Я',
    'zh-cn': 'IMAP',
};
Blockly.Words['imap_search'] = {
    en: 'Search',
    de: 'Suche',
    ru: 'Поиск',
    pt: 'Pesquisar',
    nl: 'Zoek',
    fr: 'Recherche',
    it: 'Ricerca',
    es: 'Buscar',
    pl: 'Search Search',
    uk: 'Пошук',
    'zh-cn': '建 议',
};
Blockly.Words['imap_fetch'] = {
    en: 'Use FETCH direct (without search)',
    de: 'Verwende FETCH direkt (ohne Suche)',
    ru: 'Используйте FETCH прямой (без поиска)',
    pt: 'Use FETCH direto (sem pesquisa)',
    nl: 'Gebruik FETCH direct',
    fr: 'Utilisez FETCH direct (sans recherche)',
    it: 'Utilizzare FETCH direttamente (senza ricerca)',
    es: 'Use FETCH directo (sin búsqueda)',
    pl: 'Wykorzystywanie FETCH (bez wyszukiwania)',
    uk: 'Використовуйте FETCH прямо (без пошуку)',
    'zh-cn': 'FETCH 直接用途(未经查询)',
};
Blockly.Words['imap_bodies'] = {
    en: 'BODIES:',
    de: 'BODIES:',
    ru: 'ТЕЛА:',
    pt: 'ÓRGÃOS:',
    nl: 'BODIES:',
    fr: 'ORGANES :',
    it: 'BODIES:',
    es: 'ÓRGANOS:',
    pl: 'BODIES:',
    uk: 'БОДИ:',
    'zh-cn': 'BODIES:',
};
Blockly.Words['imap_flags'] = {
    en: 'Flag action (addFlags, delFlags or setFlags).',
    de: 'Flaggenaktion (addFlags, delFlags oder setFlags.).',
    ru: 'Флаг действия (addFlags, delFlags или setFlags.).',
    pt: 'Ação da bandeira (addFlags, delFlags ou setFlags.).',
    nl: 'Flag actie (addFlags, delFlags of setFlags).',
    fr: 'Action du drapeau (addFlags, delFlags ou setFlags.).',
    it: 'Azione della bandiera (addFlags, delFlags o setFlags.).',
    es: 'Acción de bandera (addFlags, delFlags o setFlags.).',
    pl: 'Flaga (addFlags, delFlags lub setFlags).',
    uk: 'Прапор дії (addFlags, delFlags або setFlags.).',
    'zh-cn': '滞后行动(滞后、冲绳或四国).',
};
Blockly.Words['imap_flagtype'] = {
    en: 'Set Flags',
    de: 'Flaggen festlegen',
    ru: 'Установите флаги',
    pt: 'Conjunto de bandeiras',
    nl: 'Set Flags',
    fr: 'Set Drapeaux',
    it: 'Set Bandiere',
    es: 'Set Flags',
    pl: 'Flaga',
    uk: 'Комплект Прапорів',
    'zh-cn': 'A. 排减量',
};
Blockly.Words['imap_tooltip_flags'] = {
    en: 'Flags available (Seen,Answered,Flagged,Deleted or Draft)',
    de: 'Flaggen verfügbar (Seen,Answered,Flagged,Deleted oder Draft)',
    ru: 'Имеющиеся флаги (Seen,Answered,Flagged,Deleted или Draft)',
    pt: 'Bandeiras disponíveis (Seen,Answered,Flagged,Deleted ou Draft)',
    nl: 'Vlaggen beschikbaar (Seen,Answered,Flagged,Deleted of Draft)',
    fr: 'Drapeaux disponibles (Envoyé,Réponse,Draps ou Draft)',
    it: 'Bandiere disponibili (Vendita,Risposta,Flagged,Deleted o Draft)',
    es: 'Banderas disponibles (ver,Respuesta,Flagged,Deleted o Draft)',
    pl: 'Flagi dostępne (Seen,Answered,Flagged,Deleted lub Draft)',
    uk: 'Прапори доступні (Seen,Answered,Flagged,Deleted або Draft)',
    'zh-cn': '可用的滞留(见、Answered、Flag、注释、手或空洞无见)',
};
Blockly.Words['imap_uid'] = {
    'en': 'UID number',
    'de': 'UID-Nummer',
    'ru': 'UID номер',
    'pt': 'Número do UID',
    'nl': 'UID nummer',
    'fr': 'Numéro UID',
    'it': 'Numero UID',
    'es': 'Número de UID',
    'pl': 'Liczba UID',
    'uk': 'UID номер',
    'zh-cn': 'IDID编号'
};
Blockly.Words['imap_choose'] = {
    en: 'select mailbox',
    de: 'Postfach auswählen',
    ru: 'выбрать почтовый ящик',
    pt: 'selecionar caixa de correio',
    nl: 'kies postbus',
    fr: 'sélectionner la boîte aux lettres',
    it: 'selezionare casella postale',
    es: 'selecto buzón de correo',
    pl: 'mailbox',
    uk: 'виберіть поштову скриньку',
    'zh-cn': '选择邮件箱',
};
Blockly.Words['imap_max'] = {
    en: 'max. emails',
    de: 'max. e-mails',
    ru: 'макс. email',
    pt: 'max. e-mails',
    nl: 'max. e-mails',
    fr: 'max. e-mails',
    it: 'max. e-mail',
    es: 'max. correos electrónicos',
    pl: 'max. e-mail',
    uk: 'макс. новини',
    'zh-cn': '页: 1 电子邮件',
};
Blockly.Words['imap_all'] = {
    en: 'All',
    de: 'Alle',
    ru: 'Все',
    pt: 'Todos',
    nl: 'Allen',
    fr: 'Tout',
    it: 'Tutti',
    es: 'Todos',
    pl: 'Cały',
    uk: 'Всі',
    'zh-cn': '一. 导言',
};
Blockly.Words['imap_name'] = {
    en: 'IMAP mailbox',
    de: 'IMAP Mailbox',
    ru: 'IMAP почтовый ящик',
    pt: 'Caixa de correio IMAP',
    nl: 'IMAP mailbox',
    fr: 'Boîte aux lettres IMAP',
    it: 'IMAP mailbox',
    es: 'Buzón de correo IMAP',
    pl: 'IMAP mailbox',
    uk: 'Поштова скринька IMAP',
    'zh-cn': 'IMAP 邮件箱',
};
Blockly.Words['imap_mailparser'] = {
    en: 'Use Mailparser',
    de: 'Mailparser verwenden',
    ru: 'Используйте Mailparser',
    pt: 'Use o Mailparser',
    nl: 'Gebruik Mailparser',
    fr: 'Utiliser Mailparser',
    it: 'Utilizzare Mailparser',
    es: 'Use Mailparser',
    pl: 'Mailparser',
    uk: 'Використовуйте підписку',
    'zh-cn': '使用邮件',
};
Blockly.Words['imap_log'] = {
    en: 'Loglevel',
    de: 'Loglevel',
    ru: 'Войти',
    pt: 'Nível de log',
    nl: 'Loglevel',
    fr: 'Loglevel',
    it: 'Livello di registro',
    es: 'Nivel de estudios',
    pl: 'Logos',
    uk: 'Увійти',
    'zh-cn': '后勤问题',
};
Blockly.Words['imap_log_none'] = {
    en: 'none',
    de: 'kein',
    ru: 'нет',
    pt: 'nenhum',
    nl: 'niemand',
    fr: 'aucun',
    it: 'nessuno',
    es: 'ninguno',
    pl: 'żaden',
    uk: 'немає',
    'zh-cn': '无',
};
Blockly.Words['imap_log_info'] = {
    en: 'info',
    de: 'info',
    ru: 'инфо',
    pt: 'info',
    nl: 'info',
    fr: 'info',
    it: 'info',
    es: 'info',
    pl: 'info',
    uk: 'контакти',
    'zh-cn': '导 言',
};
Blockly.Words['imap_log_debug'] = {
    en: 'debug',
    de: 'debug',
    ru: 'дебаг',
    pt: 'depuração',
    nl: 'debug',
    fr: 'debug',
    it: 'debug',
    es: 'debug',
    pl: 'debug',
    uk: 'напляскване',
    'zh-cn': '黑暗',
};
Blockly.Words['imap_log_warn'] = {
    en: 'warn',
    de: 'warnen',
    ru: 'предупреждение',
    pt: 'avisem',
    nl: 'waarschuwing',
    fr: 'prévenir',
    it: 'avvertire avvertire',
    es: 'warn',
    pl: 'ostrzegać',
    uk: 'про нас',
    'zh-cn': '战争',
};
Blockly.Words['imap_log_error'] = {
    en: 'error',
    de: 'fehler',
    ru: 'ошибка',
    pt: 'erro',
    nl: 'error',
    fr: 'erreur',
    it: 'errore',
    es: 'error',
    pl: 'błąd',
    uk: 'про нас',
    'zh-cn': '错误',
};
Blockly.Words['imap_anyInstance'] = {
    en: 'All Instances',
    de: 'Alle Instanzen',
    ru: 'Все Instances',
    pt: 'Todas as instâncias',
    nl: 'Alle instanties',
    fr: 'All Instances',
    it: 'Tutti i ricorsi',
    es: 'All Instances',
    pl: 'All Instances (ang.)',
    uk: 'Всі Інстанції',
    'zh-cn': '所有案件',
};
Blockly.Words['imap_tooltip'] = {
    en: 'Change search query',
    de: 'Suchanfrage ändern',
    ru: 'Изменить запрос поиска',
    pt: 'Alterar consulta de pesquisa',
    nl: 'Verander de zoektocht',
    fr: 'Changer de recherche query',
    it: 'Cambia query di ricerca',
    es: 'Cambiar la consulta de búsqueda',
    pl: 'Wyszukiwanie',
    uk: 'Зміна запиту запиту',
    'zh-cn': '改变搜寻',
};
Blockly.Words['imap_tooltip_data'] = {
    en: 'Use current search query.',
    de: 'Aktuelle Suchanfrage verwenden.',
    ru: 'Используйте текущий запрос поиска.',
    pt: 'Use a consulta de pesquisa atual.',
    nl: 'Gebruik de huidige zoektocht.',
    fr: 'Utilisez la requête de recherche actuelle.',
    it: 'Utilizzare query di ricerca corrente.',
    es: 'Utilice la consulta de búsqueda actual.',
    pl: 'Użycie aktualnych zapytań.',
    uk: 'Використовуйте поточний пошук запиту.',
    'zh-cn': '使用目前的搜寻。.'
};
Blockly.Words['imap_tooltip_request'] = {
    en: 'Own search query',
    de: 'Eigene Suchanfrage',
    ru: 'Собственный поисковый запрос',
    pt: 'Própria consulta de pesquisa',
    nl: 'Eigen zoektocht',
    fr: 'Own search query',
    it: 'Ricerca propria query',
    es: 'Own search query',
    pl: 'Wyszukiwarka',
    uk: 'Власний пошуковий запит',
    'zh-cn': '查询',
};
Blockly.Words['imap_help'] = {
    en: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    de: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    ru: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    pt: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    nl: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    fr: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    it: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    es: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    pl: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    uk: 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
    'zh-cn': 'https://github.com/Lucky-ESA/ioBroker.imap/blob/master/README.md',
};
Blockly.Words['imap_with_result'] = {
    en: 'with result',
    de: 'mit ergebnis',
    ru: 'с результатом',
    pt: 'com resultado',
    nl: 'met resultaat',
    fr: 'avec résultat',
    it: 'con risultato',
    es: 'con resultado',
    pl: 'wynik',
    uk: 'з результатом',
    'zh-cn': '结果',
};
Blockly.Words['imap_data'] = {
    en: 'Emails data',
    de: 'E-Mail-Daten',
    ru: 'Данные по электронной почте',
    pt: 'Dados de e-mail',
    nl: 'E-mails',
    fr: 'Emails data',
    it: 'Dati e-mail',
    es: 'Datos de correo electrónico',
    pl: 'Data emaili',
    uk: 'Дані електронної пошти',
    'zh-cn': '电子邮件数据',
};
Blockly.Words['imap_data_json'] = {
    en: 'Emails as JSON',
    de: 'E-Mails als JSON',
    ru: 'Email как JSON',
    pt: 'Emails como JSON',
    nl: 'E-mails als JSON',
    fr: 'Courriels comme JSON',
    it: 'E-mail come JSON',
    es: 'Correos electrónicos como JSON',
    pl: 'Email jako JSON',
    uk: 'Електронна пошта: json',
    'zh-cn': 'Email as JSON',
};
Blockly.Words['imap_data_seqno'] = {
    en: 'Last sequence numbers',
    de: 'Letzte Sequenznummern',
    ru: 'Последние номера последовательности',
    pt: 'Últimos números de sequência',
    nl: 'Laatste sequenties',
    fr: 'Derniers numéros de séquence',
    it: 'Ultimo numero di sequenza',
    es: 'Últimos números de secuencia',
    pl: 'Liczba ostatnia',
    uk: 'Останні номери послідовності',
    'zh-cn': '最后一组',
};
Blockly.Sendto.blocks['imap'] =
    '<block type="imap">' +
    '     <field name="INSTANCE"></field>' +
    '     <field name="IMAPNAME"></field>' +
    '     <value name="SEARCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">["UNSEEN"]</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="MAX">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">20</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <field name="LOG"></field>' +
    '</block>';

Blockly.Blocks['imap'] = {
    init: function () {
        const options_user = [];
        const options_instance = [];

        options_user.push([Blockly.Translate('imap_all'), 'all']);

        if (typeof main !== 'undefined' && main.instances) {
            for (let i = 0; i < main.instances.length; i++) {
                const m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    options_instance.push(['imap.' + n, '.' + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (let a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            // Checking active in the main.js.
                            const id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + '.' + id, id]);
                        }
                    }
                }
            }
        }
        if (options_instance.length == 0) options_instance.push([Blockly.Translate('no_instance_found'), '']);

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('imap'))
            .appendField(new Blockly.FieldDropdown(options_instance), 'INSTANCE');
        this.appendDummyInput('IMAPNAME')
            .appendField(Blockly.Translate('imap_name'))
            .appendField(new Blockly.FieldDropdown(options_user), 'IMAPNAME');

        this.appendValueInput('SEARCH').appendField(Blockly.Translate('imap_search'));

        this.appendValueInput('MAX').appendField(Blockly.Translate('imap_max'));

        this.appendDummyInput('LOG')
            .appendField(Blockly.Translate('imap_log'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('imap_log_none'), ''],
                    [Blockly.Translate('imap_log_debug'), 'debug'],
                    [Blockly.Translate('imap_log_info'), 'log'],
                    [Blockly.Translate('imap_log_warn'), 'warn'],
                    [Blockly.Translate('imap_log_error'), 'error'],
                ]),
                'LOG',
            );

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);

        this.setTooltip(Blockly.Translate('imap_tooltip'));
        this.setHelpUrl(Blockly.Translate('imap_help'));
    },
};

Blockly.JavaScript['imap'] = function (block) {
    const dropdown_instance = block.getFieldValue('INSTANCE');
    const logLevel = block.getFieldValue('LOG');
    const value_name = block.getFieldValue('IMAPNAME');
    const value_search = Blockly.JavaScript.valueToCode(block, 'SEARCH', Blockly.JavaScript.ORDER_ATOMIC);
    const value_max = Blockly.JavaScript.valueToCode(block, 'MAX', Blockly.JavaScript.ORDER_ATOMIC);

    let logText = '';
    if (logLevel) {
        logText = `console.${logLevel}('imap: ' + ${value_max} + ' ' + ${value_name});\n`;
    }

    return `sendTo('imap${dropdown_instance}', 'getBlockly', {\n` +
        `  search: ${value_search},\n` +
        `  max: ${value_max},\n` +
        `  device: '${value_name}',\n` +
        `});\n${logText}`;
};

Blockly.Sendto.blocks['imap_request'] =
    '<sep gap="5"></sep>' +
    '<block type="imap_request">' +
    '     <field name="INSTANCE"></field>' +
    '     <field name="IMAPNAME"></field>' +
    '     <value name="SEARCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">["ALL", ["SINCE", "May 20, 2024"]]</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="FETCH">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">{"fetch": false, "uid": [1,2,3,4]}</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="BODIES">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">{bodies: "", markSeen: false}</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="MAX">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">20</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <field name="MAILPARSER"></field>' +
    '     <field name="LOG"></field>' +
    '     <field name="STATEMENT"></field>' +
    '</block>';

Blockly.Blocks['imap_request'] = {
    init: function () {
        const options_user = [];
        const options_instance = [];

        options_user.push([Blockly.Translate('imap_choose'), 'all']);

        if (typeof main !== 'undefined' && main.instances) {
            for (let i = 0; i < main.instances.length; i++) {
                const m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    options_instance.push(['imap.' + n, '.' + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (let a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            // Checking active in the main.js.
                            const id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + '.' + id, id]);
                        }
                    }
                }
            }
        }
        if (Object.keys(options_instance).length == 0) options_instance.push([Blockly.Translate('no_instance_found'), '']);

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('imap'))
            .appendField(new Blockly.FieldDropdown(options_instance), 'INSTANCE');

        this.appendDummyInput('IMAPNAME')
            .appendField(Blockly.Translate('imap_name'))
            .appendField(new Blockly.FieldDropdown(options_user), 'IMAPNAME');

        this.appendValueInput('SEARCH').appendField(Blockly.Translate('imap_search'));

        this.appendValueInput('FETCH').appendField(Blockly.Translate('imap_fetch'));

        this.appendValueInput('BODIES').appendField(Blockly.Translate('imap_bodies'));

        this.appendValueInput('MAX').appendField(Blockly.Translate('imap_max'));

        this.appendDummyInput('MAILPARSER')
            .appendField(Blockly.Translate('imap_mailparser'))
            .appendField(new Blockly.FieldCheckbox('TRUE'), 'MAILPARSER');

        this.appendDummyInput('LOG')
            .appendField(Blockly.Translate('imap_log'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('imap_log_none'), ''],
                    [Blockly.Translate('imap_log_debug'), 'debug'],
                    [Blockly.Translate('imap_log_info'), 'log'],
                    [Blockly.Translate('imap_log_warn'), 'warn'],
                    [Blockly.Translate('imap_log_error'), 'error'],
                ]),
                'LOG',
            );
        this.appendStatementInput('STATEMENT').setCheck(null);

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);

        this.setTooltip(Blockly.Translate('imap_tooltip_request'));
        this.setHelpUrl(Blockly.Translate('imap_help'));
    },
};

Blockly.JavaScript['imap_request'] = function (block) {
    const dropdown_instance = block.getFieldValue('INSTANCE');
    const logLevel = block.getFieldValue('LOG');
    const value_name = block.getFieldValue('IMAPNAME');
    const value_search = Blockly.JavaScript.valueToCode(block, 'SEARCH', Blockly.JavaScript.ORDER_ATOMIC);
    const value_fetch = Blockly.JavaScript.valueToCode(block, 'FETCH', Blockly.JavaScript.ORDER_ATOMIC);
    const value_bodie = Blockly.JavaScript.valueToCode(block, 'BODIES', Blockly.JavaScript.ORDER_ATOMIC);
    const value_max = Blockly.JavaScript.valueToCode(block, 'MAX', Blockly.JavaScript.ORDER_ATOMIC);
    let value_parse = block.getFieldValue('MAILPARSER');

    if (value_parse === 'TRUE' || value_parse === 'true' || value_parse === true) {
        value_parse = true;
    } else {
        value_parse = false;
    }

    let para_fetch = '';
    if (value_fetch !== null && value_fetch !== '') {
        if (typeof value_fetch === 'object') {
            para_fetch = `JSON.parse(${JSON.stringify(value_fetch)})`;
        } else {
            para_fetch = `JSON.parse(${value_fetch})`;
        }
    }

    let logText = '';
    if (logLevel) {
        logText = `console.${logLevel}('imap_request: ' + ${value_max} + ' ${value_name}');\n`;
    }

    const statement = Blockly.JavaScript.statementToCode(block, 'STATEMENT');
    const command = 'getIMAPRequest';

    return `sendTo('imap${dropdown_instance}', '${command}', {\n` +
        `  name: '${value_name}',\n` +
        `  max: ${value_max},\n` +
        `  search: ${value_search},\n` +
        `  fetch: ${para_fetch || 'null'},\n` +
        `  bodie: ${value_bodie},\n` +
        `  parse: ${value_bodie},\n` +
        `}, async (result) => {\n` +
        statement +
        `});\n${logText}`;
};

Blockly.Sendto.blocks['imap_data'] =
    '<sep gap="5"></sep>' +
    '<block type="imap_data">' +
    '     <field name="INSTANCE"></field>' +
    '     <field name="IMAPNAME"></field>' +
    '     <field name="IMAPVALUE"></field>' +
    '     <field name="LOG"></field>' +
    '     <field name="STATEMENT"></field>' +
    '</block>';

Blockly.Blocks['imap_data'] = {
    init: function () {
        const options_user = [];
        const options_instance = [];

        options_user.push([Blockly.Translate('imap_choose'), 'all']);

        if (typeof main !== 'undefined' && main.instances) {
            for (let i = 0; i < main.instances.length; i++) {
                const m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    options_instance.push(['imap.' + n, '.' + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (let a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            //Checking active in the main.js.
                            const id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + '.' + id, id]);
                        }
                    }
                }
            }
        }
        if (Object.keys(options_instance).length == 0) options_instance.push([Blockly.Translate('no_instance_found'), '']);

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('imap'))
            .appendField(new Blockly.FieldDropdown(options_instance), 'INSTANCE');

        this.appendDummyInput('IMAPNAME')
            .appendField(Blockly.Translate('imap_name'))
            .appendField(new Blockly.FieldDropdown(options_user), 'IMAPNAME');

        this.appendDummyInput('IMAPVALUE')
            .appendField(Blockly.Translate('imap_data'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('imap_data_json'), 'data'],
                    [Blockly.Translate('imap_data_seqno'), 'seqno'],
                ]),
                'IMAPVALUE',
            );

        this.appendDummyInput('LOG')
            .appendField(Blockly.Translate('imap_log'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('imap_log_none'), ''],
                    [Blockly.Translate('imap_log_debug'), 'debug'],
                    [Blockly.Translate('imap_log_info'), 'log'],
                    [Blockly.Translate('imap_log_warn'), 'warn'],
                    [Blockly.Translate('imap_log_error'), 'error'],
                ]),
                'LOG',
            );
        this.appendStatementInput('STATEMENT').setCheck(null);

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Translate('imap_tooltip_data'));
        this.setHelpUrl(Blockly.Translate('imap_help'));
    },
};

Blockly.JavaScript['imap_data'] = function (block) {
    const dropdown_instance = block.getFieldValue('INSTANCE');
    const logLevel = block.getFieldValue('LOG');
    const value_name = block.getFieldValue('IMAPNAME');
    const value_value = block.getFieldValue('IMAPVALUE');

    let logText = '';
    if (logLevel) {
        logText = `console.${logLevel}('imap_data: ${value_name}');\n`;
    }

    const statement = Blockly.JavaScript.statementToCode(block, 'STATEMENT');

    return `sendTo('imap${dropdown_instance}', 'getIMAPData', {\n` +
        `  name: '${value_name}',\n` +
        `  value: '${value_value}',\n` +
        '}, async (result) => {\n' +
        statement +
        `});\n${logText}`;
};
Blockly.Sendto.blocks['imap_flag'] =
    '<sep gap="5"></sep>' +
    '<block type="imap_flag">' +
    '     <field name="INSTANCE"></field>' +
    '     <field name="IMAPNAME"></field>' +
    '     <value name="FLAG">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">setFlags</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="FLAGTYPE">' +
    '         <shadow type="text">' +
    '             <field name="TEXT">Seen</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <value name="UIDNO">' +
    '         <shadow type="math_number">' +
    '             <field name="NUM">0</field>' +
    '         </shadow>' +
    '     </value>' +
    '     <field name="LOG"></field>' +
    '</block>';

Blockly.Blocks['imap_flag'] = {
    init: function () {
        const options_user = [];
        const options_instance = [];

        options_user.push([Blockly.Translate('imap_choose'), 'all']);

        if (typeof main !== 'undefined' && main.instances) {
            for (let i = 0; i < main.instances.length; i++) {
                const m = main.instances[i].match(/^system.adapter.imap.(\d+)$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    options_instance.push(['imap.' + n, '.' + n]);
                    if (main.objects[main.instances[i]].native.hosts) {
                        for (let a = 0; a < main.objects[main.instances[i]].native.hosts.length; a++) {
                            // Checking active in the main.js.
                            const id = main.objects[main.instances[i]].native.hosts[a].user;
                            options_user.push([n + '.' + id, id]);
                        }
                    }
                }
            }
        }
        if (Object.keys(options_instance).length == 0) options_instance.push([Blockly.Translate('no_instance_found'), '']);

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Translate('imap'))
            .appendField(new Blockly.FieldDropdown(options_instance), 'INSTANCE');

        this.appendDummyInput('IMAPNAME')
            .appendField(Blockly.Translate('imap_name'))
            .appendField(new Blockly.FieldDropdown(options_user), 'IMAPNAME');

        this.appendValueInput('FLAG').appendField(Blockly.Translate('imap_flags'));
        this.appendValueInput('FLAGTYPE').appendField(Blockly.Translate('imap_flagtype'));
        this.appendValueInput('UIDNO').appendField(Blockly.Translate('imap_uid'));

        this.appendDummyInput('LOG')
            .appendField(Blockly.Translate('imap_log'))
            .appendField(
                new Blockly.FieldDropdown([
                    [Blockly.Translate('imap_log_none'), ''],
                    [Blockly.Translate('imap_log_debug'), 'debug'],
                    [Blockly.Translate('imap_log_info'), 'log'],
                    [Blockly.Translate('imap_log_warn'), 'warn'],
                    [Blockly.Translate('imap_log_error'), 'error'],
                ]),
                'LOG',
            );

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);

        this.setColour(Blockly.Sendto.HUE);

        this.setTooltip(Blockly.Translate('imap_tooltip_flags'));
        this.setHelpUrl(Blockly.Translate('imap_help'));
    },
};

Blockly.JavaScript['imap_flag'] = function (block) {
    const dropdown_instance = block.getFieldValue('INSTANCE');
    const logLevel = block.getFieldValue('LOG');
    const value_name = block.getFieldValue('IMAPNAME');
    const value_flag = Blockly.JavaScript.valueToCode(block, 'FLAG', Blockly.JavaScript.ORDER_ATOMIC);
    const value_flagtype = Blockly.JavaScript.valueToCode(block, 'FLAGTYPE', Blockly.JavaScript.ORDER_ATOMIC);
    const value_uid = Blockly.JavaScript.valueToCode(block, 'UIDNO', Blockly.JavaScript.ORDER_ATOMIC);

    let logText = '';
    if (logLevel) {
        logText = `console.${logLevel}('imap_flag: ' + ${value_flag} + ' ' + ${value_uid} + ' ${value_name}');\n`;
    }

    return `sendTo('imap${dropdown_instance}', 'getFlags', {\n` +
        `  flag: ${value_flag},\n` +
        `  uid: ${value_uid},\n` +
        `  flagtype: ${value_flagtype},\n` +
        `  name: '${value_name},\n` +
        `});\n${logText}`;
};
