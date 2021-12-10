'use strict'

const { test } = require('tap')
const { build } = require('../helper')

const schema = `
type Query {
  hero(episode: Episode): Character
}
type Character {
  name: String!
  appearsIn: [Episode!]!
}
type Episode {
  name: String!
  order: Integer!
}
`

const schema2 = `
type Query {
  hero(episode: Episode): Character
  droid(episode: Episode): Droid
}
type Character {
  name: String!
  appearsIn: [Episode!]!
}
type Droid {
  name: String!
  appearsIn: [Episode!]!
}
type Episode {
  name: String!
  order: Integer!
}
`

test('successfully registering a new service with schema', async (t) => {
  console.log('testing new service')
  const app = build(t)

  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: 'test/test',
      schema,
    }
  })
  t.same(res.statusCode, 200)
  t.same(JSON.parse(res.payload), { status: 'ok' })

  // check values set
  const serviceSchemas = await app.redis.lrange('test/test', 0, -1)
  const gqlUuid = await app.redis.get(`test/test:${serviceSchemas[0]}`)
  const hmVersion = await app.redis.hget(gqlUuid, 'version')
  const hmSchema = await app.redis.hget(gqlUuid, 'schema')
  t.equal(serviceSchemas.length, 1)
  t.equal(serviceSchemas[0], "0")
  t.equal(hmVersion, serviceSchemas[0])
  t.same(hmSchema, schema)

  // clean up
  await app.redis.del('test/test')
})

test('successfully registering a new schema with existing service', async (t) => {
  const app = build(t)

  // new service register
  await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: 'test/test',
      schema,
    }
  })

  // adding new schema to register
  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: 'test/test',
      schema: schema2,
    }
  })
  t.same(res.statusCode, 200)
  t.same(JSON.parse(res.payload), { status: 'ok' })

  // check values set
  const serviceSchemas = await app.redis.lrange('test/test', 0, -1)
  console.log('serviceSchemas', serviceSchemas)
  const gqlUuid = await app.redis.get(`test/test:${serviceSchemas[1]}`)
  const hmVersion = await app.redis.hget(gqlUuid, 'version')
  const hmSchema = await app.redis.hget(gqlUuid, 'schema')
  t.equal(serviceSchemas.length, 2)
  t.equal(serviceSchemas[1], "1")
  t.equal(hmVersion, serviceSchemas[1])
  t.same(hmSchema, schema2)

  // clean up
  await app.redis.del('test/test')
})

test('fail if id not sent', async (t) => {
  const app = build(t)
  const error = new Error("body should have required property 'id'")

  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      schema
    }
  })
  t.same(res.statusCode, 400)
  t.same(JSON.parse(res.payload).message, error.message)
})

test('fail if id is empty', async (t) => {
  const app = build(t)
  const error = new Error('body.id should NOT be shorter than 1 characters')

  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: '',
      schema
    }
  })
  t.same(res.statusCode, 400)
  t.same(JSON.parse(res.payload).message, error.message)
})

test('fail if schema is missing', async (t) => {
  const app = build(t)
  const error = new Error("body should have required property 'schema'")

  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: 'test/test',
    }
  })
  t.same(res.statusCode, 400)
  t.same(JSON.parse(res.payload).message, error.message)
})

test('fail if schema is empty', async (t) => {
  const app = build(t)
  const error = new Error('body.schema should NOT be shorter than 1 characters')

  const res = await app.inject({
    url: '/register',
    method: 'POST',
    payload: {
      id: 'test/test',
      schema: ''
    }
  })
  t.same(res.statusCode, 400)
  t.same(JSON.parse(res.payload).message, error.message)
})
