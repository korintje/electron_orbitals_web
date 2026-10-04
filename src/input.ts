// Port of OrbitalView's touch handling, plus a minimal emulation of Android's
// GestureDetector (single tap, double tap, fling) on top of Pointer Events.
import type { Camera } from './camera';

// Android ViewConfiguration defaults, in dp (≈ CSS px)
const TOUCH_SLOP = 8;
const DOUBLE_TAP_SLOP = 100;
const DOUBLE_TAP_TIMEOUT = 300;
const DOUBLE_TAP_MIN_TIME = 40;
const LONG_PRESS_TIMEOUT = 500;
const MIN_FLING_VELOCITY = 50;
const MAX_FLING_VELOCITY = 8000;
const VELOCITY_HORIZON = 100; // ms

interface Pt {
  x: number;
  y: number;
}

export class InputHandler {
  private readonly pointers = new Map<number, Pt>();
  private order: number[] = []; // pointer ids in the order they went down
  private firstPointer = -1;
  private secondPointer = -1;
  private previousX = 0;
  private previousY = 0;
  private previousDistance = 1;
  private previousAngle = 0;
  private stoppedFling = false;

  // GestureDetector state
  private downTime = 0;
  private down: Pt = { x: 0, y: 0 };
  private inTapRegion = false;
  private isDoubleTapping = false;
  private lastTapUpTime = -1e9;
  private lastTapDown: Pt = { x: 0, y: 0 };
  private samples: { t: number; x: number; y: number }[] = [];

