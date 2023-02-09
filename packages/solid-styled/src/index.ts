declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface StyleHTMLAttributes<T> {
      jsx?: boolean;
      global?: boolean;
    }
    interface IntrinsicAttributes {
      'use:solid-styled'?: boolean;
    }
  }
}

export * from './core';
