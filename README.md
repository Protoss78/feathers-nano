## Synopsis

A CouchDB CRUD service for [FeathersJS](https://github.com/feathersjs/feathers).

## Code Example

```
import feathers from 'feathers'
import rest from 'feathers-rest'
import service from '../lib'
import nano from 'nano'

const app = feathers().configure(rest())

const options = {
  name: 'tests',
  connection: nano({
    url: `http://localhost:5984`,
  }),
  database: 'test',
  paginate: false,
}

app.service('tests', service(options))
app.service('tests').get('18423385ef707d5fb46c61e7d70148a4').then(res => console.log(res)).catch(console.log)
```

## Motivation

Although FeathersJS provides many official database adapters, currently there is no adapter for CouchDB. This package is a preliminary implementation of a non-official CouchDB adapter.