'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _errorHandler = require('./error-handler');

var _errorHandler2 = _interopRequireDefault(_errorHandler);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Service {
  constructor(options) {
    if (!options) {
      throw new Error('CouchDB options have to be provided');
    }

    if (!('connection' in options)) {
      throw new Error('You must provide CouchDB connection');
    }

    if (!('database' in options)) {
      throw new Error('You must provide a database name');
    }

    this.connection = options.connection;
    this.database = options.database;
    this.paginate = options.paginate || {};

    const create = _bluebird2.default.promisify(this.connection.db.create);
    const get = _bluebird2.default.promisify(this.connection.db.get);

    this.db = get(options.database).catch(() => create(options.database)).catch(() => true) // always invoke next then
    .then(() => _bluebird2.default.promisifyAll(this.connection.use(options.database)));
  }

  extend(obj) {
    return _uberproto2.default.extend(obj, this);
  }

  _safeAttributes(obj) {
    delete obj._id;
    delete obj._rev;
    return obj;
  }

  _return(data) {
    const isArray = !data._id;

    const parse = obj => {
      if (!obj) {
        throw new _feathersErrors2.default.BadRequest('Document contains an invalid ID.');
      }
      Object.assign(obj, { id: obj._id });
      return this._safeAttributes(obj);
    };

    const parseArray = arr => {
      if (arr.rows) {
        arr.rows.forEach(obj => parse(obj.doc || obj.value));
      } else {
        arr.forEach(parse);
      }
      return arr;
    };

    return isArray ? parseArray(data) : parse(data);
  }

  _list(params) {
    return this.db.then(db => db.listAsync(params));
  }
  _view(name, params) {
    return this.db.then(db => db.viewAsync(name[0], name[1], params));
  }
  _selector(query) {
    return _bluebird2.default.promisify(this.connection.request)({ method: 'POST', doc: '_find', db: this.database, body: query }).then(res => res.docs);
  }
  _get(id, params) {
    return this.db.then(db => db.getAsync(id, params));
  }
  _insert(doc, params) {
    return this.db.then(db => db.insertAsync(doc, params));
  }
  _bulk(docs, params) {
    return this.db.then(db => db.bulkAsync(docs, params));
  }
  _destroy(id, rev) {
    return this.db.then(db => db.destroyAsync(id, rev));
  }

  find(params = {}) {
    let result = null;

    if (params.view) {
      result = this._view(params.view.split('/'), params.params);
    } else if (params.query) {
      result = this._selector(params.query);
    } else {
      result = this._list(Object.assign({ include_docs: true }, params));
    }

    return result.then(obj => this._return(obj)).catch(_errorHandler2.default);
  }

  get(id, params = {}) {
    return this._get(id, params).then(obj => this._return(obj)).catch(_errorHandler2.default);
  }

  create(data, params = {}) {
    return (Array.isArray(data) ? this._bulk({ docs: data }, params) : this._insert(data, params)).then(res => {
      const assign = (data, res) => {
        return Object.assign(data, { id: res.id });
      };
      const bulkAssign = (data, res) => {
        data.forEach((element, index) => {
          element = assign(element, { id: res[index].id });
        });
        return data;
      };

      return Array.isArray(data) ? bulkAssign(data, res) : assign(data, res);
    }).then(res => this._return(res)).catch(_errorHandler2.default);
  }

  update(id, data, params = { include_docs: false }) {
    if (Array.isArray(data) || id === null) {
      return _bluebird2.default.reject(new _feathersErrors2.default.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
    }

    return this._get(id, params).then(doc => {
      Object.assign(data, { _rev: doc._rev });
      return this._insert(data, id).then(() => data);
    }).catch(_errorHandler2.default);
  }

  patch(id, data, params = {}) {
    return this._get(id, params).then(doc => {
      const rev = doc._rev;
      doc = this._safeAttributes(doc);
      (0, _util.mergeDeep)(doc, { _rev: rev }, data);
      return this._insert(doc, id).then(() => Object.assign(doc, { id }));
    }).catch(_errorHandler2.default);
  }

  remove(id, params = {}) {
    return this._get(id, params).then(doc => this._destroy(doc._id, doc._rev)).catch(_errorHandler2.default);
  }
}

function init(options) {
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];