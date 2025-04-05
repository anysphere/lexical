/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ListNode, ListType } from './';
import type {
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  EditorThemeClasses,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical';

import { getStyleObjectFromCSS } from '@lexical/selection';
import {
  addClassNamesToElement,
  removeClassNamesFromElement,
} from '@lexical/utils';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  ElementNode,
  LexicalEditor,
} from 'lexical';
import invariant from 'shared/invariant';
import normalizeClassNames from 'shared/normalizeClassNames';

import { $createListNode, $isListNode } from './';
import { $handleIndent, $handleOutdent, mergeLists } from './formatList';
import { isNestedListNode } from './utils';

import { $getListDepth, wrapInListItem } from './utils';


export type SerializedListItemNode = Spread<
  {
    checked: boolean | undefined;
    value: number;
  },
  SerializedElementNode
>;

function applyMarkerStyles(
  dom: HTMLElement,
  node: ListItemNode,
  prevNode: ListItemNode | null,
): void {
  const styles: Record<string, string> = getStyleObjectFromCSS(
    node.__textStyle,
  );
  for (const k in styles) {
    dom.style.setProperty(`--listitem-marker-${k}`, styles[k]);
  }
  if (prevNode) {
    for (const k in getStyleObjectFromCSS(prevNode.__textStyle)) {
      if (!(k in styles)) {
        dom.style.removeProperty(`--listitem-marker-${k}`);
      }
    }
  }
}

/** @noInheritDoc */
export class ListItemNode extends ElementNode {
  /** @internal */
  __value: number;
  /** @internal */
  __checked?: boolean;

  static getType(): string {
    return 'listitem';
  }

  static clone(node: ListItemNode): ListItemNode {
    return new ListItemNode(node.__value, node.__checked, node.__key);
  }

  constructor(value?: number, checked?: boolean, key?: NodeKey) {
    super(key);
    this.__value = value === undefined ? 1 : value;
    this.__checked = checked;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('li');
    const parent = this.getParent();
    if ($isListNode(parent) && parent.getListType() === 'check') {
      updateListItemChecked(element, this, null, parent);
    }
    element.value = this.__value;
    $setListItemThemeClassNames(element, config.theme, this);
    const nextStyle = this.__style;
    if (nextStyle) {
      element.style.cssText = nextStyle;
    }
    applyMarkerStyles(element, this, null);
    return element;
  }

  updateDOM(
    prevNode: ListItemNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    const parent = this.getParent();
    if ($isListNode(parent) && parent.getListType() === 'check') {
      updateListItemChecked(dom, this, prevNode, parent);
    }
    // @ts-expect-error - this is always HTMLListItemElement
    dom.value = this.__value;
    $setListItemThemeClassNames(dom, config.theme, this);
    const prevStyle = prevNode.__style;
    const nextStyle = this.__style;
    if (prevStyle !== nextStyle) {
      if (nextStyle === '') {
        dom.removeAttribute('style');
      } else {
        dom.style.cssText = nextStyle;
      }
    }
    applyMarkerStyles(dom, this, prevNode);
    return false;
  }

  static transform(): (node: LexicalNode) => void {
    return (node: LexicalNode) => {
      invariant($isListItemNode(node), 'node is not a ListItemNode');
      if (node.__checked == null) {
        return;
      }
      const parent = node.getParent();
      if ($isListNode(parent)) {
        if (parent.getListType() !== 'check' && node.getChecked() != null) {
          node.setChecked(undefined);
        }
      }
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      li: () => ({
        conversion: $convertListItemElement,
        priority: 0,
      }),
    };
  }

  static importJSON(serializedNode: SerializedListItemNode): ListItemNode {
    return $createListItemNode().updateFromJSON(serializedNode);
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedListItemNode>,
  ): this {
    return super
      .updateFromJSON(serializedNode)
      .setValue(serializedNode.value)
      .setChecked(serializedNode.checked);
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = this.createDOM(editor._config);
    element.style.textAlign = this.getFormatType();
    const direction = this.getDirection();
    if (direction) {
      element.dir = direction;
    }
    return {
      element,
    };
  }

  exportJSON(): SerializedListItemNode {
    return {
      ...super.exportJSON(),
      checked: this.getChecked(),
      value: this.getValue(),
    };
  }

  append(...nodes: LexicalNode[]): this {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if ($isElementNode(node) && this.canMergeWith(node)) {
        const children = node.getChildren();
        this.append(...children);
        node.remove();
      } else {
        super.append(node);
      }
    }

