const gremlin = require('gremlin')
const __ = gremlin.process.statics

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const traversal = gremlin.process.AnonymousTraversalSource.traversal
const g = traversal().withRemote(new DriverRemoteConnection('ws://localhost:8182/gremlin'))

const _label = 'word'
const property = 'name'

async function dropGraph () {
  await g.V().drop().iterate()
  console.log('Graph dropped.\n')
}

async function addVertex (word) {
  await g.addV(_label).property('name', word).iterate()
  console.log('Vertex created.')
}

async function countVertices () {
  console.log('Counting vertices...')
  let result = await g.V().count().next()
  console.log('Result: %s', result.value)
}

async function listVertices () {
  const val = 'name'
  console.log('Listing vertices...')
  let result =  await g.V().values(val).toList()
  console.log('Result: %s\n', JSON.stringify(result))
}

async function addEdge (vertice1, vertice2) {
  let relationship = 'connnects'
  const v1 = await g.V().has(property, vertice1).toList()
  const v2 = await g.V().has(property, vertice2).toList()
  await g.V(v1).addE(relationship).to(g.V(v2)).iterate()
  console.log('Edge created.')
}

async function connections (word) {
  console.log('Getting connections for %s...', word)
  const result = await g.V().has('name', word).out().values('name').toList()
  console.log('Result: %s\n', JSON.stringify(result))
}

async function test (words) {
  console.log('Testing...')

  let v1 = await g.V().has('word', 'name', words[0]).toList()
  console.log("first word:" +  JSON.stringify(v1[0]) )

  let path = g.V(v1)

  for (var i = 1; i < words.length; i++) {
    path = path.repeat(__.out().simplePath()).until(__.has('name', words[i]))
  }

  const result = await path.path().by('name').toList()
  console.log("Result:" +  result )

}

async function run () {
  await dropGraph()

  await addVertex('I')
  await addVertex('will')
  await addVertex('ride')
  await addVertex('my')
  await addVertex('bike')
  await addVertex('to')
  await addVertex('work')
  await addVertex('tomorrow')

  await addVertex('go')
  await addVertex('home')
  await addVertex('now')

  await addVertex('at')

  await countVertices()
  await listVertices()

  await addEdge('I', 'will')
  await addEdge('will', 'ride')
  await addEdge('ride', 'my')
  await addEdge('my', 'bike')
  await addEdge('bike', 'to')
  await addEdge('to', 'work')
  await addEdge('work', 'tomorrow')

  await addEdge('will', 'go')
  await addEdge('go', 'home')
  await addEdge('home', 'now')
  await addEdge('go', 'to')
  await addEdge('work', 'now')

  await addEdge('I', 'work')
  await addEdge('work', 'at')
  await addEdge('at', 'home')
  await addEdge('home', 'now')

  await connections('work')

  const words = ['I', 'work', 'now']
  await test(words)
}

run()
