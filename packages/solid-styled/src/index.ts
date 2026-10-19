declare module '@solidjs/web' {
  // JSX namespace augmentation
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
