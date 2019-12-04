const { SCANNER_STATE, TOKEN_PRE_TYPE, TABLE_TYPE } = require('./types');
const tables = require('./tables');

const isDigit = value => /\d/.test(value);
const isChar = value => /[a-zA-Z_]/.test(value);
const isCharOrDigit = value => /\w/.test(value);
const isSharp = value => value === '#';
const isSeparator = value => /[:;=\(\)>\{\}\+\-!]{1}/.test(value);
const isSpace = value => /\s/.test(value);
const isNewLine = value => value === '\n';

/**
 * @param {string} state SCANNER_STATE
 * @returns {string} TOKEN_PRE_TYPE
 */
function mapScannerStateToTokenPreType (state) {
    switch (state) {
        case SCANNER_STATE.DIGIT: return TOKEN_PRE_TYPE.LITERAL;
        case SCANNER_STATE.SEPARATOR: return TOKEN_PRE_TYPE.SEPARATOR;
        case SCANNER_STATE.IDENTIFIER: return TOKEN_PRE_TYPE.IDENTIFIER;
        default: throw new Error('Unexpected scanner state');
    }
}

/**
 * @typedef {Object} ScannerResultItem
 * @property {string} value
 * @property {string} type TOKEN_PRE_TYPE
 *
 * @typedef {Array<ScannerResultItem>} ScannerResult
 */

/**
 * @param {string} input input string
 * @returns {ScannerResult}
 */
function scanner(input) {
    let idx = 0;
    let state = SCANNER_STATE.START;
    let buffer = [];
    const output = [];

    const getSymbol = () => input[idx];

    const next = () => idx++;
    const add = () => buffer.push(getSymbol());
    const out = () => output.push({ value: buffer.join(''), type: mapScannerStateToTokenPreType(state) });
    const clear = () => (buffer = []);
    const setState = (newState) => (state = newState);
    const error = () => { throw new Error(`Unexpected symbol: ${getSymbol()}`); };

    while (idx < input.length) {
        const symbol = getSymbol();

        // console.log('idx=', idx, 'symbol=', symbol, 'state=', state);

        switch(state) {
            case SCANNER_STATE.START: {
                if (isDigit(symbol)) {
                    setState(SCANNER_STATE.DIGIT);
                } else if (isSpace(symbol)) {
                    next();
                } else if (isSharp(symbol)) {
                    setState(SCANNER_STATE.COMMENT);
                    next();
                } else if (isSeparator(symbol)) {
                    setState(SCANNER_STATE.SEPARATOR);
                } else if (isChar(symbol)) {
                    setState(SCANNER_STATE.IDENTIFIER);
                } else {
                    error();
                }

                break;
            }

            case SCANNER_STATE.DIGIT: {
                if (isDigit(symbol)) {
                    add();
                    next();
                } else {
                    out();
                    clear();
                    setState(SCANNER_STATE.START);
                }

                break;
            }

            case SCANNER_STATE.COMMENT: {
                if (isNewLine(symbol)) {
                    next();
                    setState(SCANNER_STATE.START);
                } else {
                    next();
                }

                break;
            }

            case SCANNER_STATE.SEPARATOR: {
                if (isSeparator(symbol)) {
                    add();
                    next();
                } else {
                    out();
                    clear();
                    setState(SCANNER_STATE.START);
                }

                break;
            }

            case SCANNER_STATE.IDENTIFIER: {
                if (isCharOrDigit(symbol)) {
                    add();
                    next();
                } else {
                    out();
                    clear();
                    setState(SCANNER_STATE.START);
                }

                break;
            }

            default: error();
        }
    }

    return output;
}

/**
 * @param {ScannerResult} result
 */
function process(result) {
    for (let item of result) {
        switch(item.type) {
            case TOKEN_PRE_TYPE.SEPARATOR: {
                const { value } = item;
                const idx = tables[TABLE_TYPE.SEPARATOR].indexOf(value);

                if (idx === -1) {
                    throw new Error(`Undefined separator: ${value}`);
                }

                tables[TABLE_TYPE.STANDART].push({
                    value,
                    link: {
                        idx,
                        table: TABLE_TYPE.SEPARATOR,
                    },
                });

                break;
            }

            case TOKEN_PRE_TYPE.LITERAL: {
                const { value } = item;
                const table = tables[TABLE_TYPE.LITERAL];

                let idx = table.indexOf(value);
                if (idx === -1) {
                    idx = table.push(value) - 1;
                }

                tables[TABLE_TYPE.STANDART].push({
                    value,
                    link: {
                        idx,
                        table: TABLE_TYPE.LITERAL,
                    },
                });

                break;
            }

            case TOKEN_PRE_TYPE.IDENTIFIER: {
                const { value } = item;
                let tableType;
                let idx;

                if ((idx = tables[TABLE_TYPE.SERVICE].indexOf(value)) !== -1) {
                    tableType = TABLE_TYPE.SERVICE;
                } else {
                    tableType = TABLE_TYPE.IDENTIFIER;
                    const table = tables[tableType];

                    if ((idx = table.indexOf(value)) === -1) {
                        idx = table.push(value) - 1;
                    }
                }

                tables[TABLE_TYPE.STANDART].push({
                    value,
                    link: {
                        idx,
                        table: tableType
                    },
                });

                break;
            }
        }
    }
}

/**
 * @param {ScannerResult} result
 */
function printPreResult(result) {
    const mapper = {
        [TOKEN_PRE_TYPE.LITERAL]: 'литерал',
        [TOKEN_PRE_TYPE.SEPARATOR]: 'разделитель',
        [TOKEN_PRE_TYPE.IDENTIFIER]: 'идентификатор',
    };

    const output = result.reduce((acc, item) => {
        acc.push(`\t${item.value}\t${mapper[item.type]}`);

        return acc;
    }, ['\tЛексема\tПредварительный тип\n']);

    console.log(output.join('\n'));
}

function printResult() {
    console.log('\tТаблица служебных слов\n');
    console.log('\tИндекс\tЗначение');
    tables[TABLE_TYPE.SERVICE].forEach((value, idx) => console.log(`\t${idx}\t${value}`));
    console.log('\n\n');

    console.log('\tТаблица разделителей\n');
    console.log('\tИндекс\tЗначение');
    tables[TABLE_TYPE.SEPARATOR].forEach((value, idx) => console.log(`\t${idx}\t${value}`));
    console.log('\n\n');

    console.log('\tТаблица литералов\n');
    console.log('\tИндекс\tЗначение');
    tables[TABLE_TYPE.LITERAL].forEach((value, idx) => console.log(`\t${idx}\t${value}`));
    console.log('\n\n');

    console.log('\tТаблица идентификаторов\n');
    console.log('\tИндекс\tЗначение');
    tables[TABLE_TYPE.IDENTIFIER].forEach((value, idx) => console.log(`\t${idx}\t${value}`));
    console.log('\n\n');

    console.log('\tТаблица стандартных символов\n');
    console.log('\tЗначение\tСсылка');
    tables[TABLE_TYPE.STANDART].forEach(({ value, link: { table, idx } }) => console.log(`\t${value}\t(${table}, ${idx})`));
}

module.exports = {
    scanner,
    process,
    printPreResult,
    printResult,
};
