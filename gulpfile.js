const { src, dest, parallel, series, watch } = require('gulp')
const rename = require('gulp-rename')
const del = require('del')

// For html.
const nunjucksRender = require('gulp-nunjucks-render')

// For css.
const sass = require('gulp-sass')(require('sass'))
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

// For js.
const include = require('gulp-include')
const uglify = require('gulp-uglify-es').default

// For errors.
const notify = require('gulp-notify')

// For view.
const browserSync = require('browser-sync').create()

const root = './src'
const dist = './dist'

const config = {
  html: {
    dir: `${root}/templates/**/*.njk`,
    src: `${root}/templates/*.njk`,
    dist: `${dist}/`
  },
  css: {
    dir: `${root}/scss/**/*.scss`,
    src: `${root}/scss/**/*.scss`,
    dist: `${dist}/css`
  },
  js: {
    dir: `${root}/js/**/*.js`,
    src: `${root}/js/*.js`,
    dist: `${dist}/js`
  }
}

// Server.
const serverConfig = {
  server: {
    baseDir: './',
    directory: true
  },
  startPath: `${dist}/index.html`,
  notify: false
}

function browser_sync() {
  browserSync.init(serverConfig)
}

function html() {
  return src(config.html.src)
    .pipe(
      nunjucksRender({
        path: ['src/templates']
      })
    )
    .pipe(dest(config.html.dist))
    .pipe(browserSync.stream())
}

function css() {
  const plugins = [autoprefixer(), cssnano()]
  return src(config.css.src)
    .pipe(
      sass({
        includePaths: ['node_modules']
      }).on('error', notify.onError())
    )
    .pipe(postcss(plugins))
    .pipe(
      rename({
        suffix: '.min',
        extname: '.css'
      })
    )
    .pipe(dest(config.css.dist))
    .pipe(browserSync.stream())
}

function js() {
  return src(config.js.src)
    .pipe(
      include({
        includePaths: [__dirname + '/node_modules', __dirname + '/src/js']
      })
    )
    .pipe(
      rename({
        suffix: '.min',
        extname: '.js'
      })
    )
    .pipe(uglify())
    .pipe(dest(config.js.dist))
}

function clean() {
  return del([config.html.dist, config.css.dist, config.js.dist], {
    force: true
  })
}

function watcher() {
  watch(config.html.dir, html)
  watch(config.css.dir, css)
  watch(config.js.dir, js).on('change', browserSync.reload)
}

exports.clean = clean
exports.default = series(clean, parallel(html, css, js), parallel(watcher, browser_sync))
