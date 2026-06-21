import { describe, it, expect } from 'vitest';
import { ObserverStore } from '../state/observer.store';

describe('ObserverStore lanes', () => {
  it('cuenta pasos por carril', () => {
    const observer = new ObserverStore();
    observer.narrate({
      action: 'create_component',
      what: 'A',
      rationale: '',
      origin: 'agent',
      affected: [],
      status: 'ok',
      at: 1,
      lane: 'A',
    });
    observer.narrate({
      action: 'create_component',
      what: 'B',
      rationale: '',
      origin: 'agent',
      affected: [],
      status: 'ok',
      at: 2,
      lane: 'B',
    });
    observer.narrate({
      action: 'create_component',
      what: 'B2',
      rationale: '',
      origin: 'agent',
      affected: [],
      status: 'ok',
      at: 3,
      lane: 'B',
    });

    expect(observer.laneCountA()).toBe(1);
    expect(observer.laneCountB()).toBe(2);
  });
});
