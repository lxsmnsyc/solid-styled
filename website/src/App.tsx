import type { JSX } from '@solidjs/web';
import { httpStatus } from '@solidjs/web';
import content from 'virtual:site-content';
import type { DocPage as DocPageData } from './content-types';
import Document from './components/Document';
import DocPage from './pages/DocPage';
import DocsIndex from './pages/DocsIndex';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { TAGLINE, normalizePath } from './site';

interface AppProps {
  path: string;
}

/** Builds a page description from the first headings of a guide. */
function describeDoc(doc: DocPageData): string {
  const headings: string[] = [];
  for (const entry of doc.toc) {
    if (entry.depth === 2 && headings.length < 4) {
      headings.push(entry.text);
    }
  }
  return `${doc.title}: ${headings.join(', ')}.`;
}

/**
 * Picks the page for a path. The site is a set of static pages, so a plain
 * lookup is the whole router.
 */
export default function App(props: AppProps): JSX.Element {
  const path = normalizePath(props.path);

  if (path === '/') {
    return (
      <Document path="/" title="solid-styled" description={TAGLINE}>
        <Home />
      </Document>
    );
  }

  if (path === '/docs') {
    return (
      <Document path="/docs/" title="Docs · solid-styled" description="The solid-styled guides.">
        <DocsIndex />
      </Document>
    );
  }

  for (const [index, doc] of content.docs.entries()) {
    if (path === `/docs/${doc.slug}`) {
      return (
        <Document
          path={`/docs/${doc.slug}/`}
          title={`${doc.title} · solid-styled`}
          description={describeDoc(doc)}
        >
          <DocPage index={index} />
        </Document>
      );
    }
  }

  httpStatus(404);
  return (
    <Document path={props.path} title="Not found · solid-styled" description={TAGLINE}>
      <NotFound />
    </Document>
  );
}
