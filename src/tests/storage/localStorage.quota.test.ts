import { clearAllData } from '@/lib/storage/localStorage';
import { setItems } from '@/lib/storage/localStorage';

// Mock localStorage that throws on quota
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  let throwOnSet = false;
  return {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => {
      if (throwOnSet) {
        const err: any = new Error('QuotaExceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store[k] = v;
    },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
    _enableQuota: () => { throwOnSet = true; },
    _disableQuota: () => { throwOnSet = false; },
  } as any;
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('localStorage Quota Handling', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
    // Ensure quota not enabled by default
    if ((localStorageMock as any)._disableQuota) (localStorageMock as any)._disableQuota();
  });

  it('should throw a readable error when quota exceeded on write', () => {
    // Enable quota
    (localStorageMock as any)._enableQuota();

    expect(() => setItems([{ id: 'x' } as any])).toThrow('localStorage quota exceeded');
  });
});
