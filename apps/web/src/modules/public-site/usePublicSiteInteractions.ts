import { useEffect, type RefObject } from 'react';

export function usePublicSiteInteractions(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cleanup: Array<() => void> = [];
    const menuButton = root.querySelector<HTMLButtonElement>('[data-menu-button]');
    const nav = root.querySelector<HTMLElement>('[data-nav]');
    const dropdown = root.querySelector<HTMLElement>('.nav__dropdown');
    const dropdownTrigger = root.querySelector<HTMLButtonElement>('.nav__trigger');

    const closeMenu = () => {
      nav?.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    };

    if (menuButton && nav) {
      const onMenuClick = () => {
        const open = nav.classList.toggle('is-open');
        document.body.classList.toggle('menu-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
      };
      menuButton.addEventListener('click', onMenuClick);
      cleanup.push(() => menuButton.removeEventListener('click', onMenuClick));
    }

    if (dropdownTrigger && dropdown) {
      const onDropdownClick = () => {
        if (window.innerWidth <= 1050) dropdown.classList.toggle('is-open');
      };
      dropdownTrigger.addEventListener('click', onDropdownClick);
      cleanup.push(() => dropdownTrigger.removeEventListener('click', onDropdownClick));
    }

    root.querySelectorAll<HTMLAnchorElement>('[data-nav] a').forEach((link) => {
      link.addEventListener('click', closeMenu);
      cleanup.push(() => link.removeEventListener('click', closeMenu));
    });

    root.querySelectorAll<HTMLButtonElement>('.accordion__item button').forEach((button) => {
      const onAccordionClick = () => {
        const item = button.closest('.accordion__item');
        root.querySelectorAll('.accordion__item').forEach((other) => {
          if (other !== item) other.classList.remove('is-open');
        });
        item?.classList.toggle('is-open');
      };
      button.addEventListener('click', onAccordionClick);
      cleanup.push(() => button.removeEventListener('click', onAccordionClick));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    root.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    cleanup.push(() => observer.disconnect());

    const slider = root.querySelector<HTMLElement>('[data-hero-slider]');
    let timer: number | undefined;
    if (slider) {
      const slides = Array.from(slider.querySelectorAll<HTMLElement>('[data-hero-slide]'));
      const dots = Array.from(slider.querySelectorAll<HTMLButtonElement>('[data-hero-dot]'));
      const prev = slider.querySelector<HTMLButtonElement>('[data-hero-prev]');
      const next = slider.querySelector<HTMLButtonElement>('[data-hero-next]');
      let index = 0;

      const show = (nextIndex: number) => {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      };

      const restart = () => {
        if (timer) window.clearInterval(timer);
        timer = window.setInterval(() => show(index + 1), 6000);
      };

      const onPrev = () => { show(index - 1); restart(); };
      const onNext = () => { show(index + 1); restart(); };
      prev?.addEventListener('click', onPrev);
      next?.addEventListener('click', onNext);
      cleanup.push(() => prev?.removeEventListener('click', onPrev));
      cleanup.push(() => next?.removeEventListener('click', onNext));

      dots.forEach((dot, i) => {
        const onDot = () => { show(i); restart(); };
        dot.addEventListener('click', onDot);
        cleanup.push(() => dot.removeEventListener('click', onDot));
      });

      show(0);
      restart();
      cleanup.push(() => { if (timer) window.clearInterval(timer); });
    }

    return () => {
      cleanup.forEach((fn) => fn());
      document.body.classList.remove('menu-open');
    };
  }, [rootRef]);
}
