const { src, dest, parallel, series, watch } = require('gulp')
const rename = require('gulp-rename')
const del = require('del')

// For templates.
const twig = require('gulp-twig')
const beautify = require('gulp-jsbeautifier')

// For css.
const sass = require('gulp-sass')(require('sass'))
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

// For js.
const webpack = require('webpack')
const gulpWebpack = require('webpack-stream')

// For errors.
const plumber = require('gulp-plumber')
const notifier = require('node-notifier')

// For view.
const browserSync = require('browser-sync').create()

// Config
const paths = {
  src: './src',
  dist: './dist',
  templates: {
    dir: './src/templates/**/*.twig',
    src: './src/templates/pages/*.twig',
    dist: './dist/'
  },
  css: {
    dir: './src/scss/**/*.scss',
    src: './src/scss/main.scss',
    dist: './dist/css'
  },
  js: {
    dir: './src/js/**/*.js',
    src: './src/js/app.js',
    dist: './dist/js'
  }
}

const serverConfig = {
  server: {
    baseDir: paths.dist,
    directory: true
  },
  serveStatic: ['./public'],
  startPath: `index.html`,
  notify: false
}

const webpackConfig = {
  mode: 'production',
  entry: {
    app: paths.js.src
  },
  output: {
    filename: '[name].min.js'
  }
}

// Task
function errorHandler(error) {
  notifier.notify({
    title: 'Gulp Error',
    message: error.message,
    timeout: 3
  })
  console.error('\x1b[31m', error.message, '\x1b[0m')
  this.emit('end')
}

function browser_sync() {
  browserSync.init(serverConfig)
}

function templates() {
  return src(paths.templates.src)
    .pipe(plumber({ errorHandler }))
    .pipe(twig())
    .pipe(
      beautify({
        indent_size: 2
      })
    )
    .pipe(dest(paths.templates.dist))
    .pipe(browserSync.stream())
}

function styles() {
  const plugins = [autoprefixer(), cssnano()]
  return src(paths.css.src)
    .pipe(plumber({ errorHandler }))
    .pipe(sass({ includePaths: ['node_modules'] }))
    .pipe(postcss(plugins))
    .pipe(
      rename({
        suffix: '.min',
        extname: '.css'
      })
    )
    .pipe(dest(paths.css.dist))
    .pipe(browserSync.stream())
}

function scripts() {
  return src(paths.js.src)
    .pipe(plumber({ errorHandler }))
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(dest(paths.js.dist))
}

function clean() {
  return del([paths.dist])
}

function watcher() {
  watch(paths.templates.dir, templates)
  watch(paths.css.dir, styles)
  watch(paths.js.dir, scripts).on('change', browserSync.reload)
}

exports.clean = clean
exports.default = series(clean, parallel(templates, styles, scripts), parallel(watcher, browser_sync))
