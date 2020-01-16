import getGithubApp from './lib/getGithubApp';

const GITHUB_OWNER = 'UrbanCompass';

export default async function getRateLimit(
  org = GITHUB_OWNER,
  pages = 100,
) {
  const github = await getGithubApp();

  const resp = await github.rateLimit.get();
  console.log(resp.data);
}

getRateLimit();
