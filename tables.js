const { TABLE_TYPE } = require('./types');

module.exports = {
    [TABLE_TYPE.SERVICE]: [
        'let',
        'const',
        'number',
        'if',
        'else',
    ],
    [TABLE_TYPE.SEPARATOR]: [
        ':',
        ';',
        '(',
        ')',
        '{',
        '}',
        '>',
        '=',
        '+',
        '-',
        '<=',
        '==',
        '===',
        '>=',
        '!=',
        '!==',
    ],
    [TABLE_TYPE.IDENTIFIER]: [],
    [TABLE_TYPE.LITERAL]: [],
    [TABLE_TYPE.STANDART]: [],
};
