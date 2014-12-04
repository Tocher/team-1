var http = require('http')
  , url = require('url')
  , fs = require('fs')
  , log = require('npmlog')
  , logPrefix = 'HTTP server'
  , isStarted = false
  , path = require('path')

exports.start = function (config) {
  if (config && !isStarted) {
    try {
      http.createServer(function (request, response) {
        log.http(request.method + ' request', request.url)

        var urlParsed = url.parse(request.url, true)

        var urlParsedName = urlParsed.query.name
        if (urlParsed.pathname == '/theme' && urlParsedName) {
          var themePath = 'libs/codemirror/theme/' + urlParsedName

          fs.readFile(themePath + '.css', 'utf8',  function (err, data) {
            if (err) throw err

            response.end(JSON.stringify(data))
          })
        }
        else if (urlParsed.pathname == '/theme' && !urlParsedName) {
          fs.readdir('libs/codemirror/theme/', function (err, files) {
            if (err) throw err

            response.end(JSON.stringify(files))
          })
        }
        else if (request.method == 'POST') {
          var body = ''
          request.on('data', function (data) {
              body += data
          });
          request.on('end', function () {
            var jsonBody = JSON.parse(body)
            if (jsonBody.operation == 'save') {
              saveDocument(jsonBody)
            }
            else if (jsonBody.operation == 'get') {
              var docContent = getDocument(jsonBody.docName)
              var docObj = {
                value: docContent
              }

              var docJSON = JSON.stringify(docObj)

              if (docJSON !== null) {
                console.log(docJSON)
                response.end(docJSON)
              }
              else {
                console.log('nothing');
                response.end()
              }

            }

          });
        }
        else {
          //reading index file
          fs.readFile(config.index, function (err, page) {
            if (err) {
              log.error(logPrefix, err.message)
              response.writeHeader(500)
              response.end('Can\'t read ' + config.index +
                           ' file. (Try to create it: npm run make)')
              return
            }

            response.writeHeader(200, {'Content-Type': 'text/html'})
            response.end(page)
          })
        }
      }).listen(config.port)
      log.info(logPrefix, 'Server started at port ' + config.port)
      isStarted = true
    } catch (e) {
      log.error(logPrefix, 'Server can\'t start. ' + e)
    }
  }
}


function saveDocument(jsonDoc) {

  if (!fs.existsSync(__dirname + path.sep + 'savedDocuments')) {
    fs.mkdirSync(__dirname + path.sep + 'savedDocuments')
  }

  fs.writeFileSync( __dirname + path.sep + 'savedDocuments'
              + path.sep + jsonDoc.docName, jsonDoc.docContent )
}


function getDocument(docId) {
  var pathToDoc = __dirname + path.sep + 'savedDocuments' + path.sep + docId

  if (fs.existsSync(pathToDoc)) {
    return fs.readFileSync(pathToDoc, 'utf8')
  }
  else {
    return null
  }

}
