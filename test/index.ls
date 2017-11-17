require! {
  fs
  path
  child_process: {exec}
  async
  mkdirp
  'js-yaml': yaml
}

sitePath = path.join __dirname, 'site'
siteConfigPath = path.join sitePath, '_config.yml'
siteConfig = void
nmPath = path.join sitePath, 'node_modules'
themesPath = path.join sitePath, 'themes'
tmpls = <[ejs nunjucks pug swig]>
defaultOpts = {env: process.env, cwd: sitePath}

postSource = """
---
title: TITLE
date: 2017-11-16 19:41:03
tags:
---

TITLE
"""

saveConfig = ->
  op = yaml.safeDump siteConfig
  fs.writeFileSync siteConfigPath, op

command = ({cmd, cwd=sitePath}, cb) ->
  opts = {env: process.env, cwd}
  # console.log 'cmd', cmd
  (err, stdout, stderr) <- exec cmd, opts
  if err is not void and err is not null
    console.error "error command: cmd", err
    console.error 'stdout', stdout
    console.error 'stderr', stderr
    return cb err
  cb()

suite 'slush-hexo-theme', ->
  test 'test site directory exists', (done) ->
    mkdirp sitePath, done
  test 'hexo site initialized', (done) ->
    (exists) <- fs.exists nmPath
    if exists is true then return done()
    command cmd: 'hexo init && npm install', done
  test 'renderers installed', (done) ->
    (exists) <- fs.exists path.join nmPath, 'hexo-renderer-nunjucks'
    if exists is true then return done()
    cmd = 'npm i hexo-renderer-ejs hexo-renderer-nunjucks hexo-renderer-pug'
    command {cmd}, done
  test 'ensure posts', (done) ->
    steps = []
    inc = 0
    for postId from 1 to 100
      steps.push (cb) ->
        inc += 1
        innerPostId = new Number(inc)
        postPath = path.join sitePath, 'source', '_posts', "post#innerPostId.md"
        (exists) <- fs.exists postPath
        if exists is true then return cb()
        op = '' + postSource .replace(/TITLE/g, "post#innerPostId")
        fs.writeFile postPath, op, cb
    async.series steps, done
  test 'remove themes', (done) ->
    command {cmd: "rm -rf #themesPath"}, done
  test 'create theme directory', (done) ->
    mkdirp themesPath, done
  test 'site config loaded', (done) ->
    (err, buf) <- fs.readFile siteConfigPath
    if err? then return done err
    siteConfig := yaml.safeLoad buf.toString()
    done()
  tmpls.forEach (tmpl) ->
    tmplName = "slush-theme-#tmpl"
    # console.log 'tmplName', tmplName
    tmplPath = path.join themesPath, tmplName
    test "clean site before #tmpl", (done) ->
      command {cmd: 'rm -rf db.json debug.log'}, done
    test "theme #tmplName directory exists", (done) ->
      mkdirp tmplPath, done
    test "create #tmpl theme", (done) ->
      cmd = "slush hexo-theme --nq --name=#tmplName --tmpl=ejs --style=styl"
      command {cmd, cwd: tmplPath}, done
    test "site config theme set #tmplName", ->
      siteConfig.theme = tmplName
      saveConfig()
    test "generate site for #tmplName", (done) ->
      command {cmd: "hexo generate"}, done
