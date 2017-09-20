const feathers = require('feathers')
const rest = require('feathers-rest')
const bodyParser = require('body-parser')
const nano = require('nano')
const service = require('../lib')

const app = feathers()
  .configure(rest())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))

const host = process.env.DB_HOST || '127.0.0.1'
const auth = `${process.env.DB_USERNAME || 'admin'}:${process.env.DB_PASSWORD || 'admin'}`
const opts = {
  url: `http://${auth}@${host}:5984`,
}

const options = {
  name: 'tests',
  connection: nano(opts),
  database: 'tests',
  paginate: false,
}

const params = { include_docs: true }

app.service('tests', service(options))
//app.service('tests').get('app:person:04080670044:v1').then(res => console.log(res)).catch(console.log)
//app.service('tests').find(params).then(res => console.log(res))
//app.service('tests').find(params).then(res => console.log(res.rows[1].doc))
//app.service('tests').patch('18423385ef707d5fb46c61e7d70052a3', { updated: true, newName: 'Jeremy' }).then(console.log)
//app.service('tests').remove('18423385ef707d5fb46c61e7d70052a3').then(console.log)
//app.service('tests').create({message:'test messages'}).then(console.log)
//app.service('tests').create([{message:'test one'}, {message:'test two'}, {message:'test three', something: 'else'}]).then(console.log)
//app.service('tests').update('18423385ef707d5fb46c61e7d70185e8', {message:'JUST UPDATED AGAIN!!!!'}).then(console.log)

/*
const view = {
  view: 'mydoc/listById',
  params: {
    keys: ['bank:default:na:na:na:000', 'productType:default:na:na:na:PK4DCWBFZ'],
  }
}

app.service('tests').find(view).then(console.log)
*/

const selector = {
  query: {
    "selector": {
      "name" : "Adriana Goveia",
      "rgState" : "SSP"
    }
  }
}

app.service('tests').find(selector).then(res => console.log(res))
