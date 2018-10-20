const path = require("path");
const async = require("async");
const gulp = require("gulp");
const conflict = require("gulp-conflict");
const template = require("gulp-template");
const rename = require("gulp-rename");
const inquirer = require("inquirer");
const minimist = require("minimist");
const debug = require("debug")("slush-hexo-theme");
const templatesPath = path.join(__dirname, "templates");

let layoutSrc;
let styleSrc;
let styleName;
let styleDest;
let scriptSrc;
let scriptName;
let scriptDest;
let args = {};
let answers = {};

const defaults = {
  name: path.basename(process.env.PWD || process.cwd()),
  tmpl: "ejs",
  style: "styl",
  other: []
};

function shutdown(err) {
  if (err !== undefined && err !== null) {
    throw err;
  }
}

function askQuestions(cb) {
  debug("askQuestions");
  const name = {
    name: "name",
    type: "input",
    message: "name",
    default: args.name || defaults.name
  };

  const tmpl = {
    name: "tmpl",
    type: "list",
    message: "template language",
    choices: ["ejs", "nunjucks", "pug", "swig"],
    default: args.tmpl || defaults.tmpl
  };

  const style = {
    name: "style",
    type: "list",
    message: "stylesheet language",
    choices: ["styl", "scss", "sass", "less", "css"],
    default: args.style || defaults.style
  };

  const other = {
    name: "other",
    type: "checkbox",
    message: "other",
    choices: [
      {
        name: "Hexo scripts directory (hexo plugins)",
        value: "hexo-scripts"
      },
      {
        name: "Bower: bower.json, .bowerrc",
        value: "bower"
      },
      {
        name: ".editorconfig",
        value: "editorconfig"
      }
    ]
  };

  const questions = [name, tmpl, style, other];

  inquirer
    .prompt(questions)
    .then(cb)
    .catch(shutdown);
}

function copyFiles(cb) {
  const steps = [];

  debug("copyFiles");

  steps.push(function(cb) {
    debug("step: layout");
    gulp
      .src(path.join(layoutSrc))
      .pipe(conflict("./layout"))
      .pipe(gulp.dest("./layout"))
      .on("finish", cb)
      .on("error", shutdown);
  });

  steps.push(function(cb) {
    debug("step: style");
    gulp
      .src(styleSrc)
      .pipe(rename(styleName))
      .pipe(conflict(styleDest))
      .pipe(gulp.dest(styleDest))
      .on("finish", cb)
      .on("error", shutdown);
  });

  steps.push(function(cb) {
    debug("step: layout");
    gulp
      .src(scriptSrc)
      .pipe(template(answers))
      .pipe(rename(scriptName))
      .pipe(conflict(scriptDest))
      .pipe(gulp.dest(scriptDest))
      .on("finish", cb)
      .on("error", shutdown);
  });

  steps.push(function(cb) {
    debug("step: config");
    gulp
      .src(path.join(templatesPath, "_config.yml"))
      .pipe(template(answers))
      .pipe(conflict("./"))
      .pipe(gulp.dest("./"))
      .on("finish", cb)
      .on("error", shutdown);
  });

  if (answers.other.indexOf("hexo-scripts") !== -1) {
    steps.push(function(cb) {
      debug("step: hexo-scripts");
      gulp
        .src(path.join(templatesPath, "scripts"))
        .pipe(conflict("./scripts"))
        .pipe(gulp.dest("./scripts"))
        .on("finish", cb)
        .on("error", shutdown);
    });
  }

  if (answers.other.indexOf("bower") !== -1) {
    steps.push(function(cb) {
      debug("step: bower");
      gulp
        .src(`${templatesPath}/.bowerrc`)
        .pipe(template(answers))
        .pipe(conflict("./"))
        .pipe(gulp.dest("./"))
        .on("finish", cb)
        .on("error", shutdown);
    });

    steps.push(function(cb) {
      gulp
        .src(`${templatesPath}/bower.json`)
        .pipe(template(answers))
        .pipe(conflict("./"))
        .pipe(gulp.dest("./"))
        .on("finish", cb)
        .on("error", shutdown);
    });
  }

  if (answers.other.indexOf("editorconfig") !== -1) {
    steps.push(function(cb) {
      debug("step: editorconfig");
      gulp
        .src(path.join(templatesPath, ".editorconfig"))
        .pipe(conflict("./"))
        .pipe(gulp.dest("./"))
        .on("finish", cb)
        .on("error", shutdown);
    });
  }

  async.series(steps, cb);
}

function setPaths() {
  layoutSrc = `${templatesPath}/layout-${answers.tmpl}/**/*`;
  styleSrc = `${templatesPath}/styles/style.${answers.style}`;
  styleName = `${answers.name}.${answers.style}`;
  styleDest = "./source/css";
  scriptSrc = `${templatesPath}/client.js`;
  scriptName = `${answers.name}.js`;
  scriptDest = "./source/js";
}

gulp.task("default", function(done) {
  debug("task: default");

  args = Object.assign({}, defaults, minimist(process.argv));

  if (args.nq === true) {
    answers = Object.assign(answers, args);
    setPaths();
    return copyFiles(done);
  }

  askQuestions(function(res) {
    answers = Object.assign(answers, res);
    setPaths();
    return copyFiles(done);
  });
});
