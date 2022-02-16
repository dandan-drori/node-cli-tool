import {appendFile} from 'fs/promises';

export class Logger {
    Reset = "\x1b[0m";

    FgRed = "\x1b[31m";
    FgGreen = "\x1b[32m";
    FgYellow = "\x1b[33m";
    FgCyan = "\x1b[36m";

    logFilePath = 'logs.txt';

    constructor() {
    }

    info(msg) {
        const colored = `${this.FgCyan}${msg} ${this.Reset}`;
        this.addTimeAndSave(msg, colored);
    }

    warn(msg) {
        const colored = `${this.FgYellow}${msg} ${this.Reset}`;
        this.addTimeAndSave(msg, colored);
    }

    error(msg) {
        const colored = `${this.FgRed}${msg} ${this.Reset}`;
        this.addTimeAndSave(msg, colored);
    }

    addTimeAndSave(msg, colored) {
        const time = new Date().toLocaleTimeString();
        const date = new Date().toLocaleDateString();
        console.log(`${this.FgGreen}${time} - ${date} - ${this.Reset}${colored}`);
        appendFile(`./${this.logFilePath}`, `${time} - ${date} - ${msg}\n`);
    }
}
