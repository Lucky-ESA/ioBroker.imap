![Logo](../../admin/imap.png)

# ioBroker.imap

> [!WARNING]
> Dieser Adapter kann das System sehr schnell zum Absturz bringen.
> Daher bitte diese Beschreibung aufmerksam durchlesen.

# Zusammenfassung

-   Instanz Einstellungen - [Einstellungen TAB IMAP](#instanz-konfiguration-tab-imap-erstellen) - [Einstellungen TAB Symbole](#instanz-konfiguration-tab-symbole-erstellen) - [Einstellungen TAB Mailparser](#instanz-konfiguration-tab-mailparser-optionen-erstellen)
    [Test](#datenpunkte-`imap.0.benutzername.remote.move`)
    [Test](#datenpunkte-imap.0.benutzername.remote.move)

# Beschreibungen

### Instanz Konfiguration TAB IMAP erstellen

-   `Aktiv`: IMAP Verbindung aktivieren
-   `Host`: z. Bsp. imap.gmail.com
-   `Posteingang`: Standard INBOX - Box die Überwacht werden soll - Mögliche Auswahl siehe imap.0.xxx.remote.change_folder
-   `Port`: Standard 993
-   `Nutzername`: Benutzername - Instanz muss aktiviert sein!!!
-   `Passwort`: Passwort - Instanz muss aktiviert sein!!!

![imap_create_1.png](img/imap_create_1.png)

-   `max.`: Maximale Anlage als Datenpunkte email_01...email_02... (1-99)
-   `max. HTML`: Maximale Anzahl von eMails als HTML. Spööte größer sein als max. Datenpunkte (1-99)
-   `TLS`: TLS-Verbindung verwenden - Standard ist true
-   `Flaggen`:

```
ALL - alle – Alle Nachrichten.
ANSWERED - geantwortet – Nachrichten mit gesetzter Beantwortet-Flagge.
DELETED - gelöscht – Nachrichten mit gesetzter Gelöscht-Flagge.
DRAFT - Entwurf – Nachrichten mit gesetzter Entwurfsflagge.
FLAGGED - gekennzeichnet – Nachrichten mit gesetzter Flagge.
NEW - neu – Nachrichten, bei denen das Flag „Zuletzt verwendet“ gesetzt ist, aber nicht das Flag „Gesehen“.
SEEN - gesehen – Nachrichten, bei denen das Flag „Gesehen“ gesetzt ist.
RECENT - jüngste – Nachrichten, bei denen das Flag „Zuletzt verwendet“ gesetzt ist.
OLD - alt – Nachrichten, für die das Flag „Zuletzt verwendet“ nicht gesetzt ist. Dies entspricht funktional !RECENT (im Gegensatz zu „!NEW“).
UNANSWERED - unbeantwortet – Nachrichten, bei denen das Flag „Beantwortet“ nicht gesetzt ist.
UNDELETED - ungelöscht – Nachrichten, für die das Flag „Gelöscht“ nicht gesetzt ist.
UNDRAFT - kein Entwurf – Nachrichten, bei denen das Draft-Flag nicht gesetzt ist.
UNFLAGGED - ungekennzeichnet – Nachrichten, für die das Flag „Markiert“ nicht gesetzt ist.
UNSEEN - ungesehen – Nachrichten, bei denen das Flag „Gesehen“ nicht gesetzt ist.
```

-   `Symbol auswählen`: Symbol für den Ordner (unter TAB `Symbole erstellen` hochladen)

![imap_create_icon.png](img/imap_create_icon.png)

-   `tls-Option`: Standard ist {"rejectUnauthorized": false}
-   `Auto-TLS`: Mögliche Auswahl ist `always`, `required` and `never`. Standard ist never
    **Für mehr Informationen bitte [hier](https://www.npmjs.com/package/node-imap) lesen.**

![imap_create_2.png](img/imap_create_2.png)

-   `Att.`: Um das Feld HTML zu füllen müssen Anhänge mit geladen werden. Das verbraucht sehr viel RAM!!! Daher Standard `false`
-   `Mailparser-Option`: Mailparser-Option (erst unter TAB `MAILPARSER-OPTIONEN` erstellen)

![imap_create_3.png](img/imap_create_3.png)

-   `max. MEMRSS-Limit:` Ab wann die u. a. Aktion ausgelöst wird.
-   `Neu starten:` Ist das MEMRSS Limit erreicht wird der Adapter neu gestartet. Es wird allerdings nur alle 24h geprüft.

![imap_create_restart.png](img/imap_create_restart.png)

-   `Datenpunkt:` Ist das MEMRSS Limit erreicht wird der ausgewählt Datenpunkt auf `true` gesetzt. Dieser muss manuell zurückhesetzt werden. Es wird allerdings nur alle 24h geprüft.

![imap_create_datapoint.png](img/imap_create_datapoint.png)

-   `Senden:` Ist das MEMRSS Limit erreicht wird eine Nachricht versendet. Es wird dann bei jeder Aktualisierung von `MEMRSS` eine Nachricht versendet.
    -   `Instanzen:` Beispiel: telegram.0,telegram.1,pushover.0
    -   `Instanzen Benutzer:` Beispiel: Peter,Olaf,Thomas

![imap_create_send.png](img/imap_create_send.png)

### Instanz Konfiguration TAB Symbole erstellen

-   `Symbolname:` Name für das Symbol. Bitte keine doppelten Namen verwenden. Es wird dann bei Adapterstart ein Error im Logeintrag generiert.
-   `Upload:` Das Icon hochladen.

![imap_create_icon.png](img/imap_create_symbol.png)

### Instanz Konfiguration TAB Mailparser Optionen erstellen

-   `Name:` Name vom Mailparser. Bitte keine doppelten Namen verwenden. Es wird dann bei Adapterstart ein Error im Logeintrag generiert. Genaue Beschreibung kann [hier](https://nodemailer.com/extras/mailparser/) gelesen werden.
-   `HTML in Text überspringen:` Generiert keinen Klartext aus HTML
-   `Maximale HTML-Länge zum Parsen:` Die maximale Menge an zu analysierendem HTML in Bytes. Wird diese überschritten werden nur Header Daten generiert.
-   `Bildlinks überspringen:` Überspringt die Konvertierung von CID-Anhängen in Daten-URL-Bilder. Bilder werden nicht als base64 konvertiert was `enormen RAM Verbrauch` einspart.
-   `Text in HTML überspringen:` Generiert kein HTML aus Klartextnachrichten
-   `Textlinks überspringen:` Verlink keine Links in Klartextinhalten

![imap_create_mailparser.png](img/imap_create_mailparser.png)

### Datenpunkte `imap.0`

| Object                | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| imap.0.json_imap      | Name der IMAP Verbindung mit der letzten Aktivität                 |
| imap.0.json_table     | Letzte Aktualisierung einer IMAP Verbindung als JSON Table für VIS |
| imap.0.online_counter | Anzahl der aktiven IMAP Verbindungen                               |
| imap.0.online_history | History der Verbindungsaktivitäten als JSON                        |

![imap_total_overview.png](img/imap_total_overview.png)

### Datenpunkte `imap.0.benutzername`

| Object                             | Description                                                      |
| ---------------------------------- | ---------------------------------------------------------------- |
| imap.0.xxx.active_inbox            | Aktive Inbox                                                     |
| imap.0.xxx.host                    | Hostname                                                         |
| imap.0.xxx.html                    | HTML Code für VIS                                                |
| imap.0.xxx.json                    | JSON Table für VIS                                               |
| imap.0.xxx.last_activity           | Letzte Aktivität                                                 |
| imap.0.xxx.last_activity_json      | Welche Aktivität als JSON                                        |
| imap.0.xxx.last_activity_timestamp | Zeitstempel der letzten Aktivität                                |
| imap.0.xxx.online                  | Status der IMAP Verbindung                                       |
| imap.0.xxx.quality                 | Qualität aller Datenpunkte als JSON. Wird alle 24h aktualisiert. |
| imap.0.xxx.status                  | Infos zur IMAP Verbindung als JSON                               |
| imap.0.xxx.total                   | Anzahl der Mails der aktiven Inbox                               |
| imap.0.xxx.total_unread            | Anzahl der ungelesenen Mails der aktiven Inbox                   |

![imap_overview_1.png](img/imap_overview_1.png)

### Datenpunkte `imap.0.benutzername.email.email_xx`

| Object                                | Description |
| ------------------------------------- | ----------- |
| imap.0.xxx.email.email_01.attach      |             |
| imap.0.xxx.email.email_01.attach_json |             |
| imap.0.xxx.email.email_01.attach_json |             |
| imap.0.xxx.email.email_01.flag        |             |
| imap.0.xxx.email.email_01.from        |             |
| imap.0.xxx.email.email_01.receive     |             |
| imap.0.xxx.email.email_01.seq         |             |
| imap.0.xxx.email.email_01.size        |             |
| imap.0.xxx.email.email_01.subject     |             |
| imap.0.xxx.email.email_01.texthtml    |             |
| imap.0.xxx.email.email_01.to          |             |
| imap.0.xxx.email.email_01.uid         |             |

### Datenpunkte `imap.0.benutzername.infos`

| Object                                      | Description |
| ------------------------------------------- | ----------- |
| imap.0.xxx.infos.all_capability             |             |
| imap.0.xxx.infos.auth_cram-md5              |             |
| imap.0.xxx.infos.auth_xoauth                |             |
| imap.0.xxx.infos.auth_xoauth2               |             |
| imap.0.xxx.infos.condstore                  |             |
| imap.0.xxx.infos.esearch                    |             |
| imap.0.xxx.infos.id                         |             |
| imap.0.xxx.infos.idle                       |             |
| imap.0.github*luckyskills_de.infos.literal* |             |
| imap.0.xxx.infos.logindisabled              |             |
| imap.0.xxx.infos.logindisabled              |             |
| imap.0.xxx.infos.namespace                  |             |
| imap.0.xxx.infos.quota                      |             |
| imap.0.xxx.infos.sasl-ir                    |             |
| imap.0.xxx.infos.sort                       |             |
| imap.0.xxx.infos.sort_display               |             |
| imap.0.xxx.infos.starttls                   |             |
| imap.0.xxx.infos.thread_orderedsubject      |             |
| imap.0.xxx.infos.thread_references          |             |
| imap.0.xxx.infos.unselect                   |             |
| imap.0.xxx.infos.x-gm-ext-1                 |             |

### Datenpunkte `imap.0.benutzername.remote`

| Object                          | Description |
| ------------------------------- | ----------- |
| imap.0.xxx.remote.apply_html    |             |
| imap.0.xxx.remote.change_folder |             |
| imap.0.xxx.remote.criteria      |             |
| imap.0.xxx.remote.reload_emails |             |
| imap.0.xxx.remote.search_start  |             |
| imap.0.xxx.remote.show_mails    |             |
| imap.0.xxx.remote.vis_command   |             |

### Datenpunkte `imap.0.benutzername.remote.copy`

| Object                            | Description |
| --------------------------------- | ----------- |
| imap.0.xxx.remote.copy.apply_copy |             |
| imap.0.xxx.remote.copy.folder     |             |
| imap.0.xxx.remote.copy.uid        |             |

### Datenpunkte `imap.0.benutzername.remote.flag`

| Object                            | Description |
| --------------------------------- | ----------- |
| imap.0.xxx.remote.flag.apply_flag |             |
| imap.0.xxx.remote.flag.set        |             |
| imap.0.xxx.remote.flag.type       |             |
| imap.0.xxx.remote.flag.uid        |             |

### Datenpunkte `imap.0.benutzername.remote.html`

| Object                                           | Description                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| imap.0.xxx.remote.html.body_background           | Tabelle Hintergrundfarbe - Standard #000000                                                     |
| imap.0.xxx.remote.html.choose_content            | Feld aus der eMail anzeigen. </br>Mögliche Felder sind html, text, textAsHtml und html convert. |
| imap.0.xxx.remote.html.header_border             | Randstärke Header - Standard 2 px                                                               |
| imap.0.xxx.remote.html.header_font               | Schriftart Header - Standard Helvetica                                                          |
| imap.0.xxx.remote.html.header_font_size          | Schriftgröße Header - Standard 15 px                                                            |
| imap.0.xxx.remote.html.header_linear_color_1     | Farbverlauf Hintergrund Header Wert 1 - Standard #424242                                        |
| imap.0.xxx.remote.html.header_linear_color_2     | Farbverlauf Hintergrund Header Wert 2 - Standard #424242                                        |
| imap.0.xxx.remote.html.header_tag_border_color   | Randfarbe Header - Standard #424242 - Alles möglich                                             |
| imap.0.xxx.remote.html.header_text_color         | Header Textfarbe - Standard #BDBDBD                                                             |
| imap.0.xxx.remote.html.header_width              | Header Breite - Standard auto - Möglich px oder %                                               |
| imap.0.xxx.remote.html.headline_align_column_1   | Textausrichtung Header Spalte 1 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_2   | Textausrichtung Header Spalte 2 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_3   | Textausrichtung Header Spalte 3 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_4   | Textausrichtung Header Spalte 4 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_5   | Textausrichtung Header Spalte 5 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_6   | Textausrichtung Header Spalte 6 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_7   | Textausrichtung Header Spalte 7 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_8   | Textausrichtung Header Spalte 8 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_9   | Textausrichtung Header Spalte 9 - Standard center </br> Möglich center, left, right unf auto    |
| imap.0.xxx.remote.html.headline_align_column_10  | Textausrichtung Header Spalte 10 - Standard center </br> Möglich center, left, right unf auto   |
| imap.0.xxx.remote.html.headline_color            |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_1   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_2   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_3   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_4   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_5   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_6   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_7   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_8   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_9   |                                                                                                 |
| imap.0.xxx.remote.html.headline_column_width_10  |                                                                                                 |
| imap.0.xxx.remote.html.headline_font_size        |                                                                                                 |
| imap.0.xxx.remote.html.headline_height           |                                                                                                 |
| imap.0.xxx.remote.html.headline_style            |                                                                                                 |
| imap.0.xxx.remote.html.headline_underlined       |                                                                                                 |
| imap.0.xxx.remote.html.headline_underlined_color |                                                                                                 |
| imap.0.xxx.remote.html.jarvis                    |                                                                                                 |
| imap.0.xxx.remote.html.mails_even_color          |                                                                                                 |
| imap.0.xxx.remote.html.mails_nextday_color_even  |                                                                                                 |
| imap.0.xxx.remote.html.mails_nextday_color_odd   |                                                                                                 |
| imap.0.xxx.remote.html.mails_odd_color           |                                                                                                 |
| imap.0.xxx.remote.html.mails_today_color         |                                                                                                 |
| imap.0.xxx.remote.html.mails_today_color_odd     |                                                                                                 |
| imap.0.xxx.remote.html.p_tag_text_align          |                                                                                                 |
| imap.0.xxx.remote.html.short_content             |                                                                                                 |
| imap.0.xxx.remote.html.short_subject             |                                                                                                 |
| imap.0.xxx.remote.html.table_tag_border_color    |                                                                                                 |
| imap.0.xxx.remote.html.table_tag_cell            |                                                                                                 |
| imap.0.xxx.remote.html.table_tag_text_align      |                                                                                                 |
| imap.0.xxx.remote.html.table_tag_width           |                                                                                                 |
| imap.0.xxx.remote.html.td_tag_2_colums           |                                                                                                 |
| imap.0.xxx.remote.html.td_tag_border_bottom      |                                                                                                 |
| imap.0.xxx.remote.html.td_tag_border_color       |                                                                                                 |
| imap.0.xxx.remote.html.td_tag_border_right       |                                                                                                 |
| imap.0.xxx.remote.html.td_tag_cell               |                                                                                                 |
| imap.0.xxx.remote.html.text_content              |                                                                                                 |
| imap.0.xxx.remote.html.text_date                 |                                                                                                 |
| imap.0.xxx.remote.html.text_flag                 |                                                                                                 |
| imap.0.xxx.remote.html.text_from                 |                                                                                                 |
| imap.0.xxx.remote.html.text_id                   |                                                                                                 |
| imap.0.xxx.remote.html.text_move_or_copy         |                                                                                                 |
| imap.0.xxx.remote.html.text_select_addflag       |                                                                                                 |
| imap.0.xxx.remote.html.text_select_copy          |                                                                                                 |
| imap.0.xxx.remote.html.text_select_delflag       |                                                                                                 |
| imap.0.xxx.remote.html.text_select_move          |                                                                                                 |
| imap.0.xxx.remote.html.text_select_setflag       |                                                                                                 |
| imap.0.xxx.remote.html.text_seq                  |                                                                                                 |
| imap.0.xxx.remote.html.text_setflag              |                                                                                                 |
| imap.0.xxx.remote.html.text_subject              |                                                                                                 |
| imap.0.xxx.remote.html.text_uid                  |                                                                                                 |
| imap.0.xxx.remote.html.top_font                  |                                                                                                 |
| imap.0.xxx.remote.html.top_font_size             |                                                                                                 |
| imap.0.xxx.remote.html.top_font_weight           |                                                                                                 |
| imap.0.xxx.remote.html.top_text                  |                                                                                                 |
| imap.0.xxx.remote.html.top_text_color            |                                                                                                 |

### Datenpunkte `imap.0.benutzername.remote.move`

| Object                            | Description |
| --------------------------------- | ----------- |
| imap.0.xxx.remote.move.apply_move |             |
| imap.0.xxx.remote.move.folder     |             |
| imap.0.xxx.remote.move.uid        |             |
