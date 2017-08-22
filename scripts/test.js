/**
 * Created by duera on 2017-08-22.
 */
function test(query) {
    const bannedSite = ['-site:ilbe.com', '-site:naver.com', '-site:instiz.net'];
    const fileOption = 'define:gif';
    const searchString = query + ' ' +  bannedSite.join(' ') + ' ' + fileOption;
    console.log(searchString);
    const url = 'http://www.google.com/search?q=' + encodeURIComponent(searchString) + '&tbm=isch&source=lnt&tbs=itp:animated&sa=X&safe=active';
    return url;
}
console.log(test('버거킹 와퍼'));
