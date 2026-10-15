require('dotenv').config();
const { scrapeProfile, scrapeRecentPosts } = require('./scraper/facebookProfile');

(async () => {
  const username = 'zahidkhan.kakar.5';
  console.log('START_FETCH_FOR', username);

  try {
    const profile = await scrapeProfile(username);
    console.log('PROFILE_RESULT');
    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.log('PROFILE_ERROR');
    console.log(error && error.stack ? error.stack : String(error));
  }

  try {
    const posts = await scrapeRecentPosts(username, 3);
    console.log('POSTS_RESULT');
    console.log(JSON.stringify(posts, null, 2));
  } catch (error) {
    console.log('POSTS_ERROR');
    console.log(error && error.stack ? error.stack : String(error));
  }
})();
