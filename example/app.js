const feathers = require('feathers')
const rest = require('feathers-rest')
const bodyParser = require('body-parser')
const nano = require('cloudant-nano')
const service = require('../lib')
const inspect = data => console.log(require('util').inspect(data, { depth: null }))

const app = feathers()
  .configure(rest())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))

const host = process.env.DB_HOST || 'cloudant.local' || '127.0.0.1:5984'
const auth = `${process.env.DB_USERNAME || 'admin'}:${process.env.DB_PASSWORD || 'pass'}`
const opts = {
  url: `http://${auth}@${host}`,
}

const options = {
  name: 'tests',
  connection: nano(opts),
  database: 'tests',
  paginate: {
    default: 2,
    max: 200,
  },
}

var params = {
  limit: 5,
  skip: 0,
}

app.service('tests', service(options))
//app.service('tests').create({message:'test messages'}).then(console.log)
//app.service('tests').create([{message:'test one'}, {message:'test two'}, {message:'test three', something: 'else'}]).then(console.log)
//app.service('tests').get('24d2483356611299c92338c1eb0179f2').then(res => console.log(res)).catch(console.log)
// app.service('tests').find(params).then(res => inspect(res))
//app.service('tests').find(params).then(res => console.log(res.rows[1].doc))
//app.service('tests').patch('24d2483356611299c92338c1eb0179f2', { updated: true, newName: 'Andre Bazaglia' }).then(console.log)
//app.service('tests').remove('24d2483356611299c92338c1eb0179f2').then(console.log)
//app.service('tests').update('24d2483356611299c92338c1eb0179f2', {message:'JUST UPDATED AGAIN!!!!'}).then(console.log)


var params = {
  keys: ['bank:default:na:na:na:000', 'productType:default:na:na:na:PK4DCWBFZ'],
}

app.service('tests').view('mydoc', 'listById', params).then(console.log)


var params = {
  "selector": {
    "name" : "Andre Bazaglia",
    "age" : 22
  },
  //bookmark: "g1AAAABweJzLYWBgYMpgSmHgKy5JLCrJTq2MT8lPzkzJBYorGJmkGJlYGBubmpkZGhpZWiZbGhkbWyQbpiYZGFlaJBmC9HHA9BGlIwsAPCMcOQ",
  //limit: 2,
  //skip: 2,
}

// app.service('tests').find(params).then(res => inspect(res))
