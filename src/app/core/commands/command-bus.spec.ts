import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { CommandBus } from './command-bus';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ObserverStore } from '../state/observer.store';
import { TelemetryStore } from '../state/telemetry.store';
import { createComponent } from './tree-commands';

describe('CommandBus (undo/redo)', () => {
  let bus: CommandBus;
  let tree: ComponentTreeStore;
  let observer: ObserverStore;

  beforeEach(() => {
    tree = new ComponentTreeStore();
    observer = new ObserverStore();
    const telemetry = { enabled: () => false, record: () => {} };
    const injector = Injector.create({
      providers: [
        { provide: ComponentTreeStore, useValue: tree },
        { provide: ObserverStore, useValue: observer },
        { provide: TelemetryStore, useValue: telemetry },
      ],
    });
    bus = runInInjectionContext(injector, () => new CommandBus());
  });

  it('deshace y rehace una creación', () => {
    bus.dispatch(createComponent('root', 'button'));
    expect(tree.childrenOf('root').length).toBe(1);
    bus.undo();
    expect(tree.childrenOf('root').length).toBe(0);
    bus.redo();
    expect(tree.childrenOf('root').length).toBe(1);
  });

  it('registra el origen (user/agent)', () => {
    bus.dispatch(createComponent('root', 'card'), 'agent');
    expect(bus.past()[0].origin).toBe('agent');
    expect(bus.canUndo()).toBe(true);
  });

  it('limpia el redo al despachar una nueva acción', () => {
    bus.dispatch(createComponent('root', 'button'));
    bus.undo();
    expect(bus.canRedo()).toBe(true);
    bus.dispatch(createComponent('root', 'text'));
    expect(bus.canRedo()).toBe(false);
  });

  it('narra acciones manuales en el Observador', () => {
    bus.dispatch(createComponent('root', 'button'));
    expect(observer.count()).toBe(1);
    expect(observer.events()[0].origin).toBe('user');
    expect(observer.events()[0].action).toBe('create_component');
  });

  it('no narra acciones del agente (las narra EditingToolsService)', () => {
    bus.dispatch(createComponent('root', 'button'), 'agent');
    expect(observer.count()).toBe(0);
  });

  it('respeta el toggle del Modo Observador', () => {
    observer.toggle();
    bus.dispatch(createComponent('root', 'button'));
    expect(observer.count()).toBe(0);
  });

  it('dispatchBatch agrupa varios pasos en un solo undo', () => {
    bus.dispatchBatch(
      [createComponent('root', 'button'), createComponent('root', 'text')],
      'agent',
    );
    expect(tree.childrenOf('root').length).toBe(2);
    expect(bus.past().length).toBe(1);
    bus.undo();
    expect(tree.childrenOf('root').length).toBe(0);
  });

  it('dispatchBatch revierte si un paso falla', () => {
    expect(() =>
      bus.dispatchBatch(
        [
          createComponent('root', 'button'),
          {
            type: 'update',
            label: 'falla',
            run: () => {
              throw new Error('boom');
            },
          },
        ],
        'agent',
      ),
    ).toThrow('boom');
    expect(tree.childrenOf('root').length).toBe(0);
    expect(bus.past().length).toBe(0);
  });
});
