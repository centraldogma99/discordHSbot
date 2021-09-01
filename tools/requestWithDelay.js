const delay = ms => new Promise(r => setTimeout(r, ms));
const delayBetweenChunks = 200;
const chunkUnit = 10;

function requestWithDelay(requestPromises){
  let p = Promise.resolve();
  let res = [];
  for(let j = 0; j < Math.ceil(requestPromises.length / chunkUnit); j++){
    p = p.then(() => Promise.all(requestPromises.slice(chunkUnit * j, chunkUnit * (j+1))))
    p = p.then(delay(delayBetweenChunks));
    res = [...res, p];
  }
  return res;
}

module.exports = requestWithDelay;