    return this;
  }

  replace<N extends LexicalNode>(
    replaceWithNode: N,
    includeChildren?: boolean,
  ): N {
    if ($isListItemNode(replaceWithNode)) {
      return super.replace(replaceWithNode);
    }
    this.setIndent(0);
    const list = this.getParentOrThrow();
    if (!$isListNode(list)) {
      return replaceWithNode;
    }
    if (list.__first === this.getKey()) {
      list.insertBefore(replaceWithNode);
    } else if (list.__last === this.getKey()) {
      list.insertAfter(replaceWithNode);
    } else {
      // Split the list
      const newList = $createListNode(list.getListType());
      let nextSibling = this.getNextSibling();
      while (nextSibling) {
        const nodeToAppend = nextSibling;
        nextSibling = nextSibling.getNextSibling();
        newList.append(nodeToAppend);
      }
      list.insertAfter(replaceWithNode);
      replaceWithNode.insertAfter(newList);
    }
    if (includeChildren) {
      invariant(
        $isElementNode(replaceWithNode),
        'includeChildren should only be true for ElementNodes',
      );
      this.getChildren().forEach((child: LexicalNode) => {
        replaceWithNode.append(child);
      });
    }
    this.remove();
    if (list.getChildrenSize() === 0) {
      list.remove();
    }
    return replaceWithNode;
  }

  insertAfter(node: LexicalNode, restoreSelection = true): LexicalNode {
    const listNode = this.getParentOrThrow();

    if (!$isListNode(listNode)) {
      invariant(
        false,
        'insertAfter: list node is not parent of list item node',
      );
    }

    if ($isListItemNode(node)) {
      return super.insertAfter(node, restoreSelection);
    }

    const siblings = this.getNextSiblings();

    // Split the lists and insert the node in between them
    listNode.insertAfter(node, restoreSelection);

    if (siblings.length !== 0) {
      const newListNode = $createListNode(listNode.getListType());

      siblings.forEach((sibling) => newListNode.append(sibling));

      node.insertAfter(newListNode, restoreSelection);
    }

    return node;
  }

  remove(preserveEmptyParent?: boolean): void {
    const prevSibling = this.getPreviousSibling();
    const nextSibling = this.getNextSibling();
    super.remove(preserveEmptyParent);

    if (
      prevSibling &&
      nextSibling &&
      isNestedListNode(prevSibling) &&
      isNestedListNode(nextSibling)
    ) {
      mergeLists(prevSibling.getFirstChild(), nextSibling.getFirstChild());
      nextSibling.remove();
    }
  }

  insertNewAfter(
    _: RangeSelection,
    restoreSelection = true,
  ): ListItemNode | ParagraphNode {
    const newElement = $createListItemNode()
      .updateFromJSON(this.exportJSON())
      .setChecked(this.getChecked() ? false : undefined);

    this.insertAfter(newElement, restoreSelection);

    return newElement;
  }

  collapseAtStart(selection: RangeSelection): true {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    const listNode = this.getParentOrThrow();
    const listNodeParent = listNode.getParentOrThrow();
    const isIndented = $isListItemNode(listNodeParent);

    if (listNode.getChildrenSize() === 1) {
      if (isIndented) {
        // if the list node is nested, we just want to remove it,
        // effectively unindenting it.
        listNode.remove();
        listNodeParent.select();
      } else {
        listNode.insertBefore(paragraph);
        listNode.remove();
        // If we have selection on the list item, we'll need to move it
        // to the paragraph
        const anchor = selection.anchor;
        const focus = selection.focus;
        const key = paragraph.getKey();

        if (anchor.type === 'element' && anchor.getNode().is(this)) {
          anchor.set(key, anchor.offset, 'element');
        }

        if (focus.type === 'element' && focus.getNode().is(this)) {
          focus.set(key, focus.offset, 'element');
        }
      }
    } else {
      listNode.insertBefore(paragraph);
      this.remove();
    }

    return true;
  }

  getValue(): number {
    const self = this.getLatest();

    return self.__value;
  }

  setValue(value: number): this {
    const self = this.getWritable();
    self.__value = value;
    return self;
  }

  getChecked(): boolean | undefined {
    const self = this.getLatest();

    let listType: ListType | undefined;

    const parent = this.getParent();
    if ($isListNode(parent)) {
      listType = parent.getListType();
    }

    return listType === 'check' ? Boolean(self.__checked) : undefined;
  }

  setChecked(checked?: boolean): this {
    const self = this.getWritable();
    self.__checked = checked;
    return self;
  }

  toggleChecked(): this {
    const self = this.getWritable();
    return self.setChecked(!self.__checked);
  }

  getIndent(): number {
    // If we don't have a parent, we are likely serializing
    const parent = this.getParent();
    if (parent === null || !this.isAttached()) {
      return this.getLatest().__indent;
    }
    // ListItemNode should always have a ListNode for a parent.
    let listNodeParent = parent.getParentOrThrow();
    let indentLevel = 0;
    while ($isListItemNode(listNodeParent)) {
      listNodeParent = listNodeParent.getParentOrThrow().getParentOrThrow();
      indentLevel++;
    }

    return indentLevel;
  }

  setIndent(indent: number): this {
    invariant(typeof indent === 'number', 'Invalid indent value.');
    indent = Math.floor(indent);
    invariant(indent >= 0, 'Indent value must be non-negative.');
    let currentIndent = this.getIndent();
    while (currentIndent !== indent) {
      if (currentIndent < indent) {
        $handleIndent(this);
        currentIndent++;
      } else {
        $handleOutdent(this);
        currentIndent--;
      }
    }

    return this;
  }

  /** @deprecated @internal */
  canInsertAfter(node: LexicalNode): boolean {
    return $isListItemNode(node);
  }

  /** @deprecated @internal */
  canReplaceWith(replacement: LexicalNode): boolean {
    return $isListItemNode(replacement);
  }

  canMergeWith(node: LexicalNode): boolean {
    return $isListItemNode(node) || $isParagraphNode(node);
  }

  extractWithChild(child: LexicalNode, selection: BaseSelection): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      this.getTextContent().length === selection.getTextContent().length
    );
  }

  isParentRequired(): true {
    return true;
  }

  createParentElementNode(): ElementNode {
    return $createListNode('bullet');
  }

  canMergeWhenEmpty(): true {
    return true;
  }
}

