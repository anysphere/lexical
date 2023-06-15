import type { SerializedListItemNode } from './list';
import type { ListType, SerializedListNode } from './list';
import type { LexicalCommand } from 'lexical';

import { createCommand } from 'lexical';

import { $handleListInsertParagraph, insertList, removeList } from './list';
import {
  $createListItemNode,
  $isListItemNode,
  ListItemNode,
} from './list';
import { $createListNode, $isListNode, ListNode } from './list';
import { $getListDepth } from './list';

export {
  $createListItemNode,
  $createListNode,
  $getListDepth,
  $handleListInsertParagraph,
  $isListItemNode,
  $isListNode,
  insertList,
  ListItemNode,
  ListNode,
  ListType,
  removeList,
  SerializedListItemNode,
  SerializedListNode,
};

export const INSERT_UNORDERED_LIST_COMMAND: LexicalCommand<void> =
  createCommand('INSERT_UNORDERED_LIST_COMMAND');
export const INSERT_ORDERED_LIST_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_ORDERED_LIST_COMMAND',
);
export const INSERT_CHECK_LIST_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_CHECK_LIST_COMMAND',
);
export const REMOVE_LIST_COMMAND: LexicalCommand<void> = createCommand(
  'REMOVE_LIST_COMMAND',
);
