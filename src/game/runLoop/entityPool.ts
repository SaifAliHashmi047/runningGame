/**
 * Tiny object pool — reuse entity records instead of allocating `{}` every spawn.
 */

export class EntityPool<T extends object> {
  private readonly free: T[] = [];

  constructor(private readonly factory: () => T) {}

  acquire(): T {
    return this.free.pop() ?? this.factory();
  }

  release(o: T): void {
    this.free.push(o);
  }
}
