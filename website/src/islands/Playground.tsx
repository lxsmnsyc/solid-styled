import type { JSX } from '@solidjs/web';
import { For, createSignal, onSettled } from 'solid-js';
import { css } from 'solid-styled';
import Ribbons from './Ribbons';

interface Control {
  name: string;
  unit: string;
  min: number;
  max: number;
  get(): number;
  set(value: number): void;
}

/** Finds the scope id solid-styled put on an element, such as `c-1a2b3c-0`. */
function findScope(element: Element): string | undefined {
  for (const attribute of element.getAttributeNames()) {
    if (attribute.startsWith('s:')) {
      return attribute.slice(2);
    }
  }
  return undefined;
}

/**
 * Sliders driving the three interpolated values of `Ribbons`. The counters
 * watch the DOM: the element's `style` attribute changes on every input,
 * while the sheet in `<head>` is never written again.
 */
export default function Playground(): JSX.Element {
  const [hue, setHue] = createSignal(278);
  const [tilt, setTilt] = createSignal(0);
  const [gap, setGap] = createSignal(0);
  const [inline, setInline] = createSignal('');
  const [writes, setWrites] = createSignal(0);
  const [rewrites, setRewrites] = createSignal(0);
  let stage: HTMLDivElement | undefined;

  const controls: Control[] = [
    {
      name: 'Hue',
      unit: '',
      min: 0,
      max: 360,
      get: hue,
      set: (value) => {
        setHue(value);
      },
    },
    {
      name: 'Tilt',
      unit: 'deg',
      min: -30,
      max: 30,
      get: tilt,
      set: (value) => {
        setTilt(value);
      },
    },
    {
      name: 'Gap',
      unit: 'px',
      min: 0,
      max: 24,
      get: gap,
      set: (value) => {
        setGap(value);
      },
    },
  ];

  onSettled(() => {
    const target = stage?.firstElementChild;
    if (!target) {
      return undefined;
    }
    setInline(target.getAttribute('style') ?? '');

    // Every value change is one write to the element's style attribute.
    const styleObserver = new MutationObserver(() => {
      setWrites((count) => count + 1);
      setInline(target.getAttribute('style') ?? '');
    });
    styleObserver.observe(target, { attributes: true, attributeFilter: ['style'] });

    // The sheet itself: any change to its text would count as a rewrite.
    const scope = findScope(target);
    const sheetObserver = new MutationObserver(() => {
      setRewrites((count) => count + 1);
    });
    for (const sheet of document.head.querySelectorAll('style')) {
      if (scope && sheet.getAttribute('s:id')?.startsWith(scope)) {
        sheetObserver.observe(sheet, { childList: true, characterData: true, subtree: true });
      }
    }

    return () => {
      styleObserver.disconnect();
      sheetObserver.disconnect();
    };
  });

  css`
    .playground {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      gap: clamp(1.5rem, 4vw, 3.5rem);
      align-items: center;
    }
    .stage {
      position: relative;
      display: grid;
      place-items: center;
      padding: clamp(2rem, 6vw, 4rem);
      border-radius: var(--radius);
      background: radial-gradient(circle at 50% 45%, var(--glow), transparent 65%), var(--surface);
      border: 1px solid var(--line);
    }
    .stage > :global(*) {
      width: min(100%, 17rem);
    }
    .panel {
      display: grid;
      gap: 1.75rem;
    }
    .controls {
      display: grid;
      gap: 1.25rem;
    }
    label {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.5rem;
      font: 500 0.8125rem/1 var(--font-mono);
      color: var(--text-2);
    }
    output {
      color: var(--text);
      font-variant-numeric: tabular-nums;
    }
    input {
      grid-column: 1 / -1;
      width: 100%;
      height: 1.5rem;
      margin: 0;
      background: none;
      accent-color: var(--accent);
      cursor: pointer;
      appearance: none;
    }
    input::-webkit-slider-runnable-track {
      height: 4px;
      border-radius: 4px;
      background: var(--gradient);
    }
    input::-moz-range-track {
      height: 4px;
      border-radius: 4px;
      background: var(--gradient);
    }
    input::-webkit-slider-thumb {
      appearance: none;
      width: 1.125rem;
      height: 1.125rem;
      margin-top: -7px;
      border: 2px solid var(--bg);
      border-radius: 50%;
      background: var(--text);
      box-shadow: 0 0 0 1px var(--line-strong);
    }
    input::-moz-range-thumb {
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--bg);
      border-radius: 50%;
      background: var(--text);
    }
    input:focus-visible {
      outline-offset: 4px;
    }
    .inspector {
      display: grid;
      gap: 0.75rem;
      padding: 1rem 1.125rem;
      border-radius: var(--radius-sm);
      background: var(--code-bg);
      border: 1px solid var(--line);
      font: 400 0.75rem/1.6 var(--font-mono);
    }
    code {
      display: block;
      min-height: 3.2em;
      color: var(--text-2);
      overflow-wrap: anywhere;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin: 0;
      padding-top: 0.75rem;
      border-top: 1px solid var(--line);
    }
    dt {
      color: var(--text-3);
    }
    dd {
      margin: 0.125rem 0 0;
      color: var(--text);
      font-size: 1.375rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 52rem) {
      .playground {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;

  return (
    <div class="playground">
      <div
        class="stage"
        ref={(element) => {
          stage = element;
        }}
      >
        <Ribbons hue={String(hue())} tilt={String(tilt())} gap={String(gap())} />
      </div>
      <div class="panel">
        <div class="controls">
          <For each={controls}>
            {(control) => (
              <label>
                {control.name}
                <output>
                  {control.get()}
                  {control.unit}
                </output>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={control.get()}
                  onInput={(event) => {
                    control.set(event.currentTarget.valueAsNumber);
                  }}
                />
              </label>
            )}
          </For>
        </div>
        <div class="inspector" aria-live="off">
          <code>{inline() ? `style="${inline()}"` : 'style="…"'}</code>
          <dl>
            <div>
              <dt>style writes</dt>
              <dd>{writes()}</dd>
            </div>
            <div>
              <dt>sheet rewrites</dt>
              <dd>{rewrites()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
