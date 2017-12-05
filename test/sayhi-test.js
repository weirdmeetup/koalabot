/* global suite, suiteSetup, suiteTeardown, test */
const { assert } = require('chai')
const Helper = require('hubot-test-helper')
const helper = new Helper('../scripts/sayhi.js')

suite('hi', () => {
  let room = null
  suite('user say hi to hubot', () => {
    suiteSetup(() => {
      room = helper.createRoom()
      room.user.say('jin', 'hubot hi')
    })
    suiteTeardown(() => room.destroy())
    test('response hi', () => {
      let [name, message] = room.messages[1]
      assert.strictEqual(name, 'hubot')
      assert.match(message, /^:koala: /)
    })
  })
})
