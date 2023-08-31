import pkg from 'gulp'
const { src, dest, parallel, series, watch } = pkg
import concat from 'gulp-concat'
import { deleteAsync } from 'del'

// For templates.
import twig from 'gulp-twig'
import beautify from 'gulp-jsbeautifier'

// For styles.
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass'
const sass = gulpSass(dartSass)
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'

// For scripts.
import webpack from 'webpack'
import gulpWebpack from 'webpack-stream'

// For errors.
import plumber from 'gulp-plumber'
import notifier from 'node-notifier'

// For view.
import browserSync from 'browser-sync'

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
  serveStatic: ['./assets'],
  startPath: `index.html`,
  notify: false
}
import webpackConfig from './webpack.config.js'

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

function browsersync() {
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
  return src(paths.css.src)
    .pipe(plumber({ errorHandler }))
    .pipe(
      sass({
        includePaths: ['node_modules'],
        outputStyle: 'compressed'
      })
    )
    .pipe(
      postcss([autoprefixer({ grid: 'autoplace' })]),
      cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
    )
    .pipe(concat('main.min.css'))
    .pipe(dest(paths.css.dist))
    .pipe(browserSync.stream())
}

function scripts() {
  return src(paths.js.src)
    .pipe(plumber({ errorHandler }))
    .pipe(gulpWebpack(webpackConfig, webpack))
    .pipe(concat('app.min.js'))
    .pipe(dest(paths.js.dist))
}

function clean() {
  return deleteAsync([paths.dist], { force: true })
}

function watcher() {
  watch(paths.templates.dir, templates)
  watch(paths.css.dir, styles)
  watch(paths.js.dir, scripts).on('change', browserSync.reload)
}

export { clean }
export const build = series(clean, parallel(templates, styles, scripts))
export default series(clean, parallel(templates, styles, scripts), parallel(watcher, browsersync))
