
var {
	random,
	generateUUID,
	getRequests,
	getLastCommitter,
	validate,
    getRepos
} = require('../src/index.js');

describe('index.js test file', () => {
    test('canary', () => {
        expect(true).toEqual(true);
    });

    describe('expect a random function to return a random number', () => {
        test('expect a random function to return a number given no range', () => {
            expect(typeof random()).toEqual('number');
        });

        test('expect a random function within a range of [1 to 10]', () => {
            var rng = random(1, 10);
            var result = (rng >= 1 && rng <= 10);
            expect(result).toEqual(true);
        });
    });
    
});