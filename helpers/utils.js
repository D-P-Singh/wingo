function pickNumber() {
    return Math.floor(Math.random() * 10);
}

function numberToColor(n) {
    if (n === 0 || n === 5) return 'violet';
    return (n % 2 === 0) ? 'green' : 'red';
}

function numberToBigSmall(n) {
    return n >= 5 ? 'Big' : 'Small';
}

module.exports = { pickNumber, numberToColor, numberToBigSmall };
