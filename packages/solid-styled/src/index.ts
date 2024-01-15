declare module 'solid-js' {
  // biome-ignore lint/style/noNamespace: <explanation>
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
