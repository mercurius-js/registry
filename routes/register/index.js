'use strict'
const { v4: uuidv4 } = require('uuid')
const schema = require('./schema')

// Register a service "id" with a graphql schema.
module.exports = async function (fastify, opts) {
  fastify.post('/', { schema }, async function (req, reply) {
    const { redis } = fastify
    const { body: { id, schema } } = req
    const gqlUuid = uuidv4()
    const serviceSchemas = await redis.lrange(id, 0, -1)
    const gqlVersion = serviceSchemas != null && serviceSchemas.length
      ? parseInt(serviceSchemas[serviceSchemas.length - 1], 10) + 1
      : 0

    // publish rows to redis
    await redis.rpush(id, gqlVersion)
    await redis.set(`${id}:${gqlVersion}`, gqlUuid)
    await redis.hset(gqlUuid, 'version', gqlVersion, 'schema', schema)
    return { status: 'ok' }
  })
}

