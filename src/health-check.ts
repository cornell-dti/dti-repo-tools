import fetch from 'node-fetch';

const healthCheck = (url: string): Promise<boolean> =>
  fetch(url)
    .then(response => {
      const status = response.status;
      console.log(`Status of ${url} is ${status}.`);
      return status === 200;
    })
    .catch(error => {
      console.error(`Failed to fetch ${url}.`);
      console.error(`Error: ${error}`);
      return false;
    });

const url = process.argv[2];

if (!url) {
  console.log('URL is not passed in as the first argument of the program.');
  process.exit(1);
}

healthCheck(url).then(passed => {
  if (!passed) {
    process.exit(1);
  }
});
