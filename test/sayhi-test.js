const assert = require("chai").assert
const Helper = require("hubot-test-helper")
const helper = new Helper("../scripts/sayhi.js")

suite("hi", () => {
  let room = null
  suite("user say hi to hubot", () => {
    suiteSetup(() => {
      room = helper.createRoom()
      room.user.say("jin", "hubot hi")
    })
    suiteTeardown(() => room.destroy())
    test("returns nothing", () => {
      let [name, message] = room.messages[1]
      assert.strictEqual(name, "hubot")
      assert.match(message, /^:koala: /)
    })
  })
})

