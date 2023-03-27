import { CellValue } from "./CellValue"

export class LinkedListNode {
  private value: CellValue
  private next: LinkedListNode | null
  constructor(value: CellValue) {
    this.value = value
    this.next = null
  }

  getValue(): CellValue {
    return this.value
  }

  getNext(): LinkedListNode | null {
    return this.next
  }

  setNext(next: LinkedListNode): void {
    this.next = next
  }
}
