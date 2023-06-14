/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalEditor } from 'packages/lexical/src/LexicalEditor';
import type { NodeKey } from 'packages/lexical/src/LexicalNode';

import { EditorConfig } from 'packages/lexical/src';
import invariant from 'shared/invariant';

import { LexicalNode } from 'packages/lexical/src/LexicalNode';

/** @noInheritDoc */
export class DecoratorNode<T> extends LexicalNode {
  constructor(key?: NodeKey) {
    super(key);
  }

  decorate(editor: LexicalEditor, config: EditorConfig): T {
    invariant(false, 'decorate: base method not extended');
  }

  isIsolated(): boolean {
    return false;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }
}

export function $isDecoratorNode<T>(
  node: LexicalNode | null | undefined,
): node is DecoratorNode<T> {
  return node instanceof DecoratorNode;
}
