var gulp = require('gulp')
  , gulpIgnore = require('gulp-ignore')
  , concat = require('gulp-concat')
  , autoprefixer = require('gulp-autoprefixer')
  , wrap = require('gulp-wrap')
  , watch = require('gulp-watch')
  , streamqueue = require('streamqueue')
  , karma = require('karma').server
  , uglify = require('gulp-uglify')
  , minifyCSS = require('gulp-minify-css')
  , minifyHTML = require('gulp-minify-html')
  , runSequence = require('run-sequence')
  , env = process.env.NODE_ENV || 'DEV'

gulp.task('config', function () {

  var srcConfig = ''

  console.log('App is running in ' + env + ' environment')

  if (env === 'PROD') {
    srcConfig = './config/prod.json'
  }
  else {
    srcConfig = './config/dev.json'
  }

  gulp
    .src(srcConfig)
    .pipe(concat('current.json'))
    .pipe(gulp.dest('./config'))
})

gulp.task('index.min.html', function () {
  var opts = {comments:true,spare:true,quotes:true};
  streamqueue(
    { objectMode: true }
    // Html
    , gulp.src('blocks/**/*.html')
      .pipe(minifyHTML(opts))
      .pipe(gulp.dest('./dist/html'))
    , gulp
      .src('dist/html/**/*.html')
      .pipe(wrap('<script '
          + 'type="template" '
          + 'id="<%= file.path.replace(/^.*\\/([^/]+)$/, \'$1\') %>">'
          + '<%= file.contents %>'
          + '</script>'
      ))
    // Css
    , gulp.src(
        [ 'libs/codemirror/lib/codemirror.css'
        , 'libs/switchery/dist/switchery.min.css'
        , 'blocks/**/*.css'
        ]
      )
      .pipe(minifyCSS(
        { keepBreaks: false
        }
      ))
      .pipe(concat('index.css'))
      .pipe(autoprefixer(
        { browsers: ['last 3 versions']
        , cascade: true
        }
      ))
      .pipe(wrap('<style><%= file.contents %></style>'))
    // Js
    , gulp
      .src(
        [ 'libs/jquery/dist/jquery.min.js'
        , 'libs/codemirror/lib/codemirror.js'
        , 'node_modules/share/webclient/share.js'
        , 'libs/share-codemirror/share-codemirror.js'
        , 'libs/codemirror/mode/javascript/javascript.js'
        , 'libs/lodash/dist/lodash.min.js'
        , 'libs/switchery/dist/switchery.min.js'
        ]
      )
      .pipe(wrap('<script><%= file.contents %></script>'))
    , gulp
      .src(
        [ 'blocks/page/page.js'
        , 'blocks/**/*.js'
        ]
      )
      .pipe(uglify())
      .pipe(concat('index.js'))
      .pipe(wrap('<script><%= file.contents %></script>'))
  )
    .pipe(concat('index.html'))
    .pipe(gulp.dest('./'))
})

gulp.task('index.html', function () {
  streamqueue(
    { objectMode: true }
    , gulp.src('blocks/page/page.html')
    , gulp
      .src('blocks/**/*.html')
      .pipe(gulpIgnore.exclude('**/page.html'))
      .pipe(wrap('<script '
          + 'type="template" '
          + 'id="<%= file.path.replace(/^.*\\/([^/]+)$/, \'$1\') %>">'
          + '<%= file.contents %>'
          + '</script>'
      ))
    , gulp
        .src(
          [ 'libs/codemirror/lib/codemirror.css'
          , 'libs/switchery/dist/switchery.min.css'
          , 'blocks/**/*.css'
          ]
        )
        .pipe(concat('index.css'))
        .pipe(autoprefixer(
          { browsers: ['last 3 versions']
          , cascade: true
          }
        ))
        .pipe(wrap('<style><%= contents %></style>'))
    , gulp
      .src(
        [ 'libs/jquery/dist/jquery.min.js'
        , 'libs/lodash/dist/lodash.min.js'
        , 'libs/codemirror/lib/codemirror.js'
        , 'node_modules/share/webclient/share.uncompressed.js'
        , 'libs/share-codemirror/share-codemirror.js'
        , 'libs/codemirror/mode/javascript/javascript.js'
        , 'libs/switchery/dist/switchery.min.js'
        , 'blocks/page/page.js'
        , 'blocks/**/*.js'
        ]
      )
      .pipe(concat('index.js'))
      .pipe(wrap('<script><%= contents %></script>'))
  )
    .pipe(concat('index.html'))
    .pipe(gulp.dest('./'))
})

gulp.task('watch', function () {
  watch([ 'blocks/**/*.html'
        , 'blocks/**/*.css'
        , 'blocks/**/*.js']
        , function () {
    gulp.start('index.html')
  })
})

gulp.task('test', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done)
})

gulp.task('tdd', function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js'
  }, done)
})


//gulp.task('default', runSequence( 'config', 'index.html'))


gulp.task('watch', [runSequence( 'config', 'index.min.html'), 'watch'])
gulp.task('default', runSequence( 'config', 'index.min.html'))
