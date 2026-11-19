"use strict";

/*
 * The answer of the message "help": what the instance answers, written for AI agents (e.g. ioBroker.pi-agent or
 * the MCP server with send_to) and script authors. Keep it in sync with onMessage in main.js.
 */

/** Every command onMessage answers; write = it changes something. */
const COMMANDS = [
    { command: "help", write: false },
    { command: "getIMAPRequest", write: false },
    { command: "getIMAPData", write: false },
    { command: "getFlags", write: true },
    { command: "getBlockly", write: true },
    { command: "getIconList", write: false },
    { command: "getTokenList", write: false },
    { command: "getNodeList", write: false },
];

const HELP = `ioBroker.imap: watches IMAP mail accounts and shows the newest mails of each account in states (subject, sender,
date, text, flags) for vis and scripts. An agent can search and read mails, mark them (read, flagged, deleted), move
or copy them to another folder and create, rename or delete folders. Mails are private (see the end).

Accounts: name = the IMAP user name of an account as in the settings (e.g. "me@example.com"). Its states are below
imap.0.<account>, <account> = that name with "@", "." and other special characters replaced by "_" (e.g.
imap.0.me_example_com); both forms are accepted as name. The account must be online (<account>.online). Everything
works in the active folder of the account (<account>.active_inbox, usually INBOX). A mail is identified by its uid
(attrs.uid, json[].uid, email.email_xx.uid).
Search criteria (IMAP, ANDed): a list such as ["UNSEEN"], ["ALL", ["SINCE", "2026-11-18"]], ["ALL", ["FROM",
"anna@example.com"]], ["ALL", ["SUBJECT", "invoice"]], ["ALL", ["TEXT", "word"]], ["FLAGGED"].

Commands (sendTo imap.0):
- getIMAPRequest {name, search, max, fetch, bodie, parse}: all required. Searches the active folder and reads the
  newest max (1-99) matching mails: [{body, seqno, attrs: {uid, flags, date, ...}, info, user}]; with parse true
  body is the parsed mail {subject, from: {text, value: [{address, name}]}, to, date, text, html, attachments}.
  fetch {fetch: false} = search; {fetch: true, uid: [uids]} = read these mails (search and max are then only
  checked). bodie = fetch options: {bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)"} reads only the headers (fast,
  use it to list), {bodies: ""} the whole mail with attachments (large: only for single mails); markSeen: true
  would mark them as read. Errors: a text in the system language (e.g. "Mailbox is empty") or false; no answer
  if a parameter is missing or invalid.
- getIMAPData {name, value}: value "data" = the mails the adapter loaded for the account with its configured search
  (the ones in the states, newest first, parsed as above with seqno and attrs); "seqno" = the uids of all mails
  matching that search.
- getFlags {name, uid, flag, flagtype}: changes the flags of one mail: flag setFlags (replace), addFlags or
  delFlags with flagtype Seen, Flagged, Answered, Deleted or Draft (several separated by commas); setKeywords,
  addKeywords or delKeywords with own keywords (if <account>.status has newKeywords true). No answer; the change
  shows in the states. Deleted only marks the mail for deletion (a mail program removes it with expunge).
- getBlockly {device, search, max}: changes which mails the adapter shows in the states until its restart: search
  = criteria as JSON text (e.g. '["UNSEEN"]'), max = number of mails (1-99), device = account name or "all". No
  answer when it worked.
- getIconList, getTokenList, getNodeList: for the settings, not for agents.

States (imap.0.<account>.*): json (JSON list of the loaded mails: uid, date, from, from_name, to, subject, text,
flag, attach ...), email.email_01 ... (newest first: subject, from, receive, content, uid, flag), total,
total_unread, active_inbox, online, status. To change the mailbox write with ack false:
- remote.move.folder and remote.move.uid, then remote.move.apply_move true: moves the mail to that folder;
  remote.copy.folder / uid / apply_copy copy it. Or in one write: remote.vis_command "move<L><uid><L><folder>"
  (or "copy<L>..."). The folder names are the states list of the object remote.move.folder.
- remote.change_folder "<folder>": watch and show another folder; remote.reload_emails true: read the mails again.
- remote.mailbox_folder_create "<folder>", remote.mailbox_folder_delete "<folder>",
  remote.mailbox_folder_change_name '["<old>", "<new>"]': create, delete or rename a folder of the mail account.

How to talk to the user:
- Mails are private: read and quote them only for the user who asks; never forward, send or show them to anybody
  else without the user's explicit request.
- If several accounts are configured and the user names none, ask which one.
- List mails by sender name, subject and local date and time; read the full text only of the mail the user wants.
- Marking, moving and copying mails and creating or renaming folders only on the user's request; deleting (flag
  Deleted, mailbox_folder_delete) only after the user confirmed which mail or folder.`;

module.exports = { COMMANDS, HELP };
