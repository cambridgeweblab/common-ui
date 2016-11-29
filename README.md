# common-ui
A collection of common web components.

# structure
## Components source
All components are located under /components along with their .css files.

## tests
We use web-component-tetser by polymer - https://github.com/Polymer/web-component-tester - get familiar with it. You will need to have Java on installed and on your path as it uses web driver.
All tests are self contained into [:component]-test.html. As we are using system.js and mocha, you will need to use the setup hook to import the component script. Just see any of the test files to get an idea.

To test run - npm test, if you need to keep the browser open, change the persistent flag to true in wct.conf.json.

## Adding submodules

cd in to your project directory

```$ cd /myproject```

Add the old weblab-common-ui submodule to the "app" directory

```$ git submodule add git@bitbucket.org:carepo/weblab-common-ui.git app/weblab-common-ui```

Add the new common-ui submodules to the "app" directory

```$ git submodule add git@github.com:cambridgeweblab/common-ui.git app/common-ui```

