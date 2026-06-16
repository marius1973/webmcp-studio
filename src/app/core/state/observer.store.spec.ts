import { describe, it, expect } from 'vitest';
import { ObserverStore } from './observer.store';

describe('ObserverStore', () => {
  it('registra eventos cuando está habilitado', () => {
    const observer = new ObserverStore();
    observer.narrate({
      action: 'create_component',
      what: 'Creado button',
      rationale: 'test',
      origin: 'agent',
      affected: ['btn-1'],
      status: 'ok',
      at: Date.now(),
    });
    expect(observer.count()).toBe(1);
    expect(observer.agentCount()).toBe(1);
  });

  it('no registra eventos cuando está deshabilitado', () => {
    const observer = new ObserverStore();
    observer.toggle();
    observer.narrate({
      action: 'create_component',
      what: 'Creado button',
      rationale: 'test',
      origin: 'agent',
      affected: [],
      status: 'ok',
      at: Date.now(),
    });
    expect(observer.count()).toBe(0);
  });

  it('clear vacía la timeline', () => {
    const observer = new ObserverStore();
    observer.narrate({
      action: 'undo',
      what: 'undo',
      rationale: '',
      origin: 'user',
      affected: [],
      status: 'ok',
      at: Date.now(),
    });
    observer.clear();
    expect(observer.count()).toBe(0);
  });
});
