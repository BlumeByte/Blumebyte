/**
 * Global lock manager for Supabase auth operations
 * Prevents concurrent auth calls that cause lock timeout warnings
 */

class AuthLock {
  private locks: Map<string, Promise<any>> = new Map();

  async acquire<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // If there's already a pending operation for this key, wait for it
    if (this.locks.has(key)) {
      await this.locks.get(key);
      // After the previous operation completes, try again
      return this.acquire(key, fn);
    }

    // Create a new promise for this operation
    const promise = fn().finally(() => {
      // Remove the lock when done
      this.locks.delete(key);
    });

    this.locks.set(key, promise);
    return promise;
  }

  isLocked(key: string): boolean {
    return this.locks.has(key);
  }

  clear() {
    this.locks.clear();
  }
}

export const authLock = new AuthLock();
