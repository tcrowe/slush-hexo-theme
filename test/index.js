const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;
const async = require("async");
const mkdirp = require("mkdirp");
const yaml = require("js-yaml");

const { env } = process;
const sitePath = path.join(__dirname, "site");
const siteConfigPath = path.join(sitePath, "_config.yml");
const nmPath = path.join(sitePath, "node_modules");
const themesPath = path.join(sitePath, "themes");
const tmpls = ["ejs", "nunjucks", "pug", "swig"];

const rendererModules = [
  "hexo-renderer-ejs",
  "hexo-renderer-nunjucks",
  "hexo-renderer-pug",
  "hexo-renderer-swig"
];

const postSource = `
---
title: TITLE
date: 2017-11-16 19:41:03
tags:
---

TITLE
`;

let siteConfig;

function saveConfig() {
  const op = yaml.safeDump(siteConfig);
  fs.writeFileSync(siteConfigPath, op);
}

function command({ cmd, cwd = sitePath }, cb) {
  const opts = { env, cwd };
  exec(cmd, opts, function(err, stdout, stderr) {
    if (err !== undefined && err !== null) {
      console.error("error command: cmd", err);
      console.error("stdout", stdout);
      console.error("stderr", stderr);
      return cb(err);
    }
    cb();
  });
}

describe("slush-hexo-theme", function() {
  before(done => {
    mkdirp(sitePath, done);
  });

  it("hexo init", function(done) {
    fs.exists(siteConfigPath, function(exists) {
      if (exists === true) {
        return done();
      }

      const cmd = "hexo init";
      command({ cmd }, done);
    });
  });

  it("npm install", function(done) {
    fs.exists(nmPath, function(exists) {
      if (exists === true) {
        return done();
      }

      const cmd = [
        "npm",
        "install",
        "--cache",
        "--prefer-offline",
        "--no-optional",
        "--production"
      ].join(" ");
      command({ cmd }, done);
    });
  });

  it("renderers installed", function(done) {
    const steps = rendererModules.map(item => done => {
      const modPath = path.join(nmPath, item);

      fs.exists(modPath, function(exists) {
        if (exists === true) {
          return done();
        }

        const cmd = [
          "npm",
          "install",
          item,
          "--cache",
          "--prefer-offline",
          "--no-optional",
          "--production"
        ].join(" ");
        command({ cmd }, done);
      });
    });

    async.series(steps, done);
  });

  it("ensure posts", function(done) {
    const steps = [];
    let inc = 0;

    function createPost(cb) {
      inc += 1;

      const innerPostId = Number(inc);

      const postPath = path.join(
        sitePath,
        "source",
        "_posts",
        `post${innerPostId}.md`
      );

      fs.exists(postPath, function(exists) {
        if (exists === true) {
          return cb();
        }

        const op = postSource.replace(/TITLE/g, `post${innerPostId}`);
        fs.writeFile(postPath, op, cb);
      });
    }

    for (let i = 1; i < 100; i += 1) {
      steps.push(createPost);
    }

    async.series(steps, done);
  });

  it("remove themes", function(done) {
    const cmd = `rm -rf  ${themesPath}`;
    command({ cmd }, done);
  });

  it("create theme directory", function(done) {
    return mkdirp(themesPath, done);
  });

  it("site config loaded", function(done) {
    fs.readFile(siteConfigPath, function(err, buf) {
      if (err !== null) {
        return done(err);
      }

      siteConfig = yaml.safeLoad(buf.toString());
      done();
    });
  });

  tmpls.forEach(function(tmpl) {
    const tmplName = `slush-theme-${tmpl}`;
    const tmplPath = path.join(themesPath, tmplName);

    it(`clean site before ${tmpl}`, function(done) {
      const cmd = "rm -rf db.json debug.log";
      command({ cmd }, done);
    });

    it(`theme ${tmplName} directory exists`, function(done) {
      mkdirp(tmplPath, done);
    });

    it(`create ${tmpl} theme`, function(done) {
      const cmd = [
        "slush",
        "hexo-theme",
        "--nq",
        `--name=${tmplName}`,
        "--tmpl=ejs",
        "--style=styl"
      ].join(" ");
      const cwd = tmplPath;
      command({ cmd, cwd }, done);
    });

    it(`site config theme set ${tmplName}`, function() {
      siteConfig.theme = tmplName;
      saveConfig();
    });

    it(`generate site for ${tmplName}`, function(done) {
      const cmd = "hexo generate";
      command({ cmd }, done);
    });
  });
});
