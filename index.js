const gremlin = require('gremlin')
const __ = gremlin.process.statics

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection
const traversal = gremlin.process.AnonymousTraversalSource.traversal

const label = 'word'
const property = 'name'
const relationship = 'connnects'

function connect (url = 'ws://localhost:8182/gremlin') {
  return traversal().withRemote(new DriverRemoteConnection(url))
}

async function dropGraph (g) {
  await g.V().drop().iterate()
  console.log('Graph dropped.\n')
}

async function addVertex (g, word) {
  await g.addV(label).property(property, word).iterate()
  console.log('Vertex created.')
}

async function countVertices (g) {
  console.log('Counting vertices...')
  const result = await g.V().count().next()
  console.log('Result: %s', result.value)
}

async function listVertices (g) {
  console.log('Listing vertices...')
  const result = await g.V().values(property).toList()
  console.log('Result: %s\n', JSON.stringify(result))
}

async function addEdge (g, vertice1, vertice2) {
  const v1 = await g.V().has(property, vertice1).toList()
  const v2 = await g.V().has(property, vertice2).toList()
  await g.V(v1).addE(relationship).to(g.V(v2)).iterate()
  console.log('Edge created.')
}

async function connections (g, word) {
  console.log('Getting connections for %s...', word)
  const result = await g.V().has(property, word).out().values(property).toList()
  console.log('Result: %s\n', JSON.stringify(result))
}

async function test (g, words) {
  console.log('Testing...')

  const v1 = await g.V().has(label, property, words[0]).toList()
  console.log('first word:' + JSON.stringify(v1[0]))

  let path = g.V(v1)

  for (let i = 1; i < words.length; i++) {
    path = path.repeat(__.out().simplePath()).until(__.has(property, words[i]))
  }

  const result = await path.path().by(property).toList()
  console.log('Result:' + result)
}

async function run (g) {
  await dropGraph(g)

  await addVertex(g, 'I')
  await addVertex(g, 'will')
  await addVertex(g, 'ride')
  await addVertex(g, 'my')
  await addVertex(g, 'bike')
  await addVertex(g, 'to')
  await addVertex(g, 'work')
  await addVertex(g, 'tomorrow')

  await addVertex(g, 'go')
  await addVertex(g, 'home')
  await addVertex(g, 'now')

  await addVertex(g, 'at')

  await countVertices(g)
  await listVertices(g)

  await addEdge(g, 'I', 'will')
  await addEdge(g, 'will', 'ride')
  await addEdge(g, 'ride', 'my')
  await addEdge(g, 'my', 'bike')
  await addEdge(g, 'bike', 'to')
  await addEdge(g, 'to', 'work')
  await addEdge(g, 'work', 'tomorrow')

  await addEdge(g, 'will', 'go')
  await addEdge(g, 'go', 'home')
  await addEdge(g, 'home', 'now')
  await addEdge(g, 'go', 'to')
  await addEdge(g, 'work', 'now')

  await addEdge(g, 'I', 'work')
  await addEdge(g, 'work', 'at')
  await addEdge(g, 'at', 'home')
  await addEdge(g, 'home', 'now')

  await connections(g, 'work')

  await test(g, ['I', 'work', 'now'])
}

module.exports = {
  connect,
  dropGraph,
  addVertex,
  countVertices,
  listVertices,
  addEdge,
  connections,
  test,
  run
}

if (require.main === module) {
  run(connect()).catch(error => {
    console.error(error)
    process.exit(1)
  })
}
