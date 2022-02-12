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

    async info(msg) {
        const colored = `${this.FgCyan}${msg} ${this.Reset}`;
        await this.addTimeAndSave(msg, colored);
    }

    async warn(msg) {
        const colored = `${this.FgYellow}${msg} ${this.Reset}`;
        await this.addTimeAndSave(msg, colored);
    }

    async error(msg) {
        const colored = `${this.FgRed}${msg} ${this.Reset}`;
        await this.addTimeAndSave(msg, colored);
    }

    async addTimeAndSave(msg, colored) {
        const time = new Date().toLocaleTimeString();
        const date = new Date().toLocaleDateString();
        console.log(`${this.FgGreen}${time} - ${date} - ${this.Reset}${colored}`);
        await appendFile(`./${this.logFilePath}`, `${time} - ${date} - ${msg}`);
    }
}
