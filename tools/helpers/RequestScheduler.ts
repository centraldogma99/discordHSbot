class RequestScheduler<T> {
  queue: { key: number, value: (() => Promise<T[]>) | (() => Promise<T>) }[];
  resQueue: { key: number, value: T | T[] }[];
  queueId = 0;
  recentReqsInHour = 0;
  recentReqsInSec = 0;
  interval: number;
  timer: ReturnType<typeof setTimeout>;

  constructor(interval: number) {
    this.queue = [];
    this.resQueue = [];
    this.queueId = 0;
    this.recentReqsInHour = 0;
    this.recentReqsInSec = 0;
    this.interval = interval;

    // 100 requests per second
    // 36,000 requests per hour
    // error => return Error object
    let f = () => {
      const v = this.queue.shift()
      if (v) {
        let size: number;
        if (typeof v.value === 'function') {
          size = 1;
          v.value()
            .then((res: T | T[]) => this.resQueue.push({ key: v.key, value: res }))
            .catch(e => {
              console.log(e);
              this.resQueue.push({ key: v.key, value: e })
            });
        }
        // else if(Array.isArray(v.value)){
        //   size = v.value.length;
        //   v.value.map(f => f()
        //   .then(resArr => this.resQueue.push({key: v.key, value: resArr}))
        //   .catch(e => {
        //     console.log(e);
        //     this.resQueue.push({key: v.key, value: e})
        //   }));
        // }
        clearInterval(this.timer)
        this.timer = setInterval(f, this.interval * size);
        this.recentReqsInHour += size;
        this.recentReqsInSec += size;
        setTimeout(() => this.recentReqsInHour -= size, 3600000)
        setTimeout(() => this.recentReqsInSec -= size, 1000)
      }
    }

    this.timer = setInterval(f, this.interval);
  }

  get reqRate() {
    return [`${this.recentReqsInHour} reqs/h`, `${this.recentReqsInSec} reqs/s`];
  }

  addReq(reqFunc: (() => Promise<T[]>) | (() => Promise<T>)): number {
    if (!Array.isArray(reqFunc) && typeof reqFunc != 'function') return null;
    this.queue.push({ key: this.queueId, value: reqFunc });
    if (this.queueId < 1000000) {
      return this.queueId++;
    } else {
      this.queueId = 0;
      return this.queueId;
    }
  }

  getRes(queueId: number): Promise<T | T[]> {
    // @queueId는 null일 수 있음
    if (queueId === null) return null;
    return new Promise(resolve => {
      const timer = setInterval(() => {
        let res = this.resQueue.find(res => res.key === queueId);
        if (res) {
          resolve(res.value);
          clearInterval(timer);
        }
      }, 5)
    })
  }
}

const requestScheduler = new RequestScheduler<string>(10);
export { requestScheduler }