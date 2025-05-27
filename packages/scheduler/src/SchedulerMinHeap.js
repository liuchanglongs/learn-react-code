/**
 * @Author: lcl
 * @Date: 2024/11/14
 */
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

type Heap<T: Node> = Array<T>;
type Node = {
  id: number,
  sortIndex: number,
  ...
};
// 推入一个元素 ：推入前会设置sortIndex：来控制这个节点是否延期
export function push<T: Node>(heap: Heap<T>, node: T): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

// 取出堆顶的一个
export function peek<T: Node>(heap: Heap<T>): T | null {
  // 返回数组第一个元素
  return heap.length === 0 ? null : heap[0];
}

// 弹出一个
export function pop<T: Node>(heap: Heap<T>): T | null {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  // 取出最后一个
  const last = heap.pop();
  if (last !== first) {
    // $FlowFixMe[incompatible-type]
    // 将最后一个放入第一个
    heap[0] = last;
    // $FlowFixMe[incompatible-call]
    siftDown(heap, last, 0);
  }
  return first;
}
// 向上调整
function siftUp<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  while (index > 0) {
    //等同于 Math.floor((index - 1) / 2)
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    // sortIndex 来比较值，小的放前面，大的后面
    // sortIndex 通常与任务的过期时间相关，较小的 sortIndex 表示更紧急的任务
    if (compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}
// 向下调整
function siftDown<T: Node>(heap: Heap<T>, node: T, i: number): void {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  // 在向下调整时，我们需要将当前节点与它的子节点比较，并交换到合适的位置。但叶子节点没有子节点，因此不需要进行任何比较或交换。
  // const halfLength = length >>> 1; 和 index < halfLength 的组合使用确保了：

// 只处理有子节点的内部节点
// 避免访问越界的无效索引
// 显著减少不必要的比较操作（约减少一半）
  while (index < halfLength) {
    // 左边节点
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    // 又边节点
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those. 先比左边的
    if (compare(left, node) < 0) {
      // right, left 谁大
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}
/**
 * 两个元素比较:
 * 在最小堆中的应用
在最小堆中，这个比较函数决定了元素的排列顺序：

堆顶元素始终是 sortIndex 最小的任务
如果多个任务 sortIndex 相同，则堆顶是 id 最小的任务

这正是 React 调度系统需要的行为：确保高优先级任务优先执行，同时公平处理相同优先级的任务
 * */ 

function compare(a: Node, b: Node) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  // 时间相同为啥要比较id?
  // 当多个任务具有相同优先级时，使用 id 作为次要排序依据，确保先创建的任务先执行
  return diff !== 0 ? diff : a.id - b.id;
}
