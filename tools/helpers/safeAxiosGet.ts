/*
  Promise retry design pattern
  https://stackoverflow.com/questions/38213668/promise-retry-design-patterns/38225011
*/
// FIXME legacy code

import axios from 'axios';

// 주어진 시간 이후에 주어진 이유로 reject하는 promise를 만들어 준다.
function rejectDelay(reason: string) {
  const t = 200;
  return new Promise((_, reject) => {
    setTimeout(reject.bind(null, reason), t);
  })
}

export function safeAxiosGet(address: string, params: { params: {} }): Promise<any> {
  const attempt = axios.get(address, params);
  const maxTrial = 5;
  let p = Promise.reject();

  for (let i = 0; i < maxTrial; i++) {
    (p as Promise<unknown>) = p.catch(() => attempt).catch(rejectDelay);
  }
  return p;
}