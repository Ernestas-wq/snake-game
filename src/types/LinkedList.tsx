import { CellValue } from "./CellValue"
import { LinkedListNode } from "./LinkedListNode"

export class LinkedList {
  private head: LinkedListNode
  private tail: LinkedListNode

  constructor(value: CellValue) {
    const node = new LinkedListNode(value)
    this.head = node
    this.tail = node
  }

  getHead(): LinkedListNode {
    return this.head
  }

  getTail(): LinkedListNode {
    return this.tail
  }

  setHead(head: LinkedListNode): void {
    this.head = head
  }

  setTail(tail: LinkedListNode): void {
    this.tail = tail
  }
}