function $setListItemThemeClassNames(
  dom: HTMLElement,
  editorThemeClasses: EditorThemeClasses,
  node: ListItemNode,
): void {
  const classesToAdd = [];
  const classesToRemove = [];
  const listTheme = editorThemeClasses.list;
  const listItemClassName = listTheme ? listTheme.listitem : undefined;
  let nestedListItemClassName;

  if (listTheme && listTheme.nested) {
    nestedListItemClassName = listTheme.nested.listitem;
  }

  if (listItemClassName !== undefined) {
    classesToAdd.push(...normalizeClassNames(listItemClassName));
  }

  if (listTheme) {
    const parentNode = node.getParent();
    const isCheckList =
      $isListNode(parentNode) && parentNode.getListType() === 'check';
    const checked = node.getChecked();

    if (!isCheckList || checked) {
      classesToRemove.push(listTheme.listitemUnchecked);
    }

    if (!isCheckList || !checked) {
      classesToRemove.push(listTheme.listitemChecked);
    }

    if (isCheckList) {
      classesToAdd.push(
        checked ? listTheme.listitemChecked : listTheme.listitemUnchecked,
      );
    }
  }

  if (nestedListItemClassName !== undefined) {
    const nestedListItemClasses = normalizeClassNames(nestedListItemClassName);

    if (node.getChildren().some((child) => $isListNode(child))) {
      classesToAdd.push(...nestedListItemClasses);
    } else {
      classesToRemove.push(...nestedListItemClasses);
    }
  }

  if (classesToRemove.length > 0) {
    removeClassNamesFromElement(dom, ...classesToRemove);
  }

  if (classesToAdd.length > 0) {
    addClassNamesToElement(dom, ...classesToAdd);
  }
}

function updateListItemChecked(
  dom: HTMLElement,
  listItemNode: ListItemNode,
  prevListItemNode: ListItemNode | null,
  listNode: ListNode,
): void {
  // Only add attributes for leaf list items
  if ($isListNode(listItemNode.getFirstChild())) {
    dom.removeAttribute('role');
    dom.removeAttribute('tabIndex');
    dom.removeAttribute('aria-checked');
  } else {
    dom.setAttribute('role', 'checkbox');
    dom.setAttribute('tabIndex', '-1');

    if (
      !prevListItemNode ||
      listItemNode.__checked !== prevListItemNode.__checked
    ) {
      dom.setAttribute(
        'aria-checked',
        listItemNode.getChecked() ? 'true' : 'false',
      );
    }
  }
}

