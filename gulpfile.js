const gulp = require('gulp');
// require('web-component-tester').gulp.init(gulp);
const wct = require('web-component-tester').test;
const notifier = require('node-notifier');

gulp.task('test-watch', function() {
  gulp.watch('{components,test}/**', function(done) {
    wct({plugins: {local: {}, sauce: false}}, function(error){
      if (error) {
        notifier.notify({
          'title': 'Build failed',
          'message': '' + error
        });
      }
      else {
        notifier.notify({'title': 'Build passed', 'message': 'Yay!'});
      }
    });
  });
});