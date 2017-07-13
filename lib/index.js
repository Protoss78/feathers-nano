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
    this.paginate = options.paginate || {};

    const create = _bluebird2.default.promisify(this.connection.db.create);
    const get = _bluebird2.default.promisify(this.connection.db.get);

    this.db = get(options.database).catch(() => create(options.database)).then(() => _bluebird2.default.promisifyAll(this.connection.use(options.database)));
  }

  extend(obj) {
    return _uberproto2.default.extend(obj, this);
  }

  _return(data) {
    const isArray = !data._id;

    const parse = obj => {
      Object.assign(obj, { id: obj._id });
      delete obj._id;
      delete obj._rev;
      return obj;
    };

    const parseArray = arr => {
      if (arr.rows) {
        arr.rows.forEach(obj => parse(obj.doc));
      }
      return arr;
    };

    return isArray ? parseArray(data) : parse(data);
  }

  _get(id, params) {
    return this.db.then(db => db.getAsync(id, params));
  }
  _list(params) {
    return this.db.then(db => db.listAsync(params));
  }
  _bulk(docs, params) {
    return this.db.then(db => db.bulkAsync(docs, params));
  }
  _insert(doc, params) {
    return this.db.then(db => db.insertAsync(doc, params));
  }
  _destroy(id, rev) {
    return this.db.then(db => db.destroyAsync(id, rev));
  }

  _view(params) {
    const designname = params.view.designname;
    const viewname = params.view.viewname;

    return this.db.then(db => db.viewAsync(designname, viewname, params));
  }

  find(params = {}) {
    return (params.view ? this._view(params) : this._list(Object.assign({ include_docs: true }, params))).then(obj => this._return(obj)).catch(_errorHandler2.default);
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
    }).catch(_errorHandler2.default);
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
      doc = this._return(doc);
      Object.assign(doc, { _rev: rev }, data);
      return this._insert(doc, id).then(() => doc);
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