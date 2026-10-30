// Вариант 7: плавная прокрутка и наезд блоков на первый экран (как в варианте 8).
// Без библиотек или при «уменьшить движение» страница работает как обычно.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  if (typeof window.Lenis !== 'undefined') {
    const lenis = new window.Lenis({ lerp: 0.09, anchors: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // пока панель наезжает, первый экран слегка уменьшается и тускнеет
  gsap.matchMedia().add('(min-width: 901px)', () => {
    gsap.to('.hero__content, .hero__stage, .hero .note, .hero__blob, .hero .leafimg', {
      scale: 0.94,
      autoAlpha: 0.35,
      transformOrigin: '50% 30%',
      ease: 'none',
      scrollTrigger: { start: 0, end: () => document.querySelector('.hero').offsetHeight, scrub: true, invalidateOnRefresh: true },
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
