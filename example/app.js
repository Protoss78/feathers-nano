import feathers from 'feathers'
import rest from 'feathers-rest'
const bodyParser = require('body-parser');
import nano from 'nano'
import service from '../lib'

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
  database: 'test',
  paginate: false,
}

app.service('tests', service(options))
//app.service('tests').get('18423385ef707d5fb46c61e7d70148a4').then(res => console.log(res)).catch(console.log)
//app.service('tests').find({ include_docs: true }).then(res => console.log(res.rows[1].doc))
//app.service('tests').patch('18423385ef707d5fb46c61e7d70052a3', { updated: true, newName: 'Jeremy' }).then(console.log)
//app.service('tests').remove('18423385ef707d5fb46c61e7d70052a3').then(console.log)
//app.service('tests').create({message:'test messages'}).then(console.log)
//app.service('tests').create([{message:'test one'}, {message:'test two'}, {message:'test three', something: 'else'}]).then(console.log)
//app.service('tests').update('18423385ef707d5fb46c61e7d70185e8', {message:'JUST UPDATED AGAIN!!!!'}).then(console.log)

/*
const view = {
  query: {
    designname: 'mydoc',
    viewname: 'listById',
  },
  params: {
    keys: ['bank:default:na:na:na:000', 'productType:default:na:na:na:PK4DCWBFZ'],
  }
}

app.service('tests').find(view).then(console.log)

 */

app
  .use('/tests', service(options))
  .listen(3030).on('listening', () => console.log('Feathers Message MongoDB service running on 127.0.0.1:3030'))