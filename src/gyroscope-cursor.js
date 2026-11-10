// Local implementation of the direction-aware pointer described in React Bits Pro's public docs.
const enabled = matchMedia(
  '(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)'
);
const nativeTargets = 'input, textarea, select, option, [contenteditable]:not([contenteditable="false"]), [data-cursor="native"]';
const interactiveTargets = 'a[href], button:not(:disabled), summary, [role="button"]';
const restAngle = -45;
const idleDelay = 450;
const page = document.documentElement;
const dialogs = [...document.querySelectorAll('dialog')];
const cursor = document.createElement('span');
cursor.className = 'gyroscope-cursor';
cursor.hidden = true;
cursor.setAttribute('aria-hidden', 'true');

const svgNamespace = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(svgNamespace, 'svg');
svg.setAttribute('viewBox', '-10 0 20 18');
svg.setAttribute('width', '20');
svg.setAttribute('height', '18');
svg.setAttribute('focusable', 'false');
const arrow = document.createElementNS(svgNamespace, 'path');
arrow.setAttribute('d', 'M0 0 8 18 0 14 -8 18Z');
arrow.setAttribute('fill', '#d00017');
arrow.setAttribute('stroke', '#fff');
arrow.setAttribute('stroke-width', '2');
arrow.setAttribute('stroke-linejoin', 'round');
svg.append(arrow);
cursor.append(svg);
document.body.append(cursor);

let previous = null;
let angle = restAngle;
let settleTimer;

function turnTo(heading) {
  const difference = ((heading - angle) % 360 + 540) % 360 - 180;
  angle += difference;
  cursor.style.setProperty('--gyro-angle', `${angle}deg`);
}

function hideCursor() {
  clearTimeout(settleTimer);
  cursor.hidden = true;
  cursor.removeAttribute('data-pressed');
  page.removeAttribute('data-gyroscope-active');
  previous = null;
  angle = restAngle;
  cursor.style.setProperty('--gyro-angle', `${angle}deg`);
}

function followPointer(event) {
  const target = event.target;
  if (!enabled.matches || event.pointerType !== 'mouse' ||
      !(target instanceof Element) || target.closest(nativeTargets)) {
    hideCursor();
    return;
  }

  const { clientX: x, clientY: y } = event;
  const dialog = target.closest('dialog[open]');
  if (dialog) {
    const { left, top, right, bottom } = dialog.getBoundingClientRect();
    if (x < left || x > right || y < top || y > bottom) {
      hideCursor();
      return;
    }
  }

  // A modal is painted above the page, so its pointer must be a child of that modal.
  const layer = dialog || document.body;
  if (cursor.parentElement !== layer) layer.append(cursor);
  cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  cursor.toggleAttribute('data-interactive', Boolean(target.closest(interactiveTargets)));
  if (previous) {
    const dx = x - previous.x;
    const dy = y - previous.y;
    if (Math.hypot(dx, dy) >= 2) {
      turnTo(Math.atan2(dx, -dy) * 180 / Math.PI);
      previous = { x, y };
    }
  } else {
    previous = { x, y };
  }

  cursor.hidden = false;
  page.setAttribute('data-gyroscope-active', '');
  clearTimeout(settleTimer);
  settleTimer = setTimeout(() => turnTo(restAngle), idleDelay);
}

document.addEventListener('pointermove', followPointer, { capture: true, passive: true });
document.addEventListener('pointerover', followPointer, { capture: true, passive: true });
document.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse') hideCursor();
  else if (!cursor.hidden) cursor.setAttribute('data-pressed', '');
}, { passive: true });
window.addEventListener('pointerup', () => cursor.removeAttribute('data-pressed'), { passive: true });
window.addEventListener('pointercancel', hideCursor);
window.addEventListener('blur', hideCursor);
page.addEventListener('pointerleave', hideCursor);
document.addEventListener('visibilitychange', hideCursor);
document.addEventListener('keydown', hideCursor);
enabled.addEventListener('change', hideCursor);
const dialogObserver = new MutationObserver(hideCursor);
for (const dialog of dialogs) dialogObserver.observe(dialog, { attributeFilter: ['open'] });
