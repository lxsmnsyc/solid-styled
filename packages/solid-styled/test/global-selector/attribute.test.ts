import { describe, expect, it } from 'vitest';
import type { SolidStyledOptions } from '../../compiler';
import { compile } from '../../compiler';

const options: SolidStyledOptions = {
  verbose: false,
};

const FILE = 'src/index.ts';

describe(':global > attribute selectors', () => {
  describe('without value', () => {
    it('should scope for ident', async () => {
      const code = `
        import { css } from 'solid-styled';
        
        export default function Example() {
          css\`
            :global([ident]) {
              color: red;
            }
          \`;
        
          return <h1>Hello World</h1>;
        }
    `;
      expect((await compile(FILE, code, options)).code).toMatchSnapshot();
    });
    it('should scope for |ident', async () => {
      const code = `
        import { css } from 'solid-styled';
        
        export default function Example() {
          css\`
            :global([|ident]) {
              color: red;
            }
          \`;
        
          return <h1>Hello World</h1>;
        }
    `;
      expect((await compile(FILE, code, options)).code).toMatchSnapshot();
    });
    it('should scope for ns|ident', async () => {
      const code = `
        import { css } from 'solid-styled';
        
        export default function Example() {
          css\`
            :global([ns|ident]) {
              color: red;
            }
          \`;
        
          return <h1>Hello World</h1>;
        }
    `;
      expect((await compile(FILE, code, options)).code).toMatchSnapshot();
    });
    it('should scope for *|ident', async () => {
      const code = `
        import { css } from 'solid-styled';
        
        export default function Example() {
          css\`
            :global([*|ident]) {
              color: red;
            }
          \`;
        
          return <h1>Hello World</h1>;
        }
    `;
      expect((await compile(FILE, code, options)).code).toMatchSnapshot();
    });
  });
  describe('with value', () => {
    describe('equal', () => {
      it('should scope for ident with ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('prefix-match', () => {
      it('should scope for ident with ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('suffix-match', () => {
      it('should scope for ident with ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('substring-match', () => {
      it('should scope for ident with ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('includes-match', () => {
      it('should scope for ident with ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('dash-match', () => {
      it('should scope for ident with ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|=ident]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|="string"]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
  });
  describe('with value + s modifier', () => {
    describe('equal', () => {
      it('should scope for ident with ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('prefix-match', () => {
      it('should scope for ident with ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('suffix-match', () => {
      it('should scope for ident with ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('substring-match', () => {
      it('should scope for ident with ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('includes-match', () => {
      it('should scope for ident with ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('dash-match', () => {
      it('should scope for ident with ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|=ident s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|="string" s]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
  });
  describe('with value + i modifier', () => {
    describe('equal', () => {
      it('should scope for ident with ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('prefix-match', () => {
      it('should scope for ident with ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident^="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident^="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident^="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident^="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident^="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('suffix-match', () => {
      it('should scope for ident with ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident$="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident$="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident$="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident$="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident$="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('substring-match', () => {
      it('should scope for ident with ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident*="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident*="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident*="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident*="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident*="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('includes-match', () => {
      it('should scope for ident with ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident~="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident~="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident~="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident~="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident~="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
    describe('dash-match', () => {
      it('should scope for ident with ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|=ident', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|=ident i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ident|="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with |ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([|ident|="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with ns|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([ns|ident|="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
      it('should scope for ident with *|ident|="string"', async () => {
        const code = `
          import { css } from 'solid-styled';
          
          export default function Example() {
            css\`
              :global([*|ident|="string" i]) {
                color: red;
              }
            \`;
          
            return <h1>Hello World</h1>;
          }
      `;
        expect((await compile(FILE, code, options)).code).toMatchSnapshot();
      });
    });
  });
});
