declare module 'cloudflare:workers' {
  export class WorkerEntrypoint<T> {
    env: T;
  }
}
