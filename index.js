const gremlin = require('gremlin')

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

const traversal = gremlin.process.AnonymousTraversalSource.traversal;

const g = traversal().withRemote(
                new DriverRemoteConnection('ws://localhost:8182/gremlin'))

const __ = gremlin.process.statics;

const _label = 'word';
const property = 'name';


async function dropGraph () {
  console.log('Dropping graph...')
  let result = await g.V().drop().iterate();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function addVertex (word) {
  console.log('Adding vertex...')
  let result = await g.addV(_label).property('name', word).iterate();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function listVertices () {
  const val = 'name';
  console.log('Listing vertices...')
  let result =  await g.V().values(val).toList();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function addEdge (vertice1, vertice2) {
  console.log('Adding edge...')
  let relationship = 'connnects';

  const v1 = await g.V().has(property, vertice1).toList();
  console.log(JSON.stringify(v1));
  const v2 = await g.V().has(property, vertice2).toList();
  console.log(JSON.stringify(v2));

  let result = await g.V(v1).addE(relationship).to(g.V(v2)).iterate();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function countVertices () {
  console.log('Counting vertices...')
  let result = await g.V().count().next();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function connections (word) {

  console.log(word)
  console.log('Getting connections...');
  const relationship = 'connects';

  const result = await g.V().has('name', word).out().values('name').toList();

  console.log('Result: %s\n', JSON.stringify(result));
}

async function func1 (word) {
  console.log('Func1...')

  const v1 = await g.V().hasLabel(_label).has(property, word).next();
  let result = g.V(v1).bothE().toList();
  console.log('Result: %s\n', JSON.stringify(result));
}

async function test (words) {
  console.log('Testing...');
  console.log(words[0]);
  console.log(words[1]);
  console.log(words[2]);


  let v1 = await g.V().has('word', 'name', words[0]).toList();
  console.log("first word:" +  JSON.stringify(v1[0]) );

  let pathThirdWord = await g.V(v1)
                    .repeat(__.out().simplePath()).until(__.has('name', words[1]))
                    .repeat(__.out().simplePath()).until(__.has('name', words[2]))
                    .path().by('name').toList();

  console.log("Result:" +  JSON.stringify(pathThirdWord) );

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

  //const testArray = ['I', 'work', 'now'];
  const words = ['I', 'work', 'now'];
  await test(words);
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

}

run()
