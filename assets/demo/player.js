import { clips, tourChapters } from './scenes.js';

const base = new URL('.', import.meta.url);
const screenURL = name => new URL('screens/' + name + '.webp', base).href;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function make(tag, className, text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function timeLabel(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

class InventoryOSDemo extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) {
      this.watchForAutoplay();
      return;
    }
    this.fullTour = this.getAttribute('clip') === 'tour';
    const [title, scenes] = this.fullTour ? clips.tour : clips.hook;
    this.scenes = scenes;
    this.duration = 0;
    this.sceneStarts = scenes.map(scene => {
      const start = this.duration;
      this.duration += scene.d;
      return start;
    });
    this.durationLabel = timeLabel(Math.round(this.duration / 1000) * 1000);
    this.index = 0;
    this.playing = false;
    this.animations = [];
    this.loadedScreens = new Map();

    const root = this.attachShadow({ mode: 'open' });
    const stylesheet = make('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('player.css', base).href;
    const panel = make('section', 'panel');
    panel.setAttribute('aria-label', title);
    const screen = make('div', 'screen');
    this.stage = make('div', 'stage');
    this.stage.setAttribute('aria-hidden', 'true');
    this.caption = make('p', 'caption', 'InventoryOS workspace with sample data');
    this.poster = this.control('', () => {
      this.togglePlayback();
      if (!this.fullTour) this.toggle.focus();
    });
    this.poster.className = 'screen-control';
    this.posterLabel = make('span', 'poster-label');
    this.posterLabel.setAttribute('aria-hidden', 'true');
    this.poster.append(this.posterLabel);
    screen.append(this.stage, this.poster);

    const controls = make('div', 'controls');
    this.previous = this.control('Previous', () => this.go(this.index - 1));
    this.toggle = this.control('Play', () => this.togglePlayback());
    this.next = this.control('Next', () => this.go(this.index + 1));
    this.counter = make('span', 'counter');
    controls.append(this.toggle, this.previous, this.next, this.counter);
    panel.append(screen, this.caption);
    if (this.fullTour) {
      const timeline = make('div', 'timeline');
      this.slider = make('input', 'seek');
      this.slider.type = 'range';
      this.slider.min = '0';
      this.slider.max = String(this.duration);
      this.slider.step = '100';
      this.slider.value = '0';
      this.slider.setAttribute('aria-label', 'Seek through the full tour');
      this.slider.addEventListener('input', () => this.seek(Number(this.slider.value)));
      timeline.append(this.slider);
      panel.append(timeline, controls);
    } else {
      const progress = make('div', 'progress');
      progress.setAttribute('aria-hidden', 'true');
      this.fill = make('span');
      progress.append(this.fill);
      panel.append(controls, progress);
    }
    root.append(stylesheet, panel);
    this.image('ov').then(image => {
      if (!this.started) this.stage.replaceChildren(image.cloneNode());
    });
    this.refreshControls();
    this.updateProgress();
    this.watchForAutoplay();
  }

  disconnectedCallback() {
    this.autoplayObserver?.disconnect();
    this.pause();
  }

  watchForAutoplay() {
    if (this.fullTour || this.started || reducedMotion.matches || typeof IntersectionObserver === 'undefined') return;
    this.autoplayObserver?.disconnect();
    this.autoplayObserver = new IntersectionObserver(entries => {
      if (this.started || reducedMotion.matches || document.hidden) return;
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .5)) this.play();
    }, { threshold: .5 });
    this.autoplayObserver.observe(this.stage);
  }

  control(label, handler) {
    const button = make('button', '', label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  image(name) {
    if (!this.loadedScreens.has(name)) {
      const image = new Image(1120, 700);
      image.alt = '';
      image.src = screenURL(name);
      this.loadedScreens.set(name, image.decode().catch(() => {}).then(() => image));
    }
    return this.loadedScreens.get(name);
  }

  refreshControls() {
    const action = this.ended ? 'Replay' : this.playing ? 'Pause' : 'Play';
    this.toggle.textContent = action;
    this.previous.disabled = !this.started || this.index === 0;
    this.next.disabled = !this.started || this.index === this.scenes.length - 1;
    this.poster.hidden = !this.fullTour && this.started;
    const label = action + (this.fullTour ? ' full tour' : ' 31-second demo');
    this.poster.setAttribute('aria-label', label);
    this.posterLabel.textContent = label;
    this.posterLabel.hidden = this.started && !this.ended;
  }

  togglePlayback() {
    if (this.playing) this.pause();
    else this.play();
  }

  play() {
    this.autoplayObserver?.disconnect();
    if (!this.started || this.ended) {
      this.playing = true;
      this.go(0);
      return;
    }
    this.playing = true;
    if (this.loading) {
      this.refreshControls();
      return;
    }
    this.animations.forEach(animation => animation.play());
    this.startTimer();
    this.refreshControls();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
      this.remaining = Math.max(0, this.remaining - (performance.now() - this.timerStarted));
    }
    cancelAnimationFrame(this.progressFrame);
    this.animations.forEach(animation => animation.pause());
    this.refreshControls();
    this.updateProgress();
  }

  startTimer() {
    if (this.timer) return;
    this.timerStarted = performance.now();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.index < this.scenes.length - 1) {
        this.go(this.index + 1);
      } else {
        cancelAnimationFrame(this.progressFrame);
        this.playing = false;
        this.ended = true;
        this.remaining = 0;
        this.refreshControls();
        this.updateProgress();
      }
    }, this.remaining);
    this.trackProgress();
  }

  trackProgress() {
    this.updateProgress();
    this.progressFrame = requestAnimationFrame(() => this.trackProgress());
  }

  updateProgress() {
    const advancing = this.timer ? performance.now() - this.timerStarted : 0;
    const duration = this.scenes[this.index].d;
    const sceneTime = this.started ? Math.min(duration, duration - this.remaining + advancing) : 0;
    const elapsed = this.sceneStarts[this.index] + sceneTime;
    const time = elapsed === this.duration ? this.durationLabel : timeLabel(elapsed);
    const counter = time + ' / ' + this.durationLabel;
    if (this.counter.textContent !== counter) this.counter.textContent = counter;
    if (this.slider) {
      this.slider.value = String(Math.round(elapsed / 100) * 100);
      const spokenTime = time + ' of ' + this.durationLabel;
      if (this.slider.getAttribute('aria-valuetext') !== spokenTime) this.slider.setAttribute('aria-valuetext', spokenTime);
    } else {
      this.fill.style.transform = 'scaleX(' + elapsed / this.duration + ')';
    }
  }

  seek(milliseconds) {
    const time = Math.min(this.duration, Math.max(0, milliseconds));
    const next = this.sceneStarts.findIndex(start => start > time);
    const index = next === -1 ? this.scenes.length - 1 : next - 1;
    return this.go(index, time - this.sceneStarts[index]);
  }

  async go(index, offset = 0) {
    const scene = this.scenes[index];
    if (!scene) return;
    this.autoplayObserver?.disconnect();
    this.started = true;
    this.ended = index === this.scenes.length - 1 && offset === scene.d;
    if (this.ended) this.playing = false;
    this.index = index;
    clearTimeout(this.timer);
    this.timer = undefined;
    cancelAnimationFrame(this.progressFrame);
    this.animations.forEach(animation => animation.cancel());
    this.animations = [];
    const request = this.sceneRequest = Symbol();
    this.remaining = scene.d - offset;
    this.loading = scene.t === 'S';
    this.refreshControls();
    this.updateProgress();

    if (scene.t === 'T') {
      const text = make('div', 'title-card');
      const lines = scene.l.map(line => make('p', line.startsWith('a:') ? 'accent' : line.startsWith('q:') ? 'question' : '', line.replace(/^[aq]:/, '')));
      text.append(...lines);
      this.stage.replaceChildren(text);
      this.caption.textContent = lines.map(line => line.textContent).join(' ');
      if (!reducedMotion.matches && this.playing) {
        lines.forEach((line, i) => this.animate(line, [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], {
          duration: 350, delay: i * 450, fill: 'both',
        }));
      }
    } else {
      const image = await this.image(scene.i);
      if (request !== this.sceneRequest) return;
      this.loading = false;
      this.renderScreen(scene, image);
      this.caption.replaceChildren(make('strong', '', scene.b), scene.s ? ' ' + scene.s : '');
    }

    const upcoming = this.scenes.slice(index + 1).find(item => item.t === 'S');
    if (upcoming) this.image(upcoming.i);
    if (this.playing) this.startTimer();
  }

  animate(element, frames, options) {
    const animation = element.animate(frames, options);
    animation.currentTime = this.scenes[this.index].d - this.remaining;
    if (!this.playing) animation.pause();
    this.animations.push(animation);
  }

  renderScreen(scene, image) {
    const art = make('div', 'art');
    const highlight = make('span', 'highlight');
    const [x, y, width, height] = scene.c ?? scene.r;
    Object.assign(highlight.style, { left: x + '%', top: y + '%', width: width + '%', height: height + '%' });
    art.append(image.cloneNode(), highlight);
    this.stage.replaceChildren(art);
    if (reducedMotion.matches) return;

    const [left, top, w, h] = scene.r;
    const zoom = Math.max(1, Math.min(1.7, 67 / h, 93 / w));
    const cx = Math.min(Math.max(left + w / 2, 50 / zoom), 100 - 50 / zoom);
    const cy = Math.min(Math.max(top + h / 2, 50 / zoom), 100 - 50 / zoom);
    const transform = 'translate(50%, 50%) scale(' + zoom + ') translate(' + -cx + '%, ' + -cy + '%)';
    const motion = { duration: 850, delay: 180, fill: 'forwards', easing: 'ease-in-out' };
    this.animate(art, [{ transform: 'none' }, { transform }], motion);
    if (!scene.c) return;
    const pointer = make('span', 'pointer');
    const ring = make('span', 'ring');
    const hint = make('span', 'hint', scene.c[4]);
    const px = 50 + zoom * (x + width * .6 - cx);
    const py = 50 + zoom * (y + height * .55 - cy);
    Object.assign(ring.style, { left: px + '%', top: py + '%' });
    Object.assign(hint.style, { left: Math.min(Math.max(px, 15), 84) + '%', top: Math.min(py + 8, 88) + '%' });
    this.stage.append(pointer, ring, hint);
    this.animate(pointer, [
      { left: '65%', top: '82%', opacity: 0, offset: 0 },
      { left: '65%', top: '82%', opacity: 1, offset: .18 },
      { left: px + '%', top: py + '%', opacity: 1, offset: 1 },
    ], { duration: 850, delay: 480, fill: 'both', easing: 'ease-in-out' });
    this.animate(ring, [{ scale: '.25', opacity: 0 }, { scale: '.65', opacity: 1 }, { scale: '1.65', opacity: 0 }],
      { duration: 650, delay: 1370, fill: 'both' });
    this.animate(hint, [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 1, offset: .76 }, { opacity: 0 }],
      { duration: 1200, delay: 1220, fill: 'both' });
  }
}

customElements.define('inventoryos-demo', InventoryOSDemo);

const tour = document.querySelector('inventoryos-demo[clip="tour"]');
function jumpToChapter() {
  const chapter = tourChapters.find(item => '#' + item.id === location.hash);
  if (!tour || !chapter) return;
  tour.pause();
  tour.go(chapter.scene);
  tour.scrollIntoView({ block: 'start' });
  tour.toggle.focus({ preventScroll: true });
}
if (tour) {
  window.addEventListener('hashchange', jumpToChapter);
  document.querySelectorAll('[data-demo-chapter]').forEach(link => link.addEventListener('click', () => {
    if (location.hash === link.hash) jumpToChapter();
  }));
  jumpToChapter();
}
document.addEventListener('visibilitychange', () => {
  document.querySelectorAll('inventoryos-demo').forEach(player => {
    if (document.hidden) player.pause();
    else player.watchForAutoplay();
  });
});
