const queue = [];
let isFlushPending = false;
const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>;

export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    resolvedPromise.then(flushJobs);
  }
}

function flushJobs() {
  isFlushPending = false;

  queue.sort((a, b) => a.id - b.id);
  queue.forEach((q) => {
    q();
  });
  queue.length = 0;
}
