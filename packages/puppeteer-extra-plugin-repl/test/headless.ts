import { beforeEach, test } from 'vitest';

// const PUPPETEER_ARGS = ['--no-sandbox', '--disable-setuid-sandbox']

beforeEach(() => {
  // Make sure we work with pristine modules
  // delete require.cache[require.resolve('puppeteer-extra')]
  // delete require.cache[require.resolve('puppeteer-extra-plugin-repl')]
});

test('will create a repl', async () => {
  // @TODO: This test is a little brittle and fails in CI sometimes.
  // const stdin = require('mock-stdin').stdin()
  // const puppeteer = require('@zorilla/puppeteer-extra')
  // const repl = require('@zorilla/puppeteer-extra-plugin-repl')()
  // puppeteer.use(repl)
  // await puppeteer.launch({ args: PUPPETEER_ARGS }).then(async browser => {
  //   const page = await browser.newPage()
  //   // Mock stdout, there might be cleaner ways to do this :-)
  //   let stdoutOutput = ''
  //   const origStdout = process.stdout.write
  //   process.stdout.write = (string, encoding, fd) => { stdoutOutput += string }
  //   await Promise.all([
  //     page.repl(),
  //     stdin.send('url()'),
  //     stdin.end()
  //   ])
  //   process.stdout.write = origStdout
  //   expect(stdoutOutput.includes(`Started puppeteer-extra repl for object 'Page' with`)).toBe(true)
  //   expect(stdoutOutput.includes(`> page.`)).toBe(true)
  //   expect(stdoutOutput.includes(`url()`)).toBe(true)
  //   expect(stdoutOutput.includes(`about:blank`)).toBe(true)
  //   browser.close()
  // })
  // expect(true).toBe(true)
});
