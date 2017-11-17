import Promise from 'bluebird'
import Proto from 'uberproto'
import errors from 'feathers-errors'
import errorHandler from './error-handler'
import { mergeDeep } from './util'

class Service {
  constructor(options) {
    if (!options) {
      throw new Error('CouchDB options have to be provided')
    }

    if (!('connection' in options)) {
      throw new Error('You must provide CouchDB connection')
    }

    if (!('database' in options)) {
      throw new Error('You must provide a database name')
    }

    this.connection = options.connection
    this.database = options.database
    this.paginate = options.paginate || {}

    const create = Promise.promisify(this.connection.db.create)
    const get = Promise.promisify(this.connection.db.get)

    this.db = get(options.database)
      .catch(() => create(options.database))
      .catch(() => true) // always invoke next then
      .then(() => Promise.promisifyAll(this.connection.use(options.database)))
  }

  extend(obj) {
    return Proto.extend(obj, this)
  }

  _list(params) {
    return this.db.then(db => db.listAsync(params))
  }

  _view(designname, viewname, params) {
    return this.db.then(db => db.viewAsync(designname, viewname, params))
  }

  _selector(params) {
    return Promise.promisify(this.connection.request)({
      method: 'POST',
      doc: '_find',
      db: this.database,
      body: params,
    })
  }

  _get(id, params) {
    return this.db.then(db => db.getAsync(id, params))
  }

  _insert(doc, params) {
    return this.db
      .then(db => db.insertAsync(doc, params))
      .then(res => Object.assign(doc, { _id: res.id, _rev: res.rev }))
  }

  _bulk(docs, params) {
    const assign = (data, res) => Object.assign(data, { _id: res.id, _rev: res.rev })
    const bulkAssign = (arr, res) => arr.map((data, index) => assign(data, res[index]))
    return this.db
      .then(db => db.bulkAsync({ docs }, params))
      .then(res => bulkAssign(docs, res))
  }

  _destroy(id, rev) { return this.db.then(db => db.destroyAsync(id, rev)) }

/**
 * @param params
 * @returns {object} {
    "data": "<Array>"
    "total": "<total number of records>",
    "limit": "<max number of items per page>",
    "skip": "<number of skipped items (offset)>",
    "bookmark": "<alternative to skip>"
    }
*/
  find(params = {}) {
    params = Object.assign({include_docs: true}, params)
    params.limit = params.limit || this.paginate.default
    let result = null

    if (params.selector) {
      result = this._selector(params).then(res => {
        return {
          limit: params.limit,
          bookmark: res.bookmark,
          data: res.docs,
        }
      })
    }
    else {
      const run = params.view
        ? this._view(params.view.split('/')[0], params.view.split('/')[1], params)
        : this._list(params)

      result = run.then(res => {
        return {
          total: res.total_rows,
          limit: params.limit,
          skip: res.offset,
          data: params.include_docs ? res.rows.map(row => row.doc) : res.rows
        }
      })
    }

    return result.catch(errorHandler)
  }

  get(id, params = {}) {
    return this._get(id, params).catch(errorHandler)
  }

  create(data, params = {}) {
    return (
      Array.isArray(data)
      ? this._bulk(data, params)
      : this._insert(data, params)
    )
    .catch(errorHandler)
  }

  update(id, data, params = { include_docs: false }) {
    if (Array.isArray(data) || id === null) {
      return Promise.reject(new errors.BadRequest('Not replacing multiple records. Did you mean `patch`?'))
    }

    return this._get(id, params)
      .then(doc => (
        Object.assign(data, { _rev: doc._rev }),
        this._insert(data, id).then(() => data)
      ))
      .catch(errorHandler)
  }

  patch(id, data, params = {}) {
    return this._get(id, params)
      .then(doc => (
        mergeDeep(doc, data),
        this._insert(doc, id)
      ))
      .catch(errorHandler)
  }

  remove(id, params = {}) {
    return this._get(id, params)
      .then(doc => this._destroy(doc._id, doc._rev))
      .catch(errorHandler)
  }
}

export default function init(options) {
  return new Service(options)
}

init.Service = Service