function $convertListItemElement(domNode: HTMLElement): DOMConversionOutput {
  const isGitHubCheckList = domNode.classList.contains('task-list-item');
  if (isGitHubCheckList) {
    for (const child of domNode.children) {
      if (child.tagName === 'INPUT') {
        return $convertCheckboxInput(child);
      }
    }
  }

  const ariaCheckedAttr = domNode.getAttribute('aria-checked');
  const checked =
    ariaCheckedAttr === 'true'
      ? true
      : ariaCheckedAttr === 'false'
        ? false
        : undefined;
  return { node: $createListItemNode(checked) };
}

function $convertCheckboxInput(domNode: Element): DOMConversionOutput {
  const isCheckboxInput = domNode.getAttribute('type') === 'checkbox';
  if (!isCheckboxInput) {
    return { node: null };
  }
  const checked = domNode.hasAttribute('checked');
  return { node: $createListItemNode(checked) };
}

/**
 * Creates a new List Item node, passing true/false will convert it to a checkbox input.
 * @param checked - Is the List Item a checkbox and, if so, is it checked? undefined/null: not a checkbox, true/false is a checkbox and checked/unchecked, respectively.
 * @returns The new List Item.
 */
export function $createListItemNode(checked?: boolean): ListItemNode {
  return $applyNodeReplacement(new ListItemNode(undefined, checked));
}

/**
 * Checks to see if the node is a ListItemNode.
 * @param node - The node to be checked.
 * @returns true if the node is a ListItemNode, false otherwise.
 */
export function $isListItemNode(
  node: LexicalNode | null | undefined,
): node is ListItemNode {
  return node instanceof ListItemNode;
}

/**
 * --------------------------------------------------
 */

export type SerializedListNode = Spread<
  {
    listType: ListType;
    start: number;
    tag: ListNodeTagType;
  },
  SerializedElementNode
>;

export type ListType = 'number' | 'bullet' | 'check';

export type ListNodeTagType = 'ul' | 'ol';

/** @noInheritDoc */
export class ListNode extends ElementNode {
  /** @internal */
  __tag: ListNodeTagType;
  /** @internal */
  __start: number;
  /** @internal */
  __listType: ListType;

  static getType(): string {
    return 'list';
  }

  static clone(node: ListNode): ListNode {
    const listType = node.__listType || TAG_TO_LIST_TYPE[node.__tag];

    return new ListNode(listType, node.__start, node.__key);
  }

  constructor(listType: ListType, start: number, key?: NodeKey) {
    super(key);
    const _listType = TAG_TO_LIST_TYPE[listType] || listType;
    this.__listType = _listType;
    this.__tag = _listType === 'number' ? 'ol' : 'ul';
    this.__start = start;
  }

  getTag(): ListNodeTagType {
    return this.__tag;
  }

  setListType(type: ListType): void {
    const writable = this.getWritable();
    writable.__listType = type;
    writable.__tag = type === 'number' ? 'ol' : 'ul';
  }

  getListType(): ListType {
    return this.__listType;
  }

  getStart(): number {
    return this.__start;
  }

  // View

  createDOM(config: EditorConfig, _editor?: LexicalEditor): HTMLElement {
    const tag = this.__tag;
    const dom = document.createElement(tag);

    if (this.__start !== 1) {
      dom.setAttribute('start', String(this.__start));
    }
    // @ts-expect-error Internal field.
    dom.__lexicalListType = this.__listType;
    setListThemeClassNames(dom, config.theme, this);

    return dom;
  }

  updateDOM(
    prevNode: ListNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    if (prevNode.__tag !== this.__tag) {
      return true;
    }

    setListThemeClassNames(dom, config.theme, this);

    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      ol: (node: Node) => ({
        conversion: convertListNode,
        priority: 0,
      }),
      ul: (node: Node) => ({
        conversion: convertListNode,
        priority: 0,
      }),
    };
  }

  static importJSON(serializedNode: SerializedListNode): ListNode {
    const node = $createListNode(serializedNode.listType, serializedNode.start);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (element) {
      if (this.__start !== 1) {
        element.setAttribute('start', String(this.__start));
      }
      if (this.__listType === 'check') {
        element.setAttribute('__lexicalListType', 'check');
      }
    }
    return {
      element,
    };
  }

  exportJSON(): SerializedListNode {
    return {
      ...super.exportJSON(),
      listType: this.getListType(),
      start: this.getStart(),
      tag: this.getTag(),
      type: 'list',
      version: 1,
    };
  }

  canBeEmpty(): false {
    return false;
  }

  canIndent(): false {
    return false;
  }

  append(...nodesToAppend: LexicalNode[]): this {
    for (let i = 0; i < nodesToAppend.length; i++) {
      const currentNode = nodesToAppend[i];

      if ($isListItemNode(currentNode)) {
        super.append(currentNode);
      } else {
        const listItemNode = $createListItemNode();

        if ($isListNode(currentNode)) {
          listItemNode.append(currentNode);
        } else if ($isElementNode(currentNode)) {
          const textNode = $createTextNode(currentNode.getTextContent());
          listItemNode.append(textNode);
        } else {
          listItemNode.append(currentNode);
        }
        super.append(listItemNode);
      }
    }
    updateChildrenListItemValue(this);
    return this;
  }

  extractWithChild(child: LexicalNode): boolean {
    return $isListItemNode(child);
  }
}

