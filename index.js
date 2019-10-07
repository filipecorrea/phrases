const gremlin = require('gremlin')

const client = new gremlin.driver.Client(
  'ws://localhost:8182/gremlin',
  {
    traversalsource: 'g',
    mimeType: 'application/vnd.gremlin-v2.0+json'
  }
)

async function dropGraph () {
  console.log('Dropping graph...')
  return client
    .submit('g.V().drop()')
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function addVertex (word) {
  console.log('Adding vertex...')
  return client
    .submit("g.addV(_label).property('name', name)", {
      _label: 'word',
      name: word
    })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function listVertices () {
  console.log('Listing vertices...')
  return client
    .submit('g.V().values(val)', {
      val: 'name'
    })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function addEdge (vertice1, vertice2) {
  console.log('Adding edge...')
  const v1 = await client.submit('g.V().hasLabel(_label).has(xyz, abc)', {
    _label: 'word',
    xyz: 'name',
    abc: vertice1
  })
  const v2 = await client.submit('g.V().hasLabel(_label).has(xyz, abc)', {
    _label: 'word',
    xyz: 'name',
    abc: vertice2
  })

  return client
    .submit('g.V(source).addE(relationship).to(g.V(target))', {
      source: v1._items[0].id,
      relationship: 'connects',
      target: v2._items[0].id
    })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function countVertices () {
  console.log('Counting vertices...')
  return client
    .submit('g.V().count()', { })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function connections (word) {
  console.log('Getting connections...')
  const v1 = await client.submit('g.V().hasLabel(_label).has(xyz, abc)', {
    _label: 'word',
    xyz: 'name',
    abc: word
  })

  return client
    .submit('g.V(source).out(relationship)', {
      source: v1._items[0].id,
      relationship: 'connects'
    })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function func1 (word) {
  console.log('Func1...')
  const v1 = await client.submit('g.V().hasLabel(_label).has(xyz, abc)', {
    _label: 'word',
    xyz: 'name',
    abc: word
  })

  return client
    .submit('g.V(source).bothE()', {
      source: v1._items[0].id
    })
    .then(result => console.log('Result: %s\n', JSON.stringify(result)))
}

async function test (word1, word2, word3) {
  console.log('Testing...')

  return client
    .submit('g.V().has(\'word\', \'name\', word1).repeat(out().simplePath()).until(has(\'name\', word3)).path().by(\'name\')', {
      word1,
      word2,
      word3
    })
    .then(result => {
      console.log('Result: %s\n', JSON.stringify(result))
      console.log(result._items)
    })
}

async function run () {
  await client.open()

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

  await connections('work')

  await func1('work')

  await test('I', 'work', 'now')
  /*
  Path {
    labels: [ [], [], [], [], [] ],
    objects: [ 'I', 'will', 'go', 'home', 'now' ] }, -> This phase doesn't contain the word 'work'
  Path {
    labels: [ [], [], [], [], [], [] ],
    objects: [ 'I', 'will', 'go', 'to', 'work', 'now' ] },
  Path {
    labels: [ [], [], [], [], [], [], [], [] ],
    objects: [ 'I', 'will', 'ride', 'my', 'bike', 'to', 'work', 'now' ] }
  */

  await client.close()
}

run()
