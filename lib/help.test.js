"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const fs = require("node:fs");
const path = require("node:path");
const { COMMANDS, HELP } = require("./help");

/**
 * The commands of onMessage in main.js
 *
 * @returns {string[]} command names
 */
function answeredCommands() {
    const source = fs.readFileSync(path.join(__dirname, "../main.js"), "utf8");
    const start = source.indexOf("async onMessage(");
    const end = source.indexOf("async setStateSearch(");
    expect(start).to.be.greaterThan(0);
    expect(end).to.be.greaterThan(start);
    const handler = source.slice(start, end);
    return [
        ...new Set([
            ...[...handler.matchAll(/case "([^"]+)":/g)].map(m => m[1]),
            ...[...handler.matchAll(/obj\?\.command === "([^"]+)"/g)].map(m => m[1]),
        ]),
    ];
}

describe("help", () => {
    it("lists exactly the commands onMessage answers, each once", () => {
        const listed = COMMANDS.map(entry => entry.command);
        expect(new Set(listed).size).to.equal(listed.length);
        expect([...listed].sort()).to.deep.equal(answeredCommands().sort());
    });

    it("marks the commands that change the mailbox or the monitored search as write", () => {
        const write = COMMANDS.filter(entry => entry.write).map(entry => entry.command);
        expect(write.sort()).to.deep.equal(["getBlockly", "getFlags"]);
    });

    it("names every command and keeps the lines short", () => {
        for (const { command } of COMMANDS.filter(entry => entry.command !== "help")) {
            expect(HELP, command).to.include(command);
        }
        expect(HELP).to.include("Commands (sendTo imap.0");
        expect(HELP).to.include("How to talk to the user:");
        expect(HELP).to.include("Mails are private");
        for (const line of HELP.split("\n")) {
            expect(line.length, line).to.be.at.most(120);
        }
    });
});
