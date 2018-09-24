var syntax        = 'sass'; // Syntax: sass or scss;

var gulp          = require('gulp'),
		gutil         = require('gulp-util' ),
		sass          = require('gulp-sass'),
		browsersync   = require('browser-sync'),
		concat        = require('gulp-concat'),
		uglify        = require('gulp-uglify'),
		cleancss      = require('gulp-clean-css'),
		rename        = require('gulp-rename'),
		del         	= require('del'), 
		imagemin    	= require('gulp-imagemin'),
		pngquant    = require('imagemin-pngquant'),
		autoprefixer  = require('gulp-autoprefixer'),
		notify        = require("gulp-notify"),
		rsync         = require('gulp-rsync'),
		inlinesource = require('gulp-inline-source');

gulp.task('browser-sync', function() {
	browsersync({
		server: {
			baseDir: 'app'
		},
		notify: false,
		// open: false,
		// tunnel: true,
		// tunnel: "projectname", //Demonstration page: http://projectname.localtunnel.me
	})
});

gulp.task('styles', function() {
	return gulp.src('app/'+syntax+'/**/*.'+syntax+'')
	.pipe(sass({ outputStyle: 'expand' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe(gulp.dest('app/css'))
	.pipe(browsersync.reload( {stream: true} ))
});

gulp.task('js', function() {
	return gulp.src([
		'app/js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest('app/js'))
	.pipe(browsersync.reload({ stream: true }))
});

gulp.task('rsync', function() {
	return gulp.src('app/**')
	.pipe(rsync({
		root: 'app/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Includes files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
});

gulp.task('watch', ['styles', 'js', 'browser-sync'], function() {
	gulp.watch('app/'+syntax+'/**/*.'+syntax+'', ['styles']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/*.html', browsersync.reload)
});

gulp.task('default', ['watch']);

//Блок добавленный для сборки

gulp.task('img', function() {
	return gulp.src('app/img/**/*') // Берем все изображения из app
			.pipe(imagemin({ // Сжимаем их с наилучшими настройками
					interlaced: true,
					progressive: true,
					svgoPlugins: [{removeViewBox: false}],
					use: [pngquant()]
			}))
			.pipe(gulp.dest('dist/img')); // Выгружаем на продакшен
});

gulp.task('clean', function() {
	return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('build', ['clean','styles', 'js', 'img'], function() {

	var buildCss = gulp.src([ // Переносим CSS стили в продакшен
			'app/css/main.min.css'
			])
	.pipe(gulp.dest('dist/css'))

	var buildHtml = gulp.src('app/*.html') // Переносим HTML в продакшен
	.pipe(gulp.dest('dist'));

	var buildJs = gulp.src('app/js/**/*') // Переносим скрипты в продакшен
	.pipe(gulp.dest('dist/js'))

});

gulp.task('build-inline', ['clean'], function() {

	var buildHtml = gulp.src('app/*.html') // Переносим HTML в продакшен
		.pipe(inlinesource())
		.pipe(gulp.dest('dist'));

});