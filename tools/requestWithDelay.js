const delay = ms => new Promise(r => setTimeout(r, ms));

function requestWithDelay(requestPromises, {delayBetweenChunks=200, chunkUnit=10} = {}){
  let p = Promise.resolve();
  let res = [];
  const numOfChunks = Math.ceil(requestPromises.length / chunkUnit);
  if( requestPromises.length == 0){
    return [];
  } else if(requestPromises.length == 1){
    return requestPromises;
  }
  for(let j = 0; j < numOfChunks; j++){
    p = p.then(() => Promise.all(requestPromises.slice(chunkUnit * j, chunkUnit * (j+1))))
    if( j != numOfChunks - 1 ) p = p.then(delay(delayBetweenChunks));
    res = [...res, p];
  }
  return res;
}

module.exports = requestWithDelay;