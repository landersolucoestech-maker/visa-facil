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

    const closeDropdown = () => {
      dropdown?.classList.remove('is-open');
      dropdownTrigger?.setAttribute('aria-expanded', 'false');
    };

    const closeMenu = () => {
      nav?.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Abrir menu');
      closeDropdown();
    };

    if (menuButton && nav) {
      const onMenuClick = () => {
        const open = nav.classList.toggle('is-open');
        document.body.classList.toggle('menu-open', open);
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (!open) closeDropdown();
      };
      menuButton.addEventListener('click', onMenuClick);
      cleanup.push(() => menuButton.removeEventListener('click', onMenuClick));
    }

    if (dropdownTrigger && dropdown) {
      const onDropdownClick = () => {
        if (window.innerWidth > 1050) return;
        const open = dropdown.classList.toggle('is-open');
        dropdownTrigger.setAttribute('aria-expanded', String(open));
      };
      const onDropdownEnter = () => {
        if (window.innerWidth <= 1050) return;
        dropdownTrigger.setAttribute('aria-expanded', 'true');
      };
      const onDropdownLeave = () => {
        if (window.innerWidth <= 1050 || dropdown.contains(document.activeElement)) return;
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      };
      const onDropdownFocusIn = () => {
        if (window.innerWidth <= 1050) return;
        dropdownTrigger.setAttribute('aria-expanded', 'true');
      };
      const onDropdownFocusOut = (event: FocusEvent) => {
        if (window.innerWidth <= 1050 || dropdown.contains(event.relatedTarget as Node | null)) return;
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      };
      dropdownTrigger.addEventListener('click', onDropdownClick);
      dropdown.addEventListener('mouseenter', onDropdownEnter);
      dropdown.addEventListener('mouseleave', onDropdownLeave);
      dropdown.addEventListener('focusin', onDropdownFocusIn);
      dropdown.addEventListener('focusout', onDropdownFocusOut);
      cleanup.push(() => dropdownTrigger.removeEventListener('click', onDropdownClick));
      cleanup.push(() => dropdown.removeEventListener('mouseenter', onDropdownEnter));
      cleanup.push(() => dropdown.removeEventListener('mouseleave', onDropdownLeave));
      cleanup.push(() => dropdown.removeEventListener('focusin', onDropdownFocusIn));
      cleanup.push(() => dropdown.removeEventListener('focusout', onDropdownFocusOut));
    }

    root.querySelectorAll<HTMLAnchorElement>('[data-nav] a').forEach((link) => {
      link.addEventListener('click', closeMenu);
      cleanup.push(() => link.removeEventListener('click', closeMenu));
    });

    root.querySelectorAll<HTMLButtonElement>('.accordion__item button').forEach((button) => {
      const onAccordionClick = () => {
        const item = button.closest('.accordion__item');
        if (!item) return;
        const willOpen = !item.classList.contains('is-open');
        root.querySelectorAll<HTMLElement>('.accordion__item').forEach((other) => {
          const otherButton = other.querySelector<HTMLButtonElement>('button');
          const open = other === item && willOpen;
          other.classList.toggle('is-open', open);
          otherButton?.setAttribute('aria-expanded', String(open));
        });
      };
      button.addEventListener('click', onAccordionClick);
      cleanup.push(() => button.removeEventListener('click', onAccordionClick));
    });

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const menuWasOpen = Boolean(nav?.classList.contains('is-open'));
      const dropdownWasOpen = Boolean(dropdown?.classList.contains('is-open')) || dropdownTrigger?.getAttribute('aria-expanded') === 'true';
      closeMenu();
      if (menuWasOpen) menuButton?.focus();
      else if (dropdownWasOpen) dropdownTrigger?.focus();
    };
    document.addEventListener('keydown', onEscape);
    cleanup.push(() => document.removeEventListener('keydown', onEscape));

    const onResize = () => {
      if (window.innerWidth > 1050) {
        nav?.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        menuButton?.setAttribute('aria-expanded', 'false');
        menuButton?.setAttribute('aria-label', 'Abrir menu');
        closeDropdown();
      }
    };
    window.addEventListener('resize', onResize);
    cleanup.push(() => window.removeEventListener('resize', onResize));

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
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let index = 0;

      const stop = () => {
        if (timer) window.clearInterval(timer);
        timer = undefined;
      };

      const show = (nextIndex: number) => {
        if (!slides.length) return;
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === index;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', String(!active));
        });
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      };

      const restart = () => {
        stop();
        if (slides.length < 2 || reducedMotion.matches || document.hidden || slider.matches(':hover') || slider.contains(document.activeElement)) return;
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

      const onPointerEnter = () => stop();
      const onPointerLeave = () => restart();
      const onFocusIn = () => stop();
      const onFocusOut = (event: FocusEvent) => {
        if (!slider.contains(event.relatedTarget as Node | null)) restart();
      };
      const onVisibilityChange = () => restart();
      const onMotionChange = () => restart();
      slider.addEventListener('mouseenter', onPointerEnter);
      slider.addEventListener('mouseleave', onPointerLeave);
      slider.addEventListener('focusin', onFocusIn);
      slider.addEventListener('focusout', onFocusOut);
      document.addEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.addEventListener('change', onMotionChange);
      cleanup.push(() => slider.removeEventListener('mouseenter', onPointerEnter));
      cleanup.push(() => slider.removeEventListener('mouseleave', onPointerLeave));
      cleanup.push(() => slider.removeEventListener('focusin', onFocusIn));
      cleanup.push(() => slider.removeEventListener('focusout', onFocusOut));
      cleanup.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));
      cleanup.push(() => reducedMotion.removeEventListener('change', onMotionChange));

      show(0);
      restart();
      cleanup.push(stop);
    }

    return () => {
      cleanup.forEach((fn) => fn());
      document.body.classList.remove('menu-open');
    };
  }, [rootRef]);
}
