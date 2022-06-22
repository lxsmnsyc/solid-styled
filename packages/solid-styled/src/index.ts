declare module "solid-js" {
  namespace JSX {
    interface StyleHTMLAttributes<T> {
      jsx?: boolean;
      global?: boolean;
      dynamic?: boolean;
    }
  }
}

export * from './core';
