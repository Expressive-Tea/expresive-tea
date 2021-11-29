export default class LoadBalancer {
  private readonly bins: number[];

  /**
   * @offset should be used for unit testing and nothing else.
   */
  constructor(count: number, offset = 0) {
    this.bins = new Array(count);

    // Initializes the elements of the array to zero.
    for (let i = 0; i < this.bins.length; i++) {
      this.bins[i] = offset;
    }
  }

  pick() {
    const a = Math.trunc(Math.random() * this.bins.length);
    const b = Math.trunc(Math.random() * this.bins.length);

    const result = this.bins[a] < this.bins[b] ? a : b;

    // Accounts for overflow if enough requests go through this balancer.
    if (this.bins[result] === Number.MAX_SAFE_INTEGER) {

      // Resets all bins as it assumes they have all received an equal
      // number of requests. Starts again from a blank state.
      for (let i = 0; i < this.bins.length; i++) {
        this.bins[i] = 0;
      }
    }

    // Increments the number of requests assigned to this bin.
    this.bins[result]++;

    return result;
  }
}
