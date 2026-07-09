/* Nu Summer — Wii-inspired theme v2 */
document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var soundsOn = body.getAttribute('data-sounds') === 'true';
  var hapticsOn = body.getAttribute('data-haptics') === 'true';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ── Menu-style clock ─────────────────────────────────
  var timeEl = document.getElementById('wii-clock-time');
  var dateEl = document.getElementById('wii-clock-date');
  if (timeEl) {
    var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var tick = function () {
      var d = new Date();
      var h = d.getHours() % 12 || 12;
      var m = ('0' + d.getMinutes()).slice(-2);
      timeEl.innerHTML = h + '<span class="wii-colon">:</span>' + m;
      if (dateEl) dateEl.textContent = DAYS[d.getDay()] + ' ' + (d.getMonth() + 1) + '/' + d.getDate();
    };
    tick();
    setInterval(tick, 1000);
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
