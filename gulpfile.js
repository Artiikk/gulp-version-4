const gulp = require('gulp');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-clean-css');
const babel = require('gulp-babel');
const webpack = require('webpack-stream');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const browserSync = require('browser-sync').create();

const src_folder = './app/';
const dist_folder = './dist/';
const dist_assets_folder = `${dist_folder}assets/`;
const node_modules_folder = './node_modules/';
const dist_node_modules_folder = `${dist_folder}node_modules/`;

const node_dependencies = Object.keys(require('./package.json').dependencies || {});

gulp.task('clear', () => del([dist_folder]));

gulp.task('html', () => gulp.src([`${src_folder}**/*.html`], {
    base: src_folder,
    since: gulp.lastRun('html')
  })
  .pipe(gulp.dest(dist_folder))
  .pipe(browserSync.stream())
);

gulp.task('scss', () => gulp.src([
    `${src_folder}css/**/*.scss`
  ], {
    since: gulp.lastRun('scss')
  })
  .pipe(sourcemaps.init())
  .pipe(plumber())
  .pipe(sass())
  .pipe(autoprefixer())
  .pipe(minifyCss())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(`${dist_assets_folder}css`))
  .pipe(browserSync.stream())
);

gulp.task('js', () => gulp.src([`${src_folder}js/main.js`], {
    since: gulp.lastRun('js')
  })
  .pipe(plumber())
  .pipe(webpack({
    mode: 'production'
  }))
  .pipe(sourcemaps.init())
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(concat('index.min.js'))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(`${dist_assets_folder}js`))
  .pipe(browserSync.stream())
);

gulp.task('images', () => gulp.src([`${src_folder}images/**/*.+(png|jpg|jpeg|gif|svg|ico)`], {
    since: gulp.lastRun('images')
  })
  .pipe(plumber())
  .pipe(imagemin())
  .pipe(gulp.dest(`${dist_assets_folder}images`))
  .pipe(browserSync.stream())
);

gulp.task('vendor', () => {
	if (node_dependencies.length === 0) {
		return new Promise((resolve) => {
			console.log('No dependencies specified');
			resolve();
		});
	}

	return gulp.src(node_dependencies.map(dependency => `${node_modules_folder + dependency}/**/*.*`), {
		base: node_modules_folder,
		since: gulp.lastRun('vendor')
	})
	.pipe(gulp.dest(dist_node_modules_folder))
	.pipe(browserSync.stream());
});

gulp.task('build', gulp.series('clear', 'html', 'scss', 'js', 'images', 'vendor'));
gulp.task('dev', gulp.series('html', 'scss', 'js'));
gulp.task('serve', () => browserSync.init({
  server: {
    baseDir: ['dist']
  },
  port: 3000,
  open: true,
}));

gulp.task('watch', () => {
	const watchImages = [
		`${src_folder}images/**/*.+(png|jpg|jpeg|gif|svg|ico)`
	];

	const watchVendor = [];

	node_dependencies.forEach(dependency => {
		watchVendor.push(`${node_modules_folder + dependency}/**/*.*`);
	});

	const watch = [
		`${src_folder}**/*.html`,
		`${src_folder}css/**/*.scss`,
		`${src_folder}js/**/*.js`
	];

	gulp.watch(watch, gulp.series('dev')).on('change', browserSync.reload);
	gulp.watch(watchImages, gulp.series('images')).on('change', browserSync.reload);
	gulp.watch(watchVendor, gulp.series('vendor')).on('change', browserSync.reload);
});

gulp.task('default', gulp.series('build', gulp.parallel('serve', 'watch')));
