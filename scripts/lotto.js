// Description:
//   로또 번호 생성기
//
// Commands:
//   로또 or lotto
//
// Author:
//   originerd

const prefix = ":koala:";

Array.prototype.sample = function(n) {
  const result = this.slice();
  const count = Math.min(n, result.length);

  for (let i = 0 ; i < count ; i++) {
    const x = Math.floor(Math.random() * result.length);

    const temp = result[i];
    result[i] = result[x];
    result[x] = temp;
  }

  return result.slice(0, count);
}

function generate() {
  return Array.apply(null, Array(45))
              .map((_, i) => i + 1)
              .sample(6)
              .sort((x, y) => x - y)
              .join(', ');
}

module.exports = function(robot) {
  return robot.respond(/(로또|lotto)/i, function(msg) {
    return msg.send(`${prefix} 로또 번호는 ${generate()} 입니다. 당첨되세요!`);
  });
};
