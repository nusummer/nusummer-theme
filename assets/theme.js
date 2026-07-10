/* Nu Summer — Wii-inspired theme v2 */
document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var soundsOn = body.getAttribute('data-sounds') === 'true';
  var hapticsOn = body.getAttribute('data-haptics') === 'true';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ── Analog Wii clock ─────────────────────────────────
  var clockFace = document.getElementById('wii-clock-face');
  if (clockFace) {
    var numbersG = document.getElementById('wii-clock-numbers');
    for (var ci = 1; ci <= 12; ci++) {
      var angle = ci * Math.PI / 6;
      var nx = 50 + 34.5 * Math.sin(angle);
      var ny = 50 - 34.5 * Math.cos(angle);
      var numEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      numEl.setAttribute('x', nx.toFixed(1));
      numEl.setAttribute('y', (ny + 4).toFixed(1));
      numEl.textContent = ci;
      numbersG.appendChild(numEl);
    }

    var hourHand = document.getElementById('wii-clock-hour');
    var minuteHand = document.getElementById('wii-clock-minute');
    var secondHand = document.getElementById('wii-clock-second');
    var clockDateEl = document.getElementById('wii-clock-date');
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    var rotateHand = function (el, deg) { el.setAttribute('transform', 'rotate(' + deg + ' 50 50)'); };

    var clockTick = function () {
      var d = new Date();
      var h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
      rotateHand(hourHand, (h + m / 60) * 30);
      rotateHand(minuteHand, m * 6 + s * 0.1);
      rotateHand(secondHand, s * 6);
      if (clockDateEl) clockDateEl.textContent = DAYS[d.getDay()] + ' ' + (d.getMonth() + 1) + '/' + d.getDate();
    };
    clockTick();
    setInterval(clockTick, 1000);
  }

  // ── Synthesized menu blips (original tones) ──────────
  var ctx = null;
  var ensureCtx = function () {
    if (!soundsOn || reduced) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
  };
  document.addEventListener('pointerdown', ensureCtx);

  var blip = function (freq, dur, vol) {
    if (!ctx || ctx.state !== 'running') return;
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  };

  // ── Haptics (supported mobile browsers only) ─────────
  var buzz = function (ms) {
    if (!hapticsOn || reduced) return;
    if (navigator.vibrate) navigator.vibrate(ms);
  };

  // ── Product photo gallery ─────────────────────────────
  var galleries = document.querySelectorAll('[data-product-gallery]');
  for (var g = 0; g < galleries.length; g++) {
    (function (gallery) {
      var slides = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-slide]'));
      var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('[data-gallery-thumb]'));
      var prevBtn = gallery.querySelector('[data-gallery-prev]');
      var nextBtn = gallery.querySelector('[data-gallery-next]');
      var stage = gallery.querySelector('.product-gallery__stage');
      var current = 0;

      var indexForImageId = function (imageId) {
        if (!imageId) return -1;
        for (var i = 0; i < slides.length; i++) {
          if (slides[i].getAttribute('data-image-id') === imageId) return i;
        }
        return -1;
      };

      var show = function (index) {
        if (!slides.length) return;
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        current = index;
        for (var i = 0; i < slides.length; i++) {
          slides[i].hidden = i !== index;
          slides[i].classList.toggle('is-active', i === index);
        }
        for (var j = 0; j < thumbs.length; j++) {
          thumbs[j].classList.toggle('is-active', j === index);
          thumbs[j].setAttribute('aria-selected', j === index ? 'true' : 'false');
        }
      };

      thumbs.forEach(function (thumb, i) {
        thumb.addEventListener('click', function () { show(i); });
      });
      if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });

      // Swipe support
      if (stage) {
        var touchStartX = null;
        stage.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        stage.addEventListener('touchend', function (e) {
          if (touchStartX === null) return;
          var dx = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
          touchStartX = null;
        }, { passive: true });
      }

      // Variant-image awareness: switch to the variant's photo when selected
      var variantSelect = gallery.closest('.product-detail') &&
        gallery.closest('.product-detail').querySelector('#variant-select');
      if (variantSelect) {
        variantSelect.addEventListener('change', function () {
          var opt = variantSelect.options[variantSelect.selectedIndex];
          var idx = indexForImageId(opt.getAttribute('data-image-id'));
          if (idx > -1) show(idx);
        });
      }
    })(galleries[g]);
  }

  var HOVER_SEL = '.card, .btn, .pill';
  document.addEventListener('pointerover', function (e) {
    var el = e.target.closest && e.target.closest(HOVER_SEL);
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) {
      blip(740, 0.07, 0.045);
    }
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.btn, .pill, .card a')) {
      blip(880, 0.12, 0.06);
      buzz(10);
    }
  });
});