function setListThemeClassNames(
  dom: HTMLElement,
  editorThemeClasses: EditorThemeClasses,
  node: ListNode,
): void {
  const classesToAdd = [];
  const classesToRemove = [];
  const listTheme = editorThemeClasses.list;

  if (listTheme !== undefined) {
    const listLevelsClassNames = listTheme[`${node.__tag}Depth`] || [];
    const listDepth = $getListDepth(node) - 1;
    const normalizedListDepth = listDepth % listLevelsClassNames.length;
    const listLevelClassName = listLevelsClassNames[normalizedListDepth];
    const listClassName = listTheme[node.__tag];
    let nestedListClassName;
    const nestedListTheme = listTheme.nested;

    if (nestedListTheme !== undefined && nestedListTheme.list) {
      nestedListClassName = nestedListTheme.list;
    }

    if (listClassName !== undefined) {
      classesToAdd.push(listClassName);
    }

    if (listLevelClassName !== undefined) {
      const listItemClasses = listLevelClassName.split(' ');
      classesToAdd.push(...listItemClasses);
      for (let i = 0; i < listLevelsClassNames.length; i++) {
        if (i !== normalizedListDepth) {
          classesToRemove.push(node.__tag + i);
        }
      }
    }

    if (nestedListClassName !== undefined) {
      const nestedListItemClasses = nestedListClassName.split(' ');

      if (listDepth > 1) {
        classesToAdd.push(...nestedListItemClasses);
      } else {
        classesToRemove.push(...nestedListItemClasses);
      }
    }
  }

  if (classesToRemove.length > 0) {
    removeClassNamesFromElement(dom, ...classesToRemove);
  }

  if (classesToAdd.length > 0) {
    addClassNamesToElement(dom, ...classesToAdd);
  }
}

/*
 * This function normalizes the children of a ListNode after the conversion from HTML,
 * ensuring that they are all ListItemNodes and contain either a single nested ListNode
 * or some other inline content.
 */
function normalizeChildren(nodes: Array<LexicalNode>): Array<ListItemNode> {
  const normalizedListItems: Array<ListItemNode> = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if ($isListItemNode(node)) {
      normalizedListItems.push(node);
      const children = node.getChildren();
      if (children.length > 1) {
        children.forEach((child) => {
          if ($isListNode(child)) {
            normalizedListItems.push(wrapInListItem(child));
          }
        });
      }
    } else {
      normalizedListItems.push(wrapInListItem(node));
    }
  }
  return normalizedListItems;
}

function convertListNode(domNode: Node): DOMConversionOutput {
  const nodeName = domNode.nodeName.toLowerCase();
  let node = null;
  if (nodeName === 'ol') {
    // @ts-ignore
    const start = domNode.start;
    node = $createListNode('number', start);
  } else if (nodeName === 'ul') {
    if (
      isHTMLElement(domNode) &&
      domNode.getAttribute('__lexicallisttype') === 'check'
    ) {
      node = $createListNode('check');
    } else {
      node = $createListNode('bullet');
    }
  }

  return {
    after: normalizeChildren,
    node,
  };
}

const TAG_TO_LIST_TYPE: Record<string, ListType> = {
  ol: 'number',
  ul: 'bullet',
};

/**
 * Creates a ListNode of listType.
 * @param listType - The type of list to be created. Can be 'number', 'bullet', or 'check'.
 * @param start - Where an ordered list starts its count, start = 1 if left undefined.
 * @returns The new ListNode
 */
export function $createListNode(listType: ListType, start = 1): ListNode {
  return $applyNodeReplacement(new ListNode(listType, start));
}

/**
 * Checks to see if the node is a ListNode.
 * @param node - The node to be checked.
 * @returns true if the node is a ListNode, false otherwise.
 */
export function $isListNode(
  node: LexicalNode | null | undefined,
): node is ListNode {
  return node instanceof ListNode;
}
