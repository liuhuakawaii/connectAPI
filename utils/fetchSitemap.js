const axios = require('axios');
const xml2js = require('xml2js');
const ProgressBar = require('progress');
const pLimit = require('p-limit');

const readSitemap = async (sitemapUrl) => {
    const response = await axios.get(sitemapUrl);
    const sitemapContent = response.data;
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(sitemapContent);
    return result.urlset.url.map(entry => entry.loc[0]);
};

const fetchLink = async (url, retries = 10, delay = 3000) => {
    const delayExecution = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
                }
            });
            console.log(`Fetched ${url}: ${response.status}`);
            return; // Exit the function if the request is successful
        } catch (error) {
            console.error(`Error fetching ${url} (attempt ${attempt}): ${error.message}`);
            if (attempt === retries) {
                console.error(`Failed to fetch ${url} after ${retries} attempts`);
            } else {
                await delayExecution(delay);
            }
        }
    }
};


const fetchSitemapLinks = async (sitemapUrl) => {
    const links = await readSitemap(sitemapUrl);
    const bar = new ProgressBar('Fetching [:bar] :current/:total :percent :etas', {
        total: links.length,
        width: 40,
    });

    const limit = pLimit(2);

    const fetchPromises = links.map(link =>
        limit(async () => {
            await fetchLink(link);
            bar.tick();
        })
    );

    await Promise.all(fetchPromises);
};

const sitemapUrl = 'https://hyperhuman.deemos.com/models.sitemap.xml';
fetchSitemapLinks(sitemapUrl)
    .then(() => console.log('All links fetched'))
    .catch(error => console.error(`Error: ${error.message}`));
