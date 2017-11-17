
# slush-hexo-theme

Generate a [hexo](https://hexo.io) theme

[Yeoman version available too](https://github.com/tcrowe/generator-hexo-theme)

Template choices:
+ ejs
+ nunjucks
+ pug
+ swig

Style choices:
+ stylus
+ sass
+ scss
+ less
+ css

Other:
+ hexo scripts
+ bower: .bowerrc, bower.json
+ npm: package.json
+ .gitignore
+ .editorconfig

---

## Install globally

```sh
npm install --global slush
npm install --global slush-hexo-theme
```

---

## How to use it

If you don't have a site yet create one with `hexo init` [hexo-cli](https://github.com/hexojs/hexo-cli).

```sh
mkdir my-site
cd my-site
hexo init
```

Navigate to the directory you want to place the theme project in (most likely `themes/`).

```sh
# from the site root
cd themes

# make a new theme directory
mkdir my-theme
cd my-theme

# generate
slush hexo-theme
```

**It will not automatically overwrite an existing file. Overwrites are confirmed with the user.**

1. Check `_config.yml` in your **main blog directory**
  * Set `theme` property to your theme name, activating this theme
2. Check `_config.yml` in your **theme directory**
  * Change menu items if needed
  * Change stylesheet and scripts list if needed
3. Navigate to your main blog directory
4. `hexo server --debug`

## Hexo renderers

It might be necessary to goto the blog directory and install a specific renderer for the template language you have chosen. Swig are built into Hexo.

```sh
# templates
npm install hexo-renderer-ejs
npm install hexo-renderer-njks
npm install hexo-render-pug

# styles
npm install hexo-renderer-stylus
npm install hexo-renderer-less
npm install hexo-renderer-sass
```

---

## Help!

+ hexo gitter chat https://gitter.im/hexojs/hexo
+ [post an issue](https://github.com/tcrowe/slush-hexo-theme/issues)

---

## Contribute

It's a community project. Want to help?

+ Fix a [bug](https://github.com/tcrowe/slush-hexo-theme/issues)
+ GitHub star ⭐
+ `npm star slush-hexo-theme`
+ Do we need to implement any helpers? https://hexo.io/docs/helpers.html

Know another template language hexo users need?

1. Fork
2. Copy an existing template directory
3. Port it to the new language
4. Test
5. Create pull request

---

### Development

It uses [livescript](http://livescript.net) to compile the `slushfile.js`. It's
handled automatically through the `dev` script.

```sh
# watch the files, re-compile, and test
npm run dev

# build before publishing
npm run prd

# clean up the test site
npm run clean
```

---

## Thank you

+ [moosoul](https://github.com/moosoul)
+ [jonashao](https://github.com/jonashao)

## Resources

+ Theme docs https://hexo.io/docs/themes.html
+ Submit your theme whttps://github.com/hexojs/hexo-theme-unit-test
+ Slush docs http://slushjs.github.io
