const axios = require('axios');
const fs = require('fs');

const apiUrl = 'https://hyperhuman.deemos.com/api/task/cards';
const baseUrl = 'https://hyperhuman.deemos.com/rodin/';
const sitemapFile = 'sitemap.xml';

const requestData = {
    type: 'Featured',
    page_num: 0,
    task_type: 'Rodin',
    task_step: ['ModelGenerate', 'ModelRefine', 'TextureGenerate', 'TextureRefine']
};

async function fetchTasks(pageNum) {
    try {
        const response = await axios.post(apiUrl, { ...requestData, page_num: pageNum });
        return response.data;
    } catch (error) {
        console.error(`Error fetching page ${pageNum}:`, error);
        return [];
    }
}

async function collectAllTasks() {
    let allTasks = [];
    let pageNum = 0;
    let tasks;

    do {
        tasks = await fetchTasks(pageNum);
        allTasks = allTasks.concat(tasks);
        pageNum++;
    } while (tasks.length > 0);

    return allTasks;
}

function generateSitemap(urls) {
    const urlset = urls.map(url => `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>
  `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:mobile="http://www.baidu.com/schemas/sitemap-mobile/1/">
${urlset}
</urlset>`;
}

async function main() {
    const tasks = await collectAllTasks();
    const urls = tasks.map(task => ({
        loc: `${baseUrl}${task.task_uuid}`,
        lastmod: task.time,
        changefreq: 'yearly',
        priority: 0.6
    }));
    const sitemap = generateSitemap(urls);

    fs.writeFileSync(sitemapFile, sitemap, 'utf8');
    console.log(`Sitemap generated: ${sitemapFile}`);
}

main().catch(error => {
    console.error('Error:', error);
});
