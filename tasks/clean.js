const { task, src } = require('gulp');
const clean = require('gulp-clean');

function cleanOutput() {
  return src(
    [
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
      '**/*.d.ts.map',
      '!node_modules/**/*',
      '!docs/**/*',
      '!coverage/**/*',
      '!gulpfile.js',
      '!tasks/*.js',
      '!jest.config.js'
    ],
    {
      read: false
    }
  ).pipe(clean());
}

task('clean', cleanOutput);
