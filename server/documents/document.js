var _ = require('lodash-node')
  // Generator uniq id for documents
  , getUID = function () { return _.uniqueId('file-') }
  , Documents = {}
  , Document = module.exports = function (props) {
      props = props || {}
      this.id = props.id || getUID() // стоит сложить в переменную
      if (Documents[this.id] instanceof Document) return Documents[this.id]
      this.collaborators = []
      this.props = _.extend({}, props) // если зачем-то нужно копирование
                                       // (не глубокое!), то нужно написать
                                       // комментарий зачем
      delete this.props.id
      Documents[this.id] = this
    }
  , proto = Document.prototype // переменная не нужна,
                               // если использовать _.extend



//region *** Events API ***
/**
 * Fire event on collaborators
 * @param event {String}
 * @param data {Object}
 * @param [collaborators] {Array}
 * @returns {Document}
 */
proto.notifyCollaborators = function (data, collaborators) {
  _.each( collaborators || this.collaborators
        , function (collaborator) {
            if (this.isPresent(collaborator)) collaborator.emit(data)
          }
        , this
        )
  return this
}
//endregion


//region *** Manage collaborators ***
/**
 * Attach collaborator to the document
 * @param collaborator {User}
 * @returns {Document}
 */
proto.addCollaborator = function (collaborator) {
  if (!this.isPresent(collaborator)) {
    this.notifyCollaborators({ a: 'join'
                             , user : collaborator.exportPublicData()
                             })
    this.collaborators.push(collaborator)
  }
  return this
}

/**
 * Detach collaborator from document
 * @param collaborator {User}
 * @returns {Document}
 */
proto.removeCollaborator = function (collaborator) {
  if (this.isPresent(collaborator)) {
    _.pull(this.collaborators, collaborator)
    this.notifyCollaborators({ a: 'leave'
                             , user: collaborator.exportOnlyId()
                             })
  }
  return this
}

/**
 * Check, collaborator is present or not in the document
 * @param collaborator {User}
 * @returns {boolean}
 */
proto.isPresent = function (collaborator) {
  // по факту делается _.contains
  return _.indexOf(this.collaborators, collaborator) > -1
}
//endregion


//region *** Exports API ***
/**
 * Simple export
 * @returns {{id: *}}
 */
proto.exportOnlyId = function () {
  return { id: this.id }
}

/**
 * Public data for users
 * @returns {*}
 */
proto.exportPublicData = function () {
  return _.extend( this.exportOnlyId()
                 , { users: _.map( this.collaborators
                                 , function (collaborator) {
                                     return collaborator.exportPublicData()
                                   }
                                 )
                   }
                 )
}
//endregion
