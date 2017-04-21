(function(top) {
    const registry = {};

    async function require(...dependencies) {
        return Promise.all(dependencies.map(dependency =>
                new Promise((resolve, reject) => {
                    if (registry[dependency]) {
                        resolve(registry[dependency]);
                    } else {
                        const link = document.createElement('link');
                        link.setAttribute('rel', 'import');
                        link.setAttribute('href', `../components/helpers/${dependency}.html`);
                        link.addEventListener('load', function(e) {
                            const importedDoc = link.import;
                            // importedDoc points to the document of the imported script
                            resolve(registry[dependency]);
                        });
                        document.body.appendChild(link);
                    }
                })
        ));
    }

    async function define(name, dependencies, fn) {
        const deps = await Promise.all(dependencies.map(require));
        registry[name] = fn(...deps);
    }

    top.require = require;
    top.define = define;
})(window);

