import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { CommandBus } from '../commands/command-bus';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ObserverStore } from '../state/observer.store';
import { TelemetryStore } from '../state/telemetry.store';
import { EditingToolsService } from '../webmcp/editing-tools.service';
import { AgentLogStore } from '../state/agent-log.store';
import { AgentConsentStore } from '../state/agent-consent.store';
import { ProjectStore } from '../state/project.store';
import { ProjectExportService } from '../export/project-export.service';
import { ParallelAgentRunner } from './parallel-agent-runner';
import { updateNode } from '../commands/tree-commands';

describe('ParallelAgentRunner', () => {
  let tree: ComponentTreeStore;
  let bus: CommandBus;
  let edit: EditingToolsService;
  let observer: ObserverStore;

  beforeEach(() => {
    tree = new ComponentTreeStore();
    observer = new ObserverStore();
    const telemetry = { enabled: () => false, record: () => {} };
    const consent = { request: async () => true };
    const projects = { currentName: () => 'test' };
    const exporter = { exportAsZip: async () => ({ summary: '', slug: 'x' }) };
    const busInjector = Injector.create({
      providers: [
        { provide: ComponentTreeStore, useValue: tree },
        { provide: ObserverStore, useValue: observer },
        { provide: TelemetryStore, useValue: telemetry },
      ],
    });
    bus = runInInjectionContext(busInjector, () => new CommandBus());
    const injector = Injector.create({
      providers: [
        { provide: ComponentTreeStore, useValue: tree },
        { provide: CommandBus, useValue: bus },
        { provide: ObserverStore, useValue: observer },
        { provide: TelemetryStore, useValue: telemetry },
        { provide: AgentLogStore, useValue: new AgentLogStore() },
        { provide: AgentConsentStore, useValue: consent },
        { provide: ProjectStore, useValue: projects },
        { provide: ProjectExportService, useValue: exporter },
      ],
    });
    edit = runInInjectionContext(injector, () => new EditingToolsService());
  });

  it('intercala carriles A y B en orden determinista', () => {
    const root = tree.rootId();
    const order: string[] = [];

    new ParallelAgentRunner(edit, tree).run([
      { lane: 'A', run: (t) => { order.push('A1'); t.createComponent('button', root, 'a'); } },
      { lane: 'B', run: (t) => { order.push('B1'); t.createComponent('text', root, 'b'); } },
      { lane: 'A', run: (t) => { order.push('A2'); t.createComponent('card', root, 'a'); } },
    ]);

    expect(order).toEqual(['A1', 'B1', 'A2']);
    expect(bus.past().length).toBe(3);
    expect(bus.past().map((e) => e.lane)).toEqual(['A', 'B', 'A']);
    expect(tree.childrenOf(root).length).toBe(3);
  });

  it('registra conflicto last-write-wins en el Observador', () => {
    const root = tree.rootId();
    edit.withLane('A').createComponent('text', root, 'primero');
    const textId = tree.selectedId()!;

    edit.withLane('B').updateComponent(textId, 'B wins', { text: 'desde B' }, 'segundo en el mismo nodo');

    const conflict = observer.events().find((e) => e.conflict);
    expect(conflict).toBeDefined();
    expect(conflict?.lane).toBe('B');
    expect(tree.node(textId)?.label).toBe('B wins');
  });

  it('undo combinado revierte el intercalado paso a paso', () => {
    new ParallelAgentRunner(edit, tree).runTwoAgentDemo();
    const count = bus.past().length;
    expect(count).toBeGreaterThan(3);

    bus.undo();
    bus.undo();
    expect(bus.past().length).toBe(count - 2);

    bus.redo();
    expect(bus.past().length).toBe(count - 1);
  });

  it('CommandBus serializa sin carreras (snapshots consistentes)', () => {
    const root = tree.rootId();
    let textId = '';

    new ParallelAgentRunner(edit, tree).run([
      { lane: 'A', run: (t) => { t.createComponent('text', root, 'x'); textId = tree.selectedId()!; } },
      {
        lane: 'B',
        run: () => {
          bus.dispatch(updateNode(textId, 'race', { text: 'y' }), 'agent', { lane: 'B' });
        },
      },
    ]);

    expect(tree.node(textId)?.label).toBe('race');
    expect(bus.past().length).toBe(2);
  });
});
