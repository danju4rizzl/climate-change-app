const PORT = process.env.PORT || 8000;
const express = require('express');
const axios = require('axios').default;
const cheerio = require('cheerio');
const store = require('./store');
const app = express();

/**
 * @description: returns all the website to be scraped for data
 */
const globalWebsiteList = store;

const searchTerm = `a:contains(${'climate'})`;
const articles = [];

/**
 * @description: Used to validates the url we got back from the scraped website
 */
function validURLWithRegEx(siteURL) {
  let pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + //port
      '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  );
  const isUrlValid = pattern.test(siteURL);
  if (isUrlValid !== false || isUrlValid !== undefined) {
    return siteURL;
  }
}

globalWebsiteList.forEach((newSite) => {
  axios
    .get(newSite.link)

    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $(searchTerm, html).each(function () {
        const title = $(this).text();
        const url = $(this).attr('href');

        const checkedValidURL = validURLWithRegEx(url);
        const matchedUrl = globalWebsiteList.base
          ? globalWebsiteList.base + checkedValidURL
          : checkedValidURL;

        articles.push({
          title,
          url: matchedUrl,
          source: newSite.name,
        });
      });
    });
});

/**
 * @description: Will return a specific  article form a scraped website
 */
const handleSingleArticle = (req, res) => {
  const newsPaperId = req.params.newspaperId;

  const newsSiteLink = globalWebsiteList.filter(
    (link) => link.name == newsPaperId
  )[0].link;

  const newsSiteBase = globalWebsiteList.filter(
    (site) => site.name == newsPaperId
  )[0].base;

  axios
    .get(newsSiteLink)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      const specificArticle = [];

      $(searchTerm, html).each(function () {
        const title = $(this).text();
        const url = $(this).attr('href');

        specificArticle.push({
          title,
          url: newsSiteBase + url,
          source: newsPaperId,
        });
      });

      res.json(specificArticle);
    })
    .catch((err) => console.log(err));
};

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('/news', (req, res) => {
  // TODO fix in complete url not filtering correctly
  res.json(articles);
});

app.get('/news/:newspaperId', (req, res) => {
  handleSingleArticle(req, res);
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
