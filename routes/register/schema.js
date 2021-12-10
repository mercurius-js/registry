const requestBody = {
  type: 'object',
  required: ['id', 'schema'],
  properties: {
    id: { type: 'string', minLength: 1 },
    schema: { type: 'string', minLength: 1 }
  }
}

const responseOptions = {
  200: {
    type: 'object',
    properties: {
      status: { type: 'string' }
    }
  }
}

module.exports = {
  body: requestBody,
  response: responseOptions
}
