import { useEffect, useRef } from "react"
import { LinkedListNode } from "../types/LinkedListNode"

export function randomIntFromInterval(min: number, max: number): number {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<() => void>()

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.()
    }
    if (delay !== null) {
      let id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export function reverseLinkedList(head: LinkedListNode): LinkedListNode | null {
  let previousNode = null
  let currentNode = head
  while (currentNode !== null) {
    const nextNode = currentNode.getNext()
    currentNode.setNext(previousNode!)
    previousNode = currentNode
    currentNode = nextNode as LinkedListNode
  }
  return previousNode
}
