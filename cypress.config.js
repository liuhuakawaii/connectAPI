const {defineConfig} = require('cypress');
const {beforeRunHook, afterRunHook} = require('cypress-mochawesome-reporter/lib');

module.exports = defineConfig({
    reporter: 'cypress-mochawesome-reporter',
    reporterOptions: {
        charts: true,
        reportPageTitle: 'Hyperhuman Test Report',
        embeddedScreenshots: true,
        inlineAssets: true,
        saveAllAttempts: false,
        videoOnFailOnly: false,
    },
    e2e: {
        baseUrl: 'http://localhost:3000',
        setupNodeEvents(on, config) {
            on('before:run', async (details) => {
                await beforeRunHook(details);
            });

            on('after:run', async () => {
                await afterRunHook();
            });
        },
    },
    viewportWidth: 1280,
    viewportHeight: 800,
});
