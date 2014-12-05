var Host = window.location.hostname + ':7900'

var Team1 = {
  start: function (options) {
    _.bindAll(this)

    this.documentId = this.getDocId()
    this.isReconnect = false

    this.socket = this.getSocket(options.socketUrl)
    this.sjs = new window.sharejs.Connection(this.socket)
    this.doc = this.sjs.get('users-' + this.documentId, 'seph')

    this.bindSocketHandlers()

    //this.auth().done(this.openDocument)
  }
  , reconnect: function (options) {
    this.socket = this.getSocket(options.socketUrl)
    this.sjs = new window.sharejs.Connection(this.socket)
    this.doc = this.sjs.get('users-' + this.documentId, 'seph')

    this.isReconnect = true
    this.openDocument()
  }
  , getDocId: function () {
    return this.getDocIdFromHash() || _.random(10000000000)
  }
  , getDocIdFromHash: function () {
    return window.location.hash.replace('#', '')
  }
  /**
   * Simple auth.
   * @returns {jQuery.Deferred}
   */
  , auth: function () {
    var user = {
      title: window.prompt('Your name:')
    }

    this.__user = user

    return $.Deferred().resolve(user).promise()
  }

  /**
   * Create interface for document
   */
  , buildDocumentInterface: function (document) {
    var doc = this.doc

    if(!this.isReconnect) {
      this.Roster = new Team1.Roster()
      this.Editor = new Team1.Editor(this)
      this.Header = new Team1.Header(this)
    }

    var Editor = this.Editor

    doc.subscribe()

    doc.whenReady(function () {
      if (!doc.type) doc.create('text')

      if (doc.type && doc.type.name === 'text')
        doc.attachCodeMirror(Editor.codeEditor)
    })

    if (document.users) {
      this.Roster.clearList()
      this.Roster.fillList(document.users)
    }

    if (document.id) {
      window.location.hash = '#' + document.id
      if (Team1.Roster.getUsersCount() == 1) {
        this.loadDocument(document.id)
      }
    }
  }

  , openDocument: function () {
    this.send(JSON.stringify(
      { a: 'open'
      , user: this.__user
      , document:
        { id: this.documentId
        }
      }
    ) )

    return this
  }

  , bindSocketHandlers: function () {
    this.doc.setOnOpenMessageFn(this.onSocketOpen)
    this.doc.setOnJoinMessageFn(this.onSocketJoin)
    this.doc.setOnCloseMessageFn(this.onSocketLeave)
    this.doc.setOnMetaMessageFn(this.onSocketMeta)
  }

  , send: function (message, callback) {
    var self = this

    this.waitForConnection(function () {
      self.socket.send(message)

      if (typeof callback !== 'undefined') {
        callback()
      }
    }, 1000)
  }

  , sendMeta: function (cursor, selection) {
    var meta = {
      a: "meta"
      , document: {
        id: this.documentId
      }
      , id: this.__user.id
      , color: this.__user.color
      , meta: { cursor: cursor
              , selection: selection
      }
    }
    if(this.socket.readyState == this.socket.OPEN)
      this.send(JSON.stringify(meta))
  }

  , waitForConnection: function (callback, interval) {
    var that = this

    if (this.socket.readyState === 1)
    { callback()
    } else {
      setTimeout(function ()
        { that.waitForConnection(callback)
        }
        , interval)
    }
  }

  , onSocketJoin: function (data) {
    this.Roster.add(data.user)
  }

  , onSocketLeave: function (data) {
    this.Roster.remove(data.user.id)
    this.Editor.removeCursor(data.user.id)
  }

  , onSocketOpen: function (data) {
    if (data.user)
      _.extend(this.__user, data.user)

    this.buildDocumentInterface(data.document || {})
  }

  , onSocketMeta : function (data) {
    this.Editor.updateCursor(
      { id: data.id
      , position : data.meta.cursor
      , color : data.color
      }
    )

    if (data.meta.selection) {
      this.Editor.updateSelection(
        { id: data.id
        , position : data.meta.selection[0]
        , color : data.color
        }
      )
    }
    else
      this.Editor.removeSelection(data.id)
  }

  , saveDocument: function () {
    var docContentObj = {
      operation: 'save'
      , docName: this.documentId
      , docContent: this.Editor.codeEditor.getValue()
    }

    $.ajax({ type: 'POST'
            , url: window.location.pathname
            , data: JSON.stringify(docContentObj)
            , success: function() {

            }
            , fail: function() {

            }
        })
  }

  , loadDocument: function () {
    var docContentObj = {
      operation: 'get'
      , docName: this.documentId
    }

    $.ajax({ type: 'POST'
            , url: window.location.pathname
            , dataType: 'json'
            , data: JSON.stringify(docContentObj)
            , success: function(doc) {
                if (doc.value != null) {
                  Team1.Editor.codeEditor.getDoc().setValue(doc.value)
                }
            }
            , fail: function() {
                console.log('error')
            }
        })
  }

  , getSocket : function () {
    return new WebSocket('ws://' + Host)
  }
}

function enterCheck(e) {
  if (e.keyCode == 13) {
      $("#modal_submit").click()
      return false;
  }
}

$(document).ready(function () {
  var socketUrlString = 'http://' + Host
  Team1.start({
    socketUrl: socketUrlString
  })
  // setInterval(function() {
  //   var state = Team1.socket.readyState
  //   console.log(state)
  //   if(state === Team1.socket.CLOSED && state !== Team1.socket.CONNECTING) {
  //     Team1.reconnect({
  //       socketUrl: socketUrlString
  //     })
  //   }
  // }, 5000)

  // switch for socket connection
  new Switchery(document.querySelector('.js-connect'))
  $connectMode = $(".js-connection-switch")
  $connectMode.on("change", function () {
    if ($(this).is(":checked")) {
      Team1.socket.close()
    }
    else {
      Team1.reconnect({
        socketUrl: socketUrlString
      })
    }
  })

  // Modal window for auth
  var username = $("#modal_username")
    , modalBtn = $("#modal_submit")
  username.focus()

  modalBtn.click(function() {
    var user = {
      title: username.val()
    }
    username.val("")

    Team1.__user = user
    Team1.openDocument()
    $(".modal").hide()
  })
})

window.onbeforeunload = function () {
  if (Team1.Roster.getUsersCount() == 1) {
      Team1.saveDocument()
  }
}

window.onunload = function () {
  if (Team1.Roster.getUsersCount() == 1) {
      Team1.saveDocument()
  }
}
