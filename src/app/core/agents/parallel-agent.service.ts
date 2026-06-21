import { Injectable, inject } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { EditingToolsService } from '../webmcp/editing-tools.service';
import { ParallelAgentRunner } from './parallel-agent-runner';

/** Servicio inyectable para ejecutar demos multi-agente serializadas. */
@Injectable({ providedIn: 'root' })
export class ParallelAgentService {
  private readonly edit = inject(EditingToolsService);
  private readonly tree = inject(ComponentTreeStore);

  runTwoAgentDemo(): void {
    new ParallelAgentRunner(this.edit, this.tree).runTwoAgentDemo();
  }
}
