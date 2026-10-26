// Rendering quality only. No random numbers or combat/save state are touched.
export class FrameQuality {
  constructor() { this.reduced = false; this.reset(); }
  reset() { this.last = null; this.slow = 0; this.fast = 0; }
  sample(now, active) {
    if (!active || this.last === null) { this.last = active ? now : null; this.slow = this.fast = 0; return; }
    const ms = now - this.last; this.last = now;
    // Ignore tab switches, modal pauses and isolated long load frames.
    if (!(ms > 0 && ms < 250)) { this.slow = this.fast = 0; return; }
    if (ms > 24) { this.slow += ms; this.fast = 0; }
    else if (ms < 19) { this.fast += ms; this.slow = Math.max(0,this.slow-ms); }
    else { this.fast = 0; this.slow = Math.max(0,this.slow-ms); }
    if (!this.reduced && this.slow >= 1200) { this.reduced = true; this.fast = 0; }
    if (this.reduced && this.fast >= 8000) { this.reduced = false; this.slow = 0; }
  }
}
export const visualQuality = new FrameQuality();
