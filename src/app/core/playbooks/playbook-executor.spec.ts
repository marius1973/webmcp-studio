import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentTreeStore } from '../state/component-tree.store';
import { stepsToCommands } from './playbook-executor';
import { CommandBus } from '../commands/command-bus';
import { ObserverStore } from '../state/observer.store';
import { TelemetryStore } from '../state/telemetry.store';
import { Injector, runInInjectionContext } from '@angular/core';

describe('playbook-executor', () => {
  let tree: ComponentTreeStore;
  let bus: CommandBus;

  beforeEach(() => {
    tree = new ComponentTreeStore();
    const observer = new ObserverStore();
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

  it('ejecuta landing-analytics con refs @last/@parent', () => {
    const steps = [
      { op: 'create_component' as const, kind: 'container', parentId: 'root', label: 'Hero' },
      { op: 'update_component' as const, ref: '@last', props: { direction: 'column' } },
      { op: 'create_component' as const, kind: 'text', parentId: '@last' },
      { op: 'update_component' as const, ref: '@last', props: { text: 'Hola' } },
    ];
    const commands = stepsToCommands(steps, tree);
    bus.dispatchBatch(commands, 'agent');
    expect(tree.nodeCount()).toBeGreaterThan(2);
    const texts = Object.values(tree.state().nodes).filter((n) => n.kind === 'text');
    expect(texts.some((n) => n.props['text'] === 'Hola')).toBe(true);
  });
});
