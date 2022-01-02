/*
  Promise retry design pattern
  https://stackoverflow.com/questions/38213668/promise-retry-design-patterns/38225011
*/
import axios, { AxiosResponse } from 'axios';

// 주어진 시간 이후에 주어진 이유로 reject하는 promise를 만들어 준다.
function rejectDelay(reason: string) {
  const t = 200;
  return new Promise((_, reject) => {
    setTimeout(reject.bind(null, reason), t);
  })
}

const safeAxios = (trial?: number) => {
  return {
    get: <T>(...rest: Parameters<typeof axios.get>): Promise<AxiosResponse<T>> => {
      const attempt = axios.get<T>(...rest);
      const maxTrial = trial ?? 5;
      let p = Promise.reject();

      for (let i = 0; i < maxTrial; i++) {
        (p as Promise<unknown>) = p.catch(() => attempt).catch(rejectDelay);
      }
      return p;
    },

    post: <T>(...rest: Parameters<typeof axios.post>): Promise<AxiosResponse<T>> => {
      const attempt = axios.post<T>(...rest);
      const maxTrial = trial ?? 5;
      let p = Promise.reject();

      for (let i = 0; i < maxTrial; i++) {
        (p as Promise<unknown>) = p.catch(() => attempt).catch(rejectDelay);
      }
      return p;
    }
  }
}

export default safeAxios;