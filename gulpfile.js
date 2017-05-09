/*
    Ignoring the import/no-extraneous-dependencies rule for now since this file should be killed shortly when
    chrome headless is rolled into WCT and released properly.
*/
const gulp = require('gulp'); // eslint-disable-line import/no-extraneous-dependencies
const wct = require('web-component-tester').test; // eslint-disable-line import/no-extraneous-dependencies
const notifier = require('node-notifier'); // eslint-disable-line import/no-extraneous-dependencies

gulp.task('test-watch', () => {
    gulp.watch('{components,test}/**', (done) => {
        wct({ plugins: { local: {}, sauce: false } }, (error) => {
            if (error) {
                notifier.notify({
                    title: 'Build failed',
                    message: `${error}`
                });
            } else {
                notifier.notify({ title: 'Build passed', message: 'Yay!' });
            }
        });
    });
});
