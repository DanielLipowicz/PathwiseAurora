import { migrateNode, byId } from '../src/utils/NodeUtils.js';

describe('migrateNode', () => {
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  test('moves a root node under another node and updates all references', () => {
    const nodes = [
      { id: '1', title: 'A', body: 'A', choices: [{ label: 'to 2', to: '2' }] },
      { id: '2', title: 'B', body: 'B', choices: [{ label: 'to 2.1', to: '2.1' }] },
      { id: '2.1', title: 'B1', body: 'B1', choices: [] },
      { id: '3', title: 'C', body: 'C', choices: [{ label: 'to B', to: '2' }] }
    ];

    const result = migrateNode(clone(nodes), '2', '1');

    // Node 2 becomes child of 1 -> 1.1 (since 1 has no children)
    expect(byId('1.1', result)).toBeTruthy();
    expect(byId('1.1', result).title).toBe('B');

    // Descendant 2.1 -> 1.1.1
    expect(byId('1.1.1', result)).toBeTruthy();
    expect(byId('2.1', result)).toBeFalsy();

    // Internal reference updated: (B -> B1) becomes (1.1 -> 1.1.1)
    const moved = byId('1.1', result);
    expect(moved.choices[0].to).toBe('1.1.1');

    // Incoming references updated: A.to updated from '2' to '1.1'
    expect(byId('1', result).choices[0].to).toBe('1.1');

    // Root renumbering: old root '3' becomes '2'
    expect(byId('2', result).choices[0].to).toBe('1.1');
    expect(byId('2', result).title).toBe('C');
  });

  test('moves a nested node to root and preserves subtree structure', () => {
    const nodes = [
      { id: '1', title: 'A', body: 'A', choices: [] },
      { id: '1.1', title: 'A1', body: 'A1', choices: [{ label: 'to 1.1.1', to: '1.1.1' }] },
      { id: '1.1.1', title: 'A1a', body: 'A1a', choices: [] },
      { id: '2', title: 'B', body: 'B', choices: [{ label: 'to 1.1', to: '1.1' }] }
    ];

    const result = migrateNode(clone(nodes), '1.1', null);

    // New root becomes next root id -> since roots are 1 and 2, next is 3
    expect(byId('3', result)).toBeTruthy();
    expect(byId('1.1', result)).toBeFalsy();

    // Descendant updated: 1.1.1 -> 3.1
    expect(byId('3.1', result)).toBeTruthy();
    expect(byId('1.1.1', result)).toBeFalsy();

    // Internal reference updated
    const newRoot = byId('3', result);
    expect(newRoot.choices[0].to).toBe('3.1');

    // Incoming reference from B updated
    expect(byId('2', result).choices[0].to).toBe('3');
  });

  test('inserts a root node into an occupied root ID by shifting/renumbering', () => {
    const nodes = [
      { id: '1', title: 'car', body: 'car', choices: [] },
      { id: '2', title: 'home', body: 'home', choices: [] },
      { id: '3', title: 'dog', body: 'dog', choices: [] },
      { id: '4', title: 'cat', body: 'cat', choices: [] },
      { id: '5', title: 'cow', body: 'cow', choices: [] }
    ];

    // Move "cat" (4) to root position 2
    const result = migrateNode(clone(nodes), '4', null, '2');

    expect(byId('1', result).title).toBe('car');
    expect(byId('2', result).title).toBe('cat');
    expect(byId('3', result).title).toBe('home');
    expect(byId('4', result).title).toBe('dog');
    expect(byId('5', result).title).toBe('cow');
  });

  test('throws when attempting to move a node under its own descendant', () => {
    const nodes = [
      { id: '1', title: 'A', body: 'A', choices: [] },
      { id: '1.1', title: 'A1', body: 'A1', choices: [] },
      { id: '1.1.1', title: 'A1a', body: 'A1a', choices: [] }
    ];
    expect(() => migrateNode(nodes, '1', '1.1')).toThrow();
    expect(() => migrateNode(nodes, '1', '1.1.1')).toThrow();
  });
});

