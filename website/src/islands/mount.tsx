import { render } from '@solidjs/web';
import Playground from './Playground';

/**
 * Draws the playground again in place of its prerendered markup, in the
 * same frame, so from then on it is live.
 */
export default function mountPlayground(host: HTMLElement): void {
  host.textContent = '';
  render(() => <Playground />, host);
}
