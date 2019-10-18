const {task, dest} = require('gulp');
const {createProject} = require('gulp-typescript');

const project = createProject('tsconfig.json');

function buildPackage() {
  return project
    .src()
    .pipe(project())
    .pipe(dest('./'));
}

task('build', () => buildPackage());
