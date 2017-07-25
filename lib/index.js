'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Service = function () {
  function Service(options) {
    var _this = this;

    _classCallCheck(this, Service);

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

    var create = _bluebird2.default.promisify(this.connection.db.create);
    var get = _bluebird2.default.promisify(this.connection.db.get);

    this.db = get(options.database).catch(function () {
      return create(options.database);
    }).catch(function () {
      return true;
    }) // always invoke next then
    .then(function () {
      return _bluebird2.default.promisifyAll(_this.connection.use(options.database));
    });
  }

  _createClass(Service, [{
    key: 'extend',
    value: function extend(obj) {
      return _uberproto2.default.extend(obj, this);
    }
  }, {
    key: '_return',
    value: function _return(data) {
      var isArray = !data._id;

      var parse = function parse(obj) {
        if (!obj) {
          throw new _feathersErrors2.default.BadRequest('Document contains an invalid ID.');
        }
        Object.assign(obj, { id: obj._id });
        delete obj._id;
        delete obj._rev;
        return obj;
      };

      var parseArray = function parseArray(arr) {
        if (arr.rows && arr.rows.length) {
          var type = arr.rows[0].doc ? 'doc' : 'value';
          arr.rows.forEach(function (obj) {
            return parse(obj[type]);
          });
        }
        return arr;
      };

      return isArray ? parseArray(data) : parse(data);
    }
  }, {
    key: '_get',
    value: function _get(id, params) {
      return this.db.then(function (db) {
        return db.getAsync(id, params);
      });
    }
  }, {
    key: '_list',
    value: function _list(params) {
      return this.db.then(function (db) {
        return db.listAsync(params);
      });
    }
  }, {
    key: '_bulk',
    value: function _bulk(docs, params) {
      return this.db.then(function (db) {
        return db.bulkAsync(docs, params);
      });
    }
  }, {
    key: '_insert',
    value: function _insert(doc, params) {
      return this.db.then(function (db) {
        return db.insertAsync(doc, params);
      });
    }
  }, {
    key: '_destroy',
    value: function _destroy(id, rev) {
      return this.db.then(function (db) {
        return db.destroyAsync(id, rev);
      });
    }
  }, {
    key: '_view',
    value: function _view(name, params) {
      return this.db.then(function (db) {
        return db.viewAsync(name[0], name[1], params);
      });
    }
  }, {
    key: 'find',
    value: function find() {
      var _this2 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return (params.view ? this._view(params.view.split('/'), params.params) : this._list(Object.assign({ include_docs: true }, params))).then(function (obj) {
        return _this2._return(obj);
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'get',
    value: function get(id) {
      var _this3 = this;

      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this._get(id, params).then(function (obj) {
        return _this3._return(obj);
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'create',
    value: function create(data) {
      var _this4 = this;

      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return (Array.isArray(data) ? this._bulk({ docs: data }, params) : this._insert(data, params)).then(function (res) {
        var assign = function assign(data, res) {
          return Object.assign(data, { id: res.id });
        };
        var bulkAssign = function bulkAssign(data, res) {
          data.forEach(function (element, index) {
            element = assign(element, { id: res[index].id });
          });
          return data;
        };

        return Array.isArray(data) ? bulkAssign(data, res) : assign(data, res);
      }).then(function (res) {
        return _this4._return(res);
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'update',
    value: function update(id, data) {
      var _this5 = this;

      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : { include_docs: false };

      if (Array.isArray(data) || id === null) {
        return _bluebird2.default.reject(new _feathersErrors2.default.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
      }

      return this._get(id, params).then(function (doc) {
        Object.assign(data, { _rev: doc._rev });
        return _this5._insert(data, id).then(function () {
          return data;
        });
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'patch',
    value: function patch(id, data) {
      var _this6 = this;

      var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      return this._get(id, params).then(function (doc) {
        var rev = doc._rev;
        doc = _this6._return(doc);
        Object.assign(doc, { _rev: rev }, data);
        return _this6._insert(doc, id).then(function () {
          return doc;
        });
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var _this7 = this;

      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this._get(id, params).then(function (doc) {
        return _this7._destroy(doc._id, doc._rev);
      }).catch(_errorHandler2.default);
    }
  }]);

  return Service;
}();

function init(options) {
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];