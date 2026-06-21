import type { AgentLane } from './agent-lane.types';
import type { EditingToolsService } from '../webmcp/editing-tools.service';
import type { LaneScopedEditingTools } from '../webmcp/lane-scoped-editing.tools';
import type { ComponentTreeStore } from '../state/component-tree.store';

/** Un paso de un plan multi-agente (ejecutado en serie por CommandBus). */
export interface ParallelAgentStep {
  lane: AgentLane;
  run: (tools: LaneScopedEditingTools, tree: ComponentTreeStore) => void;
}

/**
 * Intercala dos agentes en el tiempo. El CommandBus es síncrono: no hay carreras,
 * solo un orden determinista de Commands con undo combinado.
 */
export class ParallelAgentRunner {
  constructor(
    private readonly edit: EditingToolsService,
    private readonly tree: ComponentTreeStore,
  ) {}

  run(steps: ParallelAgentStep[]): void {
    for (const step of steps) {
      step.run(this.edit.withLane(step.lane), this.tree);
    }
  }

  /** Demo: dos agentes editan el mismo árbol; incluye un conflicto last-write-wins. */
  runTwoAgentDemo(): void {
    const root = this.tree.rootId();
    let textId = '';
    let containerId = '';

    this.run([
      {
        lane: 'A',
        run: (t) => {
          t.createComponent('container', root, 'Estructuro el layout principal.');
          containerId = this.tree.selectedId() ?? '';
        },
      },
      {
        lane: 'B',
        run: (t) => t.createComponent('card', root, 'Añado una tarjeta de métricas.'),
      },
      {
        lane: 'A',
        run: (t) => {
          if (containerId) this.tree.select(containerId);
          t.createComponent('text', containerId || root, 'Redacto el copy del hero.');
          textId = this.tree.selectedId() ?? '';
        },
      },
      {
        lane: 'B',
        run: (t) => t.createComponent('button', root, 'Añado CTA global.'),
      },
      {
        lane: 'A',
        run: (t) => {
          if (!textId) return;
          t.updateComponent(textId, 'Hero title', { text: 'Analytics en vivo' }, 'Ajusto el titular.');
        },
      },
      {
        lane: 'B',
        run: (t) => {
          if (!textId) return;
          t.updateComponent(textId, 'Dashboard KPI', { text: 'Métricas clave' }, 'Reescribo el mismo texto (conflicto).');
        },
      },
    ]);
  }
}
