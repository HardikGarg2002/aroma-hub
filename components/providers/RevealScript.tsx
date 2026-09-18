/**
 * The scroll-reveal engine, shipped inline in the document head.
 *
 * Why inline rather than a React hook: anything driven by Motion's `initial`
 * prop is serialised into the server HTML in its hidden state, so the page
 * stays blank until the JS bundle has downloaded and hydrated — seconds on a
 * cold cache, forever if the bundle fails. Keeping the hidden state and the
 * code that undoes it in the same HTML payload removes that dependency.
 *
 * Order of events:
 *   1. `.js` goes on <html> during head parsing, before first paint, so the
 *      pre-reveal styles apply with no flash of visible-then-hidden content.
 *   2. Once parsing finishes (readyState leaves "loading" — which happens
 *      before deferred bundles execute) every [data-reveal] is observed.
 *   3. A safety timer reveals everything unconditionally if step 2 never
 *      ran, so a blocked inline script can never leave content hidden.
 */
const SCRIPT = `
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');

  var started = false;

  function revealAll() {
    var els = d.querySelectorAll('[data-reveal]');
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
  }

  function init() {
    if (started) return;
    started = true;

    if (!('IntersectionObserver' in window)) return revealAll();

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-visible');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    var els = d.querySelectorAll('[data-reveal]');
    for (var i = 0; i < els.length; i++) io.observe(els[i]);

    // Anything React mounts after hydration still gets picked up.
    if ('MutationObserver' in window) {
      new MutationObserver(function (records) {
        for (var i = 0; i < records.length; i++) {
          var added = records[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var n = added[j];
            if (n.nodeType !== 1) continue;
            if (n.hasAttribute('data-reveal') && !n.classList.contains('is-visible')) io.observe(n);
            var nested = n.querySelectorAll ? n.querySelectorAll('[data-reveal]:not(.is-visible)') : [];
            for (var k = 0; k < nested.length; k++) io.observe(nested[k]);
          }
        }
      }).observe(d.documentElement, { childList: true, subtree: true });
    }
  }

  if (d.readyState !== 'loading') init();
  else d.addEventListener('readystatechange', function () {
    if (d.readyState !== 'loading') init();
  });

  // Last resort: if init never ran, nothing stays hidden.
  setTimeout(function () { if (!started) revealAll(); }, 3000);
})();
`;

/**
 * Rendered as the first child of <body>, so it executes while the body is
 * still being parsed — before any section below it is painted. That gives
 * the same early timing as a <head> script without adding a manual <head> to
 * the root layout, which the Next docs say not to do.
 */
export function RevealScript() {
  return <script id="aroma-reveal" dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
