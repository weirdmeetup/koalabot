const { assert } = require('chai');
const Helper = require('hubot-test-helper');
const helper = new Helper('../scripts/gif.js');

suite('gif', () => {
    let room = null;
    const testWord = 'Android';
    describe('user gave a search gif order to hubot.', () => {
        suiteSetup(() => {
            room = helper.createRoom();
            room.user.say('J.Valentine', 'hubot gif ' + testWord);
        });
        suiteTeardown(() => room.destroy());
        test('response gif', () => {
            setTimeout(function() {
                let [name, message] = room.messages[1];
                assert.strictEqual(name, 'hubot');
                if (message === '결과를 못찾겠네여...') {
                    assert.match(message, '결과를 못찾겠네여...');
                } else {
                    assert.match(message, /(http[^"]+\.gif[^"]+)/gi);
                }
            }, 3000);
        });
    });
});