  constructor(
    private readonly el: HTMLElement,
    private readonly camera: Camera,
    private readonly requestRender: () => void,
    private readonly onSingleTapUp: () => void,
  ) {
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    el.addEventListener('pointermove', (e) => this.onPointerMove(e));
    el.addEventListener('pointerup', (e) => this.onPointerUp(e, false));
    el.addEventListener('pointercancel', (e) => this.onPointerUp(e, true));
    el.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private pos(e: PointerEvent): Pt {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private meanSize(): number {
    return Math.sqrt(this.el.clientWidth * this.el.clientHeight);
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.el.setPointerCapture?.(e.pointerId);
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    this.order.push(e.pointerId);
    const now = performance.now();

    if (this.pointers.size === 1) {
      // ACTION_DOWN: one bear in the bed
      this.firstPointer = e.pointerId;
      this.oneFingerEvent(false);
      this.stoppedFling = this.camera.stopFling();

      // GestureDetector: double tap detection
      const dt = now - this.lastTapUpTime;
      const dx = p.x - this.lastTapDown.x, dy = p.y - this.lastTapDown.y;
      const minTime = e.pointerType === 'touch' ? DOUBLE_TAP_MIN_TIME : 0;
      if (dt <= DOUBLE_TAP_TIMEOUT && dt >= minTime &&
        dx * dx + dy * dy < DOUBLE_TAP_SLOP * DOUBLE_TAP_SLOP) {
        this.isDoubleTapping = true;
        this.lastTapUpTime = -1e9;
        this.camera.stopFling();
        this.camera.snapToAxis();
        this.requestRender();
      } else {
        this.isDoubleTapping = false;
      }
      this.downTime = now;
      this.down = p;
      this.lastTapDown = p;
      this.inTapRegion = true;
      this.samples = [{ t: now, ...p }];
    } else if (this.pointers.size === 2) {
      // ACTION_POINTER_DOWN: two bears in the bed
      this.secondPointer = e.pointerId;
      this.twoFingerEvent(false);
      this.inTapRegion = false;
      this.isDoubleTapping = false;
    } else {
      this.inTapRegion = false;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.pointers.has(e.pointerId)) return;
    e.preventDefault();
    const p = this.pos(e);
    this.pointers.set(e.pointerId, p);
    if (this.pointers.size === 1) {
      this.oneFingerEvent(true);
      const dx = p.x - this.down.x, dy = p.y - this.down.y;
      if (dx * dx + dy * dy > TOUCH_SLOP * TOUCH_SLOP) this.inTapRegion = false;
      const now = performance.now();
      this.samples.push({ t: now, ...p });
      while (this.samples.length > 2 && this.samples[0].t < now - VELOCITY_HORIZON)
        this.samples.shift();
    } else if (this.pointers.size === 2) {
      this.twoFingerEvent(true);
    }
  }

  private onPointerUp(e: PointerEvent, cancel: boolean): void {
    if (!this.pointers.has(e.pointerId)) return;
    const count = this.pointers.size;
    const now = performance.now();

    if (cancel) {
      this.pointers.clear();
      this.order = [];
      this.firstPointer = this.secondPointer = -1;
      return;
    }

    if (count === 1) {
      // ACTION_UP: no bears in the bed
      this.pointers.clear();
      this.order = [];
      this.firstPointer = -1;
      if (this.isDoubleTapping) {
        this.isDoubleTapping = false;
      } else if (this.inTapRegion && now - this.downTime < LONG_PRESS_TIMEOUT) {
        this.lastTapUpTime = now;
        if (!this.stoppedFling) this.onSingleTapUp();
      } else if (!this.inTapRegion) {
        this.maybeFling(now);
      }
      return;
    }

    // ACTION_POINTER_UP: one falling out but at least one will remain
    this.pointers.delete(e.pointerId);
    this.order = this.order.filter((id) => id !== e.pointerId);
    if (count === 3) {
      this.firstPointer = this.order[0];
      this.secondPointer = this.order[1];
      this.twoFingerEvent(false);
    } else if (count === 2) {
      this.firstPointer = this.order[0];
      this.secondPointer = -1;
      this.oneFingerEvent(false);
      const p = this.pointers.get(this.firstPointer)!;
      this.samples = [{ t: now, ...p }];
    }
  }

  private maybeFling(now: number): void {
    const s = this.samples.filter((v) => v.t >= now - VELOCITY_HORIZON);
    if (s.length < 2) return;
    const a = s[0], b = s[s.length - 1];
    const dt = (b.t - a.t) / 1000;
    if (dt <= 0) return;
    let vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
    const v = Math.hypot(vx, vy);
    if (v < MIN_FLING_VELOCITY) return;
    if (v > MAX_FLING_VELOCITY) {
      vx *= MAX_FLING_VELOCITY / v;
      vy *= MAX_FLING_VELOCITY / v;
    }
    const meanSize = this.meanSize();
    this.camera.fling(vx / meanSize, vy / meanSize);
    this.requestRender();
  }

  private oneFingerEvent(actionable: boolean): void {
    const p = this.pointers.get(this.firstPointer);
    if (!p) return;
    if (actionable) {
      const meanSize = this.meanSize();
      this.camera.drag((p.x - this.previousX) / meanSize, (p.y - this.previousY) / meanSize);
      this.requestRender();
    }
    this.previousX = p.x;
    this.previousY = p.y;
  }

  private twoFingerEvent(actionable: boolean): void {
    const p1 = this.pointers.get(this.firstPointer);
    const p2 = this.pointers.get(this.secondPointer);
    if (!p1 || !p2) return;
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    let distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    // Zero is highly unlikely, but don't take chances
    if (distance < 1) {
      angle = 0;
      distance = 1;
    }
    if (actionable) {
      this.camera.twist(angle - this.previousAngle);
      this.camera.zoom(distance / this.previousDistance);
      this.requestRender();
    }
    this.previousAngle = angle;
    this.previousDistance = distance;
  }

  // PC addition: mouse wheel / trackpad pinch zoom
  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= this.el.clientHeight;
    const k = e.ctrlKey ? 0.01 : 0.0015;
    this.camera.zoom(Math.exp(-dy * k));
    this.requestRender();
  }
}
