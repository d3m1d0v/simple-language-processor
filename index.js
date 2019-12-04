const { scanner, process, printResult } = require('./scanner');

const input = `
    const a: number = 432;
    let b: number;
    let c: number;

    b = 3; # комментарий ; b = 9999;

    if (a === b) {
        c = a + b;
    } else {
        c = b - a;
    }
`;

process(scanner(input));
printResult();
