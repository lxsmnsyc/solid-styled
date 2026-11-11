/**
 * The only script the pages load. Pages are prerendered and never hydrate;
 * this adds the few behaviors that need JavaScript and mounts the one Solid
 * island, the playground, on the pages that have it.
 */

const COPIED_LABEL = 'Copied';

function setupThemeToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) {
    return;
  }
  button.addEventListener('click', () => {
    // The stored choice wins over the system setting from now on.
    const root = document.documentElement;
    const current =
      root.dataset.theme ??
      (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked; the toggle still works for this page.
    }
  });
}

function copyText(button: HTMLButtonElement, text: string): void {
  const label = button.textContent;

  // The label says what happened, then returns.
  function show(message: string): void {
    button.textContent = message;
    setTimeout(() => {
      button.textContent = label;
    }, 1600);
  }

  navigator.clipboard.writeText(text).then(
    () => {
      show(COPIED_LABEL);
    },
    () => {
      show('Copy failed');
    },
  );
}

function setupCopyButtons(): void {
  // Buttons rendered by the page, hidden until they can work.
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-text]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      copyText(button, button.getAttribute('data-copy-text') ?? '');
    });
  }

  // Every highlighted block gets its own button.
  for (const host of document.querySelectorAll<HTMLElement>('[data-code]')) {
    const pre = host.querySelector('pre');
    if (!pre) {
      continue;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    button.addEventListener('click', () => {
      copyText(button, pre.textContent);
    });
    host.classList.add('has-copy');
    pre.after(button);
  }
}

function setupTabs(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
    const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];

    function select(tab: HTMLButtonElement, focus: boolean): void {
      for (const other of tabs) {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(other.getAttribute('aria-controls') ?? '');
        if (panel) {
          panel.hidden = !selected;
        }
      }
      if (focus) {
        tab.focus();
      }
    }

    for (const [index, tab] of tabs.entries()) {
      tab.addEventListener('click', () => {
        select(tab, false);
      });
      // Arrow keys move between tabs, as the ARIA tabs pattern expects.
      tab.addEventListener('keydown', (event) => {
        let target: number | undefined;
        if (event.key === 'ArrowRight') {
          target = (index + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
          target = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          target = 0;
        } else if (event.key === 'End') {
          target = tabs.length - 1;
        }
        if (target !== undefined) {
          event.preventDefault();
          select(tabs[target], true);
        }
      });
    }
  }
}

function setupTocSpy(): void {
  const toc = document.querySelector<HTMLElement>('[data-toc]');
  if (!toc) {
    return;
  }
  const entries: { heading: HTMLElement; link: HTMLAnchorElement }[] = [];
  for (const link of toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
    const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (heading) {
      entries.push({ heading, link });
    }
  }

  function update(): void {
    // The current section is the last heading above a line just under the header.
    let current = entries[0];
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top > 120) {
        break;
      }
      current = entry;
    }
    for (const entry of entries) {
      if (entry === current) {
        entry.link.setAttribute('aria-current', 'location');
      } else {
        entry.link.removeAttribute('aria-current');
      }
    }
  }

  let frame = 0;
  window.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

function setupHeroArt(): void {
  const art = document.querySelector<HTMLElement>('[data-hero-art]');
  if (!art || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  // The ribbons lean toward the pointer, each by a different depth.
  let frame = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (event.clientY / window.innerHeight) * 2 - 1;
        art.style.setProperty('--px', x.toFixed(3));
        art.style.setProperty('--py', y.toFixed(3));
      });
    },
    { passive: true },
  );
}

function mountIslands(): void {
  const host = document.querySelector<HTMLElement>('[data-island="playground"]');
  if (!host) {
    return;
  }
  // Solid loads only on pages with an island. A failed load leaves the
  // prerendered playground in place.
  import('./islands/mount').then(
    ({ default: mountPlayground }) => {
      mountPlayground(host);
    },
    () => undefined,
  );
}

setupThemeToggle();
setupCopyButtons();
setupTabs();
setupTocSpy();
setupHeroArt();
mountIslands();
