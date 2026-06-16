import { describe, it, expect, beforeEach } from 'vitest';
import { Injector, runInInjectionContext } from '@angular/core';
import { EditingToolsService } from './editing-tools.service';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ObserverStore } from '../state/observer.store';
import { AgentLogStore } from '../state/agent-log.store';
import { CommandBus } from '../commands/command-bus';
import { ProjectExportService } from '../export/project-export.service';
import { ProjectStore } from '../state/project.store';

describe('EditingToolsService (tools = Commands)', () => {
  let edit: EditingToolsService;
  let tree: ComponentTreeStore;
  let observer: ObserverStore;
  let log: AgentLogStore;

  beforeEach(() => {
    tree = new ComponentTreeStore();
    observer = new ObserverStore();
    log = new AgentLogStore();
    const busInjector = Injector.create({
      providers: [
        { provide: ComponentTreeStore, useValue: tree },
        { provide: ObserverStore, useValue: observer },
      ],
    });
    const bus = runInInjectionContext(busInjector, () => new CommandBus());
    const projects = { currentName: () => 'Alpha' };
    const exporter = { exportAsZip: async () => ({ summary: 'ok', slug: 'alpha', projectName: 'Alpha', fileCount: 1, paths: [], downloaded: true }) };
    const injector = Injector.create({
      providers: [
        { provide: ComponentTreeStore, useValue: tree },
        { provide: CommandBus, useValue: bus },
        { provide: AgentLogStore, useValue: log },
        { provide: ObserverStore, useValue: observer },
        { provide: ProjectStore, useValue: projects },
        { provide: ProjectExportService, useValue: exporter },
      ],
    });
    edit = runInInjectionContext(injector, () => new EditingToolsService());
  });

  it('create_component crea un nodo y narra con rationale', () => {
    edit.createComponent('button', 'root', 'porque sí');
    expect(tree.childrenOf('root').length).toBe(1);
    const ev = observer.events().at(-1)!;
    expect(ev.action).toBe('create_component');
    expect(ev.origin).toBe('agent');
    expect(ev.rationale).toBe('porque sí');
    expect(log.count()).toBe(1);
  });

  it('rechaza un kind inválido', () => {
    const res = edit.createComponent('banana');
    expect(res.text).toContain('inválido');
    expect(res.isError).toBe(true);
    expect(tree.childrenOf('root').length).toBe(0);
  });

  it('read_tree devuelve JSON del árbol', () => {
    const res = edit.readTree();
    expect(res.text).toContain('"id":"root"');
    expect(res.isError).toBe(false);
  });

  it('undo sin historial devuelve isError', () => {
    const res = edit.undo();
    expect(res.isError).toBe(true);
    expect(res.text).toContain('No hay acciones');
  });
});
