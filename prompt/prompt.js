import inquirer from "inquirer";
import {Modes} from "../models/model.js";

export async function getSymbols() {
    const answers = await inquirer.prompt({
        name: 'symbols',
        type: 'input',
        message: 'Choose stock symbols:',
        default() {
            return 'ZI'; // return 'ZI,TSLA,AAPL,MSFT,GOOGL,AMZN,S&P 500,U';
        }
    });
    return answers.symbols.toUpperCase();
}

export async function getMode() {
    const answers = await inquirer.prompt({
        name: 'mode',
        type: 'list',
        message: 'Choose api mode:\n',
        choices: [
            'Offline (cache only)',
            'Normal (prefer cache)',
            'Override (no cache)'
        ]
    });
    const modes = {
        'Offline (cache only)': Modes.CACHE_ONLY,
        'Normal (prefer cache)': Modes.NORMAL,
        'Override (no cache)': Modes.NO_CACHE,
    };
    return modes[answers.mode];
}

export async function getDataFromUser() {
    const symbols = await getSymbols();
    const mode = await getMode();
    return {
        symbols,
        mode
    };
}
