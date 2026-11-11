const { describe, it, mock, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const gremlin = require('gremlin')
const phrases = require('./index')

const __ = gremlin.process.statics

function steps (traversal) {
  return traversal.getBytecode().stepInstructions
}

function fakeGraph () {
  const calls = []
  const lists = []

  function chain () {
    return new Proxy(function () {}, {
      get (target, prop) {
        if (prop === 'then') return undefined
        if (typeof prop !== 'string') return target[prop]
        return (...args) => {
          calls.push([prop, args])
          if (prop === 'iterate') return Promise.resolve()
          if (prop === 'next') return Promise.resolve({ value: 12 })
          if (prop === 'toList') return Promise.resolve(lists.shift() ?? [])
          return chain()
        }
      }
    })
  }

  return { g: chain(), calls, lists }
}

function named (calls, name) {
  return calls.filter(([step]) => step === name)
}

describe('phrases', () => {
  beforeEach(() => {
    mock.method(console, 'log', () => {})
  })

  afterEach(() => mock.restoreAll())

  it('creates a word vertex', async () => {
    const graph = fakeGraph()

    await phrases.addVertex(graph.g, 'bike')

    assert.deepEqual(named(graph.calls, 'addV'), [['addV', ['word']]])
    assert.deepEqual(named(graph.calls, 'property'), [['property', ['name', 'bike']]])
    assert.equal(named(graph.calls, 'iterate').length, 1)
  })

  it('connects two words with an edge', async () => {
    const graph = fakeGraph()
    const from = [{ id: 'from' }]
    const to = [{ id: 'to' }]
    graph.lists.push(from, to)

    await phrases.addEdge(graph.g, 'I', 'will')

    assert.deepEqual(named(graph.calls, 'has'), [
      ['has', ['name', 'I']],
      ['has', ['name', 'will']]
    ])
    assert.deepEqual(named(graph.calls, 'addE'), [['addE', ['connnects']]])
    assert.deepEqual(named(graph.calls, 'V')[2][1], [from])
  })

  it('walks a simple path from word to word', async () => {
    const graph = fakeGraph()
    const start = [{ id: 'start' }]
    graph.lists.push(start, ['I', 'will', 'work', 'now'])

    await phrases.test(graph.g, ['I', 'work', 'now'])

    assert.deepEqual(named(graph.calls, 'has')[0], ['has', ['word', 'name', 'I']])
    assert.deepEqual(named(graph.calls, 'V')[1][1], [start])
    assert.equal(named(graph.calls, 'repeat').length, 2)
    assert.deepEqual(steps(named(graph.calls, 'repeat')[0][1][0]), steps(__.out().simplePath()))
    assert.deepEqual(steps(named(graph.calls, 'until')[0][1][0]), steps(__.has('name', 'work')))
    assert.deepEqual(steps(named(graph.calls, 'until')[1][1][0]), steps(__.has('name', 'now')))
    assert.deepEqual(named(graph.calls, 'by'), [['by', ['name']]])
  })

  it('loads the sample phrase', async () => {
    const graph = fakeGraph()

    await phrases.run(graph.g)

    const words = named(graph.calls, 'property').map(([, args]) => args[1])
    assert.deepEqual(words, [
      'I', 'will', 'ride', 'my', 'bike', 'to', 'work', 'tomorrow',
      'go', 'home', 'now', 'at'
    ])
    assert.equal(named(graph.calls, 'addE').length, 16)
    assert.deepEqual(named(graph.calls, 'has').at(-1), ['has', ['word', 'name', 'I']])
  })
})
