/** @module lexical */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type { PasteCommandType } from './lexical';
export type {
  CommandListener,
  CommandListenerPriority,
  CommandPayloadType,
  CreateEditorArgs,
  EditableListener,
  EditorConfig,
  EditorThemeClasses,
  Klass,
  LexicalCommand,
  LexicalEditor,
  MutationListener,
  NodeMutation,
  SerializedEditor,
  Spread,
} from './lexical';
export type { EditorState, SerializedEditorState } from './lexical';
export type {
  DOMChildConversion,
  DOMConversion,
  DOMConversionFn,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  NodeMap,
  SerializedLexicalNode,
} from './lexical';
export type {
  BaseSelection,
  ElementPointType as ElementPoint,
  GridMapType,
  GridMapValueType,
  GridSelection,
  GridSelectionShape,
  NodeSelection,
  Point,
  RangeSelection,
  TextPointType as TextPoint,
} from './lexical';
export type {
  ElementFormatType,
  SerializedElementNode,
} from './lexical';
export type { SerializedGridCellNode } from './lexical';
export type { SerializedRootNode } from './lexical';
export type {
  SerializedTextNode,
  TextFormatType,
  TextModeType,
} from './lexical';

// TODO Move this somewhere else and/or recheck if we still need this
export {
  BLUR_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
  CLICK_COMMAND,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  COPY_COMMAND,
  createCommand,
  CUT_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  DRAGEND_COMMAND,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  FOCUS_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  INSERT_TAB_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_MODIFIER_COMMAND,
  KEY_SPACE_COMMAND,
  KEY_TAB_COMMAND,
  MOVE_TO_END,
  MOVE_TO_START,
  OUTDENT_CONTENT_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  REMOVE_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from './lexical';
export {
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  createEditor,
} from './lexical';
export type { EventHandler } from './lexical';
export { $normalizeSelection as $normalizeSelection__EXPERIMENTAL } from './lexical';
export {
  $createNodeSelection,
  $createRangeSelection,
  $getPreviousSelection,
  $getSelection,
  $getTextContent,
  $insertNodes,
  $isBlockElementNode,
  $isNodeSelection,
  $isRangeSelection,
  DEPRECATED_$computeGridMap,
  DEPRECATED_$createGridSelection,
  DEPRECATED_$getNodeTriplet,
  DEPRECATED_$isGridSelection,
} from './lexical';
export { $parseSerializedNode } from './lexical';
export {
  $addUpdateTag,
  $applyNodeReplacement,
  $copyNode,
  $getAdjacentNode,
  $getNearestNodeFromDOMNode,
  $getNearestRootOrShadowRoot,
  $getNodeByKey,
  $getRoot,
  $hasAncestor,
  $hasUpdateTag,
  $isInlineElementOrDecoratorNode,
  $isLeafNode,
  $isRootOrShadowRoot,
  $nodesOfType,
  $setCompositionKey,
  $setSelection,
  $splitNode,
  getNearestEditorFromDOMNode,
  isSelectionCapturedInDecoratorInput,
  isSelectionWithinEditor,
} from './lexical';
export { $isDecoratorNode, DecoratorNode } from './lexical';
export { $isElementNode, ElementNode } from './lexical';
export {
  DEPRECATED_$isGridCellNode,
  DEPRECATED_GridCellNode,
} from './lexical';
export {
  DEPRECATED_$isGridNode,
  DEPRECATED_GridNode,
} from './lexical';
export {
  DEPRECATED_$isGridRowNode,
  DEPRECATED_GridRowNode,
} from './lexical';
export type { SerializedLineBreakNode } from './lexical';
export {
  $createLineBreakNode,
  $isLineBreakNode,
  LineBreakNode,
} from './lexical';
export type { SerializedParagraphNode } from './lexical';
export {
  $createParagraphNode,
  $isParagraphNode,
  ParagraphNode,
} from './lexical';
export { $isRootNode, RootNode } from './lexical';
export type { SerializedTabNode } from './lexical';
export { $createTabNode, $isTabNode, TabNode } from './lexical';
export { $createTextNode, $isTextNode, TextNode } from './lexical';
