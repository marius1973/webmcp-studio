import { ComponentKind, COMPONENT_KINDS } from '../state/component-tree.types';
import { ComponentTreeStore } from '../state/component-tree.store';
import { Command } from '../commands/command';
import { deleteComponent, moveComponent } from '../commands/tree-commands';
import { PlaybookStep } from './playbook.types';

const KINDS: ComponentKind[] = COMPONENT_KINDS;

interface PlaybookContext {
  lastId: string | null;
  parentId: string;
}

function asKind(kind: string): ComponentKind | null {
  return (KINDS as string[]).includes(kind) ? (kind as ComponentKind) : null;
}

function resolveParent(ref: string | undefined, ctx: PlaybookContext, tree: ComponentTreeStore): string {
  if (ref === '@last' && ctx.lastId) return ctx.lastId;
  if (ref === '@parent') return ctx.parentId;
  if (ref && tree.node(ref)) return ref;
  return tree.rootId();
}

function resolveNodeId(
  step: { ref?: string; id?: string },
  ctx: PlaybookContext,
  tree: ComponentTreeStore,
): string | null {
  if (step.id && tree.node(step.id)) return step.id;
  if (step.ref === '@last') return ctx.lastId;
  if (step.ref === '@parent') return ctx.parentId;
  if (step.ref === '@selected') return tree.selectedId();
  return ctx.lastId;
}

/** Convierte pasos en Commands; `@last` / `@parent` se resuelven al ejecutar el batch. */
export function stepsToCommands(steps: PlaybookStep[], tree: ComponentTreeStore): Command[] {
  const commands: Command[] = [];
  const ctx: PlaybookContext = { lastId: null, parentId: tree.rootId() };

  for (const step of steps) {
    switch (step.op) {
      case 'create_component': {
        const k = asKind(step.kind);
        if (!k) throw new Error(`kind inválido: ${step.kind}`);
        const parentRef = step.parentId;
        const label = step.label;
        const props = step.props;
        commands.push({
          type: 'create',
          label: `Crear ${k}`,
          run: (t) => {
            const parent = resolveParent(parentRef, ctx, t);
            ctx.parentId = parent;
            const id = t.createChild(parent, k);
            if (id) {
              ctx.lastId = id;
              t.select(id);
              if (label || props) {
                const node = t.node(id);
                if (node) {
                  t.patch(id, { label: label ?? node.label, props: { ...node.props, ...props } });
                }
              }
            }
          },
        });
        break;
      }
      case 'update_component': {
        const label = step.label;
        const props = step.props ?? {};
        commands.push({
          type: 'update',
          label: 'Actualizar nodo',
          run: (t) => {
            const id = resolveNodeId(step, ctx, t);
            if (!id) throw new Error('update_component: nodo no resuelto');
            const node = t.node(id);
            if (!node) throw new Error(`update_component: no existe ${id}`);
            t.patch(id, { label: label ?? node.label, props: { ...node.props, ...props } });
            ctx.lastId = id;
          },
        });
        break;
      }
      case 'delete_component':
        commands.push({
          type: 'delete',
          label: 'Borrar nodo',
          run: (t) => {
            const id = resolveNodeId(step, ctx, t);
            if (!id) throw new Error('delete_component: nodo no resuelto');
            deleteComponent(id).run(t);
          },
        });
        break;
      case 'move_component': {
        const newParentId = step.newParentId;
        const index = step.index ?? 0;
        commands.push({
          type: 'move',
          label: 'Mover nodo',
          run: (t) => {
            const id = resolveNodeId(step, ctx, t);
            if (!id) throw new Error('move_component: nodo no resuelto');
            moveComponent(id, newParentId, index).run(t);
          },
        });
        break;
      }
      default:
        throw new Error('Paso de playbook desconocido');
    }
  }

  return commands;
}
