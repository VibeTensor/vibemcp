import { getService, getServiceAsync, clearCache } from '../src/services/cache.js';

describe('service cache', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('getService', () => {
    it('should create a new service instance', () => {
      class TestService {
        constructor(public accountId: string) {}
      }

      const svc = getService(TestService, 'user@test.com');
      expect(svc).toBeInstanceOf(TestService);
      expect(svc.accountId).toBe('user@test.com');
    });

    it('should return cached instance on second call', () => {
      class TestService {
        constructor(public accountId: string) {}
      }

      const first = getService(TestService, 'user@test.com');
      const second = getService(TestService, 'user@test.com');
      expect(first).toBe(second); // same reference
    });

    it('should create separate instances for different accounts', () => {
      class TestService {
        constructor(public accountId: string) {}
      }

      const a = getService(TestService, 'alice@test.com');
      const b = getService(TestService, 'bob@test.com');
      expect(a).not.toBe(b);
      expect(a.accountId).toBe('alice@test.com');
      expect(b.accountId).toBe('bob@test.com');
    });

    it('should create separate instances for different service classes', () => {
      class ServiceA {
        constructor(public accountId: string) {}
      }
      class ServiceB {
        constructor(public accountId: string) {}
      }

      const a = getService(ServiceA, 'user@test.com');
      const b = getService(ServiceB, 'user@test.com');
      expect(a).toBeInstanceOf(ServiceA);
      expect(b).toBeInstanceOf(ServiceB);
    });
  });

  describe('getServiceAsync', () => {
    it('should call factory and cache result', async () => {
      let callCount = 0;
      const factory = async () => {
        callCount++;
        return { data: 'hello' };
      };

      const first = await getServiceAsync('test:key', factory);
      expect(first).toEqual({ data: 'hello' });
      expect(callCount).toBe(1);

      const second = await getServiceAsync('test:key', factory);
      expect(second).toBe(first); // same reference
      expect(callCount).toBe(1); // factory not called again
    });
  });

  describe('clearCache', () => {
    it('should clear all cached instances', () => {
      class TestService {
        static instanceCount = 0;
        constructor(public accountId: string) {
          TestService.instanceCount++;
        }
      }
      TestService.instanceCount = 0;

      getService(TestService, 'user@test.com');
      expect(TestService.instanceCount).toBe(1);

      clearCache();

      getService(TestService, 'user@test.com');
      expect(TestService.instanceCount).toBe(2); // new instance created
    });
  });
});
