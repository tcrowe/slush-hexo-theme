require! {
  child_process: {exec, spawn}
  path
  async
  chalk
  gulp
  'gulp-conflict': conflict
  'gulp-template': template
  'gulp-rename': rename
  inquirer
  minimist
}

debug = require('debug')('slush-hexo-theme')
args = {}
answers = {}
templatesPath = path.join __dirname, 'templates'
layoutSrc = void
styleSrc = void
styleName = void
styleDest = void
scriptSrc = void
scriptName = void
scriptDest = void

defaults =
  name: path.basename process.env.PWD || process.cwd
  tmpl: 'ejs'
  style: 'styl'
  other: []

shutdown = (err) ->
  console.error 'gulp error', err
  process.exit()

askQuestions = (cb) ->
  debug 'askQuestions'
  name =
    name: 'name'
    type: 'input'
    message: 'name'
    default: args.name or defaults.name
  tmpl =
    name: 'tmpl'
    type: 'list'
    message: 'template language'
    choices: <[ejs nunjucks pug swig]>
    default: args.tmpl or defaults.tmpl
  style =
    name: 'style'
    type: 'list'
    message: 'stylesheet language'
    choices: <[styl scss sass less css]>
    default: args.style or defaults.style
  other =
    name: 'other'
    type: 'checkbox'
    message: 'other'
    choices:
      * name: 'Hexo scripts directory (hexo plugins)'
        value: 'hexo-scripts'
      * name: 'Bower: bower.json, .bowerrc'
        value: 'bower'
      * name: '.editorconfig'
        value: 'editorconfig'
  questions =
    name
    tmpl
    style
    other
    ...
  # ask questions
  inquirer.prompt questions .then cb

copyFiles = (cb) ->
  debug 'copyFiles'
  steps = []
  # copy layout templates
  steps.push (cb) ->
    debug 'step: layout'
    gulp.src path.join layoutSrc
      .pipe conflict './layout'
      .pipe gulp.dest './layout'
      .on 'finish', cb
      .on 'error', shutdown
  # copy style
  steps.push (cb) ->
    debug 'step: style'
    gulp.src styleSrc
      .pipe rename styleName
      .pipe conflict styleDest
      .pipe gulp.dest styleDest
      .on 'finish', cb
      .on 'error', shutdown
  # copy client
  steps.push (cb) ->
    debug 'step: layout'
    gulp.src scriptSrc
      .pipe template answers
      .pipe rename scriptName
      .pipe conflict scriptDest
      .pipe gulp.dest scriptDest
      .on 'finish', cb
      .on 'error', shutdown
  # copy config
  steps.push (cb) ->
    debug 'step: config'
    gulp.src path.join templatesPath, '_config.yml'
      .pipe template answers
      .pipe conflict './'
      .pipe gulp.dest './'
      .on 'finish', cb
      .on 'error', shutdown
  if answers.other.indexOf('hexo-scripts') is not -1
    steps.push (cb) ->
      debug 'step: hexo-scripts'
      gulp.src path.join templatesPath, 'scripts'
        .pipe conflict './scripts'
        .pipe gulp.dest './scripts'
        .on 'finish', cb
        .on 'error', shutdown
  if answers.other.indexOf('bower') is not -1
    steps.push (cb) ->
      debug 'step: bower'
      gulp.src "#templatesPath/.bowerrc"
        .pipe template answers
        .pipe conflict './'
        .pipe gulp.dest './'
        .on 'finish', cb
        .on 'error', shutdown
    steps.push (cb) ->
      gulp.src "#templatesPath/bower.json"
        .pipe template answers
        .pipe conflict './'
        .pipe gulp.dest './'
        .on 'finish', cb
        .on 'error', shutdown
  if answers.other.indexOf('editorconfig') is not -1
    steps.push (cb) ->
      debug 'step: editorconfig'
      gulp.src path.join templatesPath, '.editorconfig'
        .pipe conflict './'
        .pipe gulp.dest './'
        .on 'finish', cb
        .on 'error', shutdown
  async.series steps, cb

setPaths = ->
  layoutSrc := "#templatesPath/layout-#{answers.tmpl}/**/*"
  styleSrc := "#templatesPath/styles/style.#{answers.style}"
  styleName := "#{answers.name}.#{answers.style}"
  styleDest := "./source/css"
  scriptSrc := "#templatesPath/client.js"
  scriptName := "#{answers.name}.js"
  scriptDest := "./source/js"

gulp.task 'default', (done) !->
  debug 'task: default'
  args := {} <<< defaults <<< minimist process.argv
  # ask questions with inquirer unless using command args
  if args.nq is true
    answers := answers <<< args
    setPaths()
    return copyFiles done
  (res) <- askQuestions
  answers := answers <<< res
  setPaths()
  copyFiles done

