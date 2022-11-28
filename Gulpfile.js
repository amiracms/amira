"use strict";

const gulp = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const bundles = require('@amira/ui/packages');
const fs = require('fs');
const header = require( 'gulp-header' ),
    date = new Date(),
    datestring = date.toDateString(),
    pkg = JSON.parse(fs.readFileSync('./package.json')),
    banner_args = {
        title: pkg.title,
        version: pkg.version,
        datestring: datestring,
        pkg: pkg
    },
    banner = '/**! <%=title%> -v <%=version%>\n' +
        ' * Author: <%=pkg.author%> <<%=pkg.author_email%>>\n' +
        ' * Copyright (c) <%=datestring%>\n' +
        ' * License: GNU General Public License v2 or later\n' +
        '!**/\n';

gulp.task('build-admin', function() {
	const b = browserify({
        extensions: ['.jsx', '.js'],
        paths: [
            './node_modules',
            './node_modules/@amira/ui/node_modules'
        ]
    });

    // Expose bundles
    bundles.map(r => b.require(r, {expose: r}));

    b.require('./src/admin/index.jsx', {expose: '@amira'});

    b.transform('babelify', {
        extensions: ['.jsx', '.js'],
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: ['@babel/plugin-transform-runtime']
    });

    return b.bundle()
        .pipe(source('admin.js'))
        .pipe(gulp.dest('./public/script'));
});

gulp.task('bundle-admin', function() {
    process.env.NODE_ENV = "production";

    const b = browserify({
        extensions: ['.jsx', '.js'],
        paths: [
            './node_modules',
            './node_modules/@amira/ui/node_modules'
        ]
    });

    // Expose bundles
    bundles.map(r => b.require(r, {expose: r}));

    b.require('./src/admin/index.jsx', {expose: '@amira'});

    b.transform('babelify', {
        extensions: ['.jsx', '.js'],
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: ['@babel/plugin-transform-runtime']
    });

    return b.bundle()
        .pipe(source('admin.min.js'))
        .pipe(gulp.dest('./public/script'))
        .on('end', function() {
            return gulp.src('./public/script/admin.min.js')
                .pipe(__uglify())
                .pipe(gulp.dest('./public/script'));
        })
})

gulp.task('css', function() {
    const autoprefixer = require('gulp-autoprefixer'),
        sass = require( 'gulp-sass' )(require('sass')),
        rename = require( 'gulp-rename' ),
        css = ['*.scss'];

    return gulp.src(css, {cwd: './public/scss'})
        .pipe(sass({outputStyle: 'expanded'}))
        .pipe(header(banner, banner_args))
        .pipe(autoprefixer('last 2 version', '> 1%', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(gulp.dest( './public/css' ))
        .on( 'finish', function() {
            return gulp.src( ['*.css', '!*.min.css'], {cwd: './public/css'} )
                .pipe(sass({outputStyle: 'compressed'}))
                .pipe(rename(function(path){
                    path.basename = path.basename + '.min';
                }))
                .pipe(header(banner, banner_args))
                .pipe(autoprefixer('last 2 version', '> 1%', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
                .pipe(gulp.dest('./public/css'));
        });
});

function __uglify() {
    const uglify = require("uglify-js"),
        through = require('through2'),
        options = {
            compress: true,
            keep_fnames: true,
            mangle: false
        };

    return through.obj(function(file, enc, cb) {
        if (!file.isBuffer()) {
            return cb();
        }

        const content = uglify.minify(file.contents.toString(), options);

        if (!content.code) {

            return cb();
        }

        file.contents = Buffer.from(content.code);

        if (file.path && !file.path.match(/\.min.js/)) {
            file.path = file.path.replace('.js', '.min.js');
        }

        cb(null, file);
    });
}