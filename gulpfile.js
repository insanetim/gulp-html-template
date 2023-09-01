import pkg from 'gulp'
const { src, dest, parallel, series, watch } = pkg
import concat from 'gulp-concat'
import changed from 'gulp-changed'
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

// For images
import imagemin from 'gulp-imagemin'

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
  },
  images: {
    dir: './src/assets/images/',
    src: './src/assets/images/**/*',
    dist: './dist/assets/images'
  },
  assets: {
    dir: './src/assets/**/*',
    src: ['./src/assets/fonts/**/*'],
    dist: ['./dist/assets/fonts/**/*']
  }
}
const serverConfig = {
  server: {
    baseDir: paths.dist,
    directory: true
  },
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

function images() {
  return src(paths.images.src)
    .pipe(changed(paths.images.dist))
    .pipe(imagemin())
    .pipe(dest(paths.images.dist))
    .pipe(browserSync.stream())
}

function copyAssets() {
  return src(paths.assets.src, {
    base: './src'
  })
    .pipe(changed(paths.dist))
    .pipe(dest(paths.dist))
}

function clean() {
  return deleteAsync(paths.dist, { force: true })
}

function cleanImages() {
  return deleteAsync(paths.images.dist, { force: true })
}

function cleanAssets() {
  return deleteAsync(paths.assets.dist, { force: true })
}

function watcher() {
  watch(paths.templates.dir, { usePolling: true }, templates)
  watch(paths.css.dir, { usePolling: true }, styles)
  watch(paths.js.dir, { usePolling: true }, scripts).on('change', browserSync.reload)
  watch(paths.images.dir, { usePolling: true }, series(cleanImages, images))
  watch(paths.assets.dir, { usePolling: true }, series(cleanAssets, copyAssets)).on('change', browserSync.reload)
}

export { clean }
export const build = series(clean, parallel(images, copyAssets), parallel(templates, styles, scripts))
export default series(
  clean,
  parallel(images, copyAssets),
  parallel(templates, styles, scripts),
  parallel(watcher, browsersync)
)
