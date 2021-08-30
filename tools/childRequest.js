/*
  child 요청이 너무 많을경우 429(too many request) 에러 뜨는 문제 해결을 위한 Promise 빌더
  10개씩 쪼개어서 500ms 딜레이 두고 요청.

  childIds 를 인수로 받아 그 id들을 요청하는 promise들을 반환한다.
*/

const safeAxiosGet = require('./safeAxiosGet')
const CONSTANTS = require('../constants')
const BlizzardToken = require('../tools/BlizzardToken');
const unit = 10;
const delaySec = 500;

const delay = ms => new Promise(r => setTimeout(r, ms));

function promiseBuilder(childIds, userConfig, unit){
  let startIndex = 0;
  let endIndex;
  let p = Promise.resolve();
  let arr = [];
  while(startIndex < childIds.length){
    if (startIndex + unit > childIds.length){
      endIndex = childIds.length;
    } else {
      endIndex = startIndex + unit;
    }
    let childIdSliced = childIds.slice(startIndex, endIndex);

    let tokenPromise = BlizzardToken.getToken()
    p = Promise.all([p, tokenPromise])
    .then(([_, blizzardToken]) => Promise.all(childIdSliced.map( id => 
      safeAxiosGet(`https://${ CONSTANTS.apiRequestRegion }.api.blizzard.com/hearthstone/cards/${ id }`,
      { params : {
        locale: userConfig.languageMode,
        access_token: blizzardToken
      }})
      .then(res => res.data)
    )))
    arr = arr.concat(p);
    p = p.then(() => delay(delaySec));
    startIndex += unit
  }
  
  return arr;
}

function childRequest(childIds, userConfig){
  return promiseBuilder(childIds, userConfig, unit);
}

module.exports = childRequest;