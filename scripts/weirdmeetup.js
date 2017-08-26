const prefix = ":koala:";
module.exports = function(robot) {
  robot.hear(/이상한모임/i, function(msg) {
    msg.send(`${prefix} 국립국어원에 따르면 이상한 모임이라 띄어 쓰는게 맞습니다.`);
  });
};
