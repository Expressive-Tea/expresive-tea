const { task, src } = require('gulp');
const clean = require('gulp-clean');

function cleanOutput() {
  return src(
    [
      '!gulpfile.js',
      '!tasks/*.js',
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
      '**/*.d.ts.map',
      '!(node_modules|docs|coverage)'
    ],
    {
      read: false
    }
  ).pipe(clean());
}

task('clean', cleanOutput);
