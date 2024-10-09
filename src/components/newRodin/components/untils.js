export class FakeProgress {
  constructor(speed = 1) {
    this.progress = 0;
    this.speed = speed;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => {
      this.progress += this.speed;
      if (this.progress >= 90) {
        this.progress = 90
      }

    }, 1000);
  }

  complete() {
    if (this.progress <= 90) {
      clearInterval(this.timer);
      this.timer = null
      this.progress = 100;
      console.info('Progress:', this.progress);
    }
  }

  getProgress() {
    return {
      progress: this.progress
    };
  }

  getStatus() {
    if (this.timer) {
      return true
    } else {
      return false
    }
  }

  reset() {
    this.progress = 0
    clearInterval(this.timer)
    this.timer = null
  }
}