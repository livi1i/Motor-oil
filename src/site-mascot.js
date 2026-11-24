const interval = 30_000;
const displayTime = 10_000;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const portraitUrl = new URL('../assets/images/motor-oil-mascot-wave.webp', import.meta.url);

export function mountSiteMascot() {
  const phone = document.querySelector('.header-phone');
  const vk = document.querySelector('.header-vk');
  const portrait = new Image();
  portrait.alt = '';
  let schedule;
  let dismissal;
  let removal;
  let scene;

  function remove() {
    clearTimeout(dismissal);
    clearTimeout(removal);
    scene?.remove();
    scene = undefined;
  }

  function close() {
    if (!scene || scene.classList.contains('is-leaving')) return;
    clearTimeout(dismissal);
    if (motion.matches) {
      remove();
    } else {
      scene.classList.add('is-leaving');
      scene.inert = true;
      removal = setTimeout(remove, 320);
    }
  }

  function scheduleClose() {
    clearTimeout(dismissal);
    if (!scene.matches(':hover, :focus-within, .is-leaving')) {
      dismissal = setTimeout(close, displayTime);
    }
  }

  function link(label, source, className) {
    const action = document.createElement('a');
    action.className = className;
    action.textContent = label;
    action.href = source.href;
    if (source.target) action.target = source.target;
    if (source.rel) action.rel = source.rel;
    return action;
  }

  async function greet() {
    if (scene || document.hidden) return;
    if (!portrait.hasAttribute('src')) portrait.src = portraitUrl;
    try { await portrait.decode(); } catch { return; }
    if (scene || document.hidden) return;

    scene = document.createElement('aside');
    scene.className = 'site-mascot';
    scene.setAttribute('aria-label', 'Помощь Motor Oil');
    const card = document.createElement('div');
    card.className = 'site-mascot-card';
    const title = document.createElement('strong');
    title.textContent = 'Здравствуйте!';
    const message = document.createElement('p');
    message.textContent = 'Если нужна помощь, позвоните нам или напишите ВКонтакте.';
    const actions = document.createElement('div');
    actions.className = 'site-mascot-actions';
    actions.append(link('Позвонить', phone, 'site-mascot-call'), link('ВКонтакте', vk, 'site-mascot-vk'));
    const dismiss = document.createElement('button');
    dismiss.className = 'site-mascot-dismiss';
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Закрыть приветствие');
    dismiss.textContent = '×';
    dismiss.addEventListener('click', close);

    card.append(title, message, actions, dismiss);
    const figure = document.createElement('div');
    figure.className = 'site-mascot-figure';
    const body = portrait.cloneNode();
    body.className = 'site-mascot-body';
    const hand = portrait.cloneNode();
    hand.className = 'site-mascot-hand';
    figure.append(body, hand);
    scene.append(card, figure);
    scene.addEventListener('pointerenter', () => clearTimeout(dismissal));
    scene.addEventListener('pointerleave', scheduleClose);
    scene.addEventListener('focusin', () => clearTimeout(dismissal));
    scene.addEventListener('focusout', event => {
      if (!scene.contains(event.relatedTarget)) requestAnimationFrame(() => { if (scene) scheduleClose(); });
    });
    scene.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
    document.body.append(scene);
    scheduleClose();
  }

  function syncSchedule() {
    clearInterval(schedule);
    if (document.hidden) {
      remove();
    } else {
      schedule = setInterval(greet, interval);
    }
  }

  document.addEventListener('visibilitychange', syncSchedule);
  syncSchedule();
}
