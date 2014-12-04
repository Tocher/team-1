var _ = require('lodash-node')
  , Duplex = require('stream').Duplex
  , livedb = require('livedb')
  , sharejs = require('share')
  , backend = livedb.client(livedb.memory())
  , share = sharejs.server.createClient({ backend: backend })

  , getUID = function () { return _.uniqueId('user-') }

  , Documents = require('../documents')
  , User = function (options) {
      var self = this

      // используется один раз, можно сделать bind там
      _.bindAll(this, 'onMessage')

      this._connection = options.connection // стоит сложить в переменную
      this._stream = new Duplex({ objectMode: true }) // тоже в переменную

      this.id = getUID()
      this.document = null
      this.props = { title: 'Anonymous' }

      this._stream._write = function (chunk, encoding, callback) {
        self._connection.send(JSON.stringify(chunk))

        return callback()
      }

      this._stream._read = function () {}

      this._stream.headers = this._connection.upgradeReq.headers
      this._stream.remoteAddress =
        this._connection.upgradeReq.connection.remoteAddress

      this._connection.on('message', this.onMessage)

      this._stream.on('error', function (msg) {
        console.log('error', msg)
        return self._connection.close(msg)
      })

      this._connection.on('close', function (reason) {
        self._stream.push(null)
        self._stream.emit('close')
        self.destroy();
        return self._connection.close( reason )
      })

      this._stream.on('end', function () { // можно делать чейнинг в вызовах on
        return self._connection.close()
      })

      share.listen(this._stream)
    }
  , proto = User.prototype // переменная не нужна, если использовать _.extend

// по аналогии с document.js можно делать прямо при объявлении переменной
module.exports = User

proto.onMessage = function (data) {
  data = JSON.parse(data)

  if (data.a === 'open')
  { this.onOpenEvent(data)
    return;
  }
  if (data.a === 'meta')
  { this.onMetaEvent(data)
    return;
  }

  return this._stream.push(data)
}

proto.getColor = function () {
  return this.color
}

proto.setColor = function (color) {
  this.color = color
}

proto.emit = function (data) {
  this._connection.send(JSON.stringify(data))
  return this
}

proto.exportOnlyId = function () {
  return { id: this.id }
}

proto.exportPublicData = function () {
  return _.extend(this.exportOnlyId(),
    { title: this.props.title
    , color: this.color
    }
  )
}

proto.exportPrivateData = function () {
  return _.extend(this.exportPublicData(), {})
}

proto.openDocument = function (document) {
  this.document = Documents.factory(document).addCollaborator(this)
  this.emit({ a: 'open'
            , user: this.exportPrivateData()
            , document: this.document.exportPublicData()
            })
  return this // предыдущий вызов возвращает this
}

proto.closeDocument = function () {
  if (this.document !== null) this.document.removeCollaborator(this)
  return this
}

proto.updateData = function (data) {
  delete data.id

  _.extend( this.props
          , data
          , function (a, b) { return b ? b : a }
          )

  return this
}

proto.onOpenEvent = function (data) {
  if (data.user) this.updateData(data.user)
  this.openDocument(data.document)
  return this // предыдущий вызов возвращает this
}

proto.onMetaEvent = function (data) {
  this.document.metaCollaborators(this, data)
  return this
}

proto.destroy = function () {
  this.closeDocument()
  return this
}
