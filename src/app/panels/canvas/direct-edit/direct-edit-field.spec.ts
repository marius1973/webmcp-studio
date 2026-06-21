import { describe, expect, it } from 'vitest';
import { ComponentNode } from '../../../core/state/component-tree.types';
import {
  buildDirectEditPatch,
  isDirectEditableKind,
  readDirectEditValue,
} from './direct-edit-field';

const base: ComponentNode = {
  id: 'n1',
  kind: 'text',
  label: 'Label',
  props: { text: 'Hello', placeholder: 'Ph' },
  parentId: 'root',
  childIds: [],
};

describe('direct-edit-field', () => {
  it('reads values by field', () => {
    expect(readDirectEditValue(base, 'text')).toBe('Hello');
    expect(readDirectEditValue(base, 'label')).toBe('Label');
    expect(readDirectEditValue({ ...base, kind: 'input' }, 'placeholder')).toBe('Ph');
  });

  it('builds patch for text and label', () => {
    expect(buildDirectEditPatch(base, 'text', '  World ')).toEqual({
      props: { text: 'World', placeholder: 'Ph' },
    });
    expect(buildDirectEditPatch({ ...base, kind: 'button' }, 'label', 'Btn')).toEqual({
      label: 'Btn',
    });
  });

  it('flags editable kinds', () => {
    expect(isDirectEditableKind('text')).toBe(true);
    expect(isDirectEditableKind('divider')).toBe(false);
  });
});
