// Description:
//   인사를 돌려줍니다.
//
// Commands:
//   hubot 안녕|하이|헬로|hi|hello|hey

let prefix = ":koala:";
let responses = [
  '안녕하세요?',
  '아녕하세여',
  '후훗 하이',
  '아령하세여',
  '안뇽',
  '아리영',
  '욥',
  '네',
  '잘 지내시죠?',
  '안녕',
  '아안녀엉하아세에요오',
  '누구세요',
  'sup?',
  '안녕하세욤',
  '안녕하세요오',
  '밥은 드셨나요?',
  'hi',
  'hello',
  '헬로우',
  'yeah',
  'bro',
  '코알라는 참을성이 없습니다',
  "'undefined' is not a function",
  "exception raised: unhandled page fault on read access to 0x00000000 at address 0x100d84ba. do you wish to debug it?",
  "@weirdbot image me 안녕하세요",
  "@weirdbot animate me 안녕하세요",
  "@weirdbot youtube me 안녕하세요",
  "지금 몇시죠?",
  "ㅋㅋ하이",
];

module.exports = function(robot) {
  return robot.respond(/(안녕|하이|헬로|hi|hello|hey)/i, function(msg) {
    responses.sort(() => .5 - Math.random());
    return msg.send(`${prefix} ${responses[0]}`);
  }
  );
};
