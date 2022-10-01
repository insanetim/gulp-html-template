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
const uglify = require('gulp-uglify-es').default

// For errors.
const plumber = require('gulp-plumber')
// const notifier = require('gulp-notifier')
const notifier = require('node-notifier')

// For view.
const browserSync = require('browser-sync').create()

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

// Configs
const serverConfig = {
  server: {
    baseDir: 'dist',
    directory: true
  },
  serveStatic: ['./public'],
  startPath: `index.html`,
  notify: false
}

const webpackConfig = {
  mode: 'development',
  entry: {
    app: paths.js.src
  },
  output: {
    filename: '[name].js'
  }
}

// Tasks
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

function css() {
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

function js() {
  return src(paths.js.src)
    .pipe(plumber({ errorHandler }))
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(
      rename({
        suffix: '.min',
        extname: '.js'
      })
    )
    .pipe(uglify())
    .pipe(dest(paths.js.dist))
}

function clean() {
  return del([paths.dist])
}

function watcher() {
  watch(paths.templates.dir, templates)
  watch(paths.css.dir, css)
  watch(paths.js.dir, js).on('change', browserSync.reload)
}

exports.paths = paths
exports.clean = clean
exports.default = series(clean, parallel(templates, css, js), parallel(watcher, browser_sync))
