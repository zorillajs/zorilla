import { expect, test } from 'vitest';

import * as readline from './super-readline.js';

test('is an object', async () => {
  expect(typeof readline).toBe('object');
});

test('should have the expected number of exports', async () => {
  const exportedKeys = Object.keys(readline);

  expect(exportedKeys.includes('chalk')).toBe(true);
  expect(exportedKeys.includes('Interface')).toBe(true);
  expect(exportedKeys.includes('createInterface')).toBe(true);
  expect(exportedKeys.includes('defaultCompleter')).toBe(true);
  expect(exportedKeys.includes('clearLine')).toBe(true);
  expect(exportedKeys.includes('clearScreenDown')).toBe(true);
  expect(exportedKeys.includes('cursorTo')).toBe(true);
  expect(exportedKeys.includes('emitKeypressEvents')).toBe(true);
  expect(exportedKeys.includes('moveCursor')).toBe(true);
  expect(exportedKeys.length).toBe(9);
});

test('can create an interface', async () => {
  const instance = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: readline.defaultCompleter(['bob', 'yolk']),
    colors: {
      prompt: readline.chalk.cyan,
      completer: readline.chalk.yellow,
    },
  });
  expect(instance.constructor.name).toBe('SuperInterface');
  expect(typeof instance).toBe('object');
});

test('should have the extended class members', async () => {
  const instance = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    completer: readline.defaultCompleter(['bob', 'yolk']),
    colors: {
      prompt: readline.chalk.cyan,
      completer: readline.chalk.yellow,
    },
  });
  const prototype = Object.getPrototypeOf(instance);
  const childClassMembers = Object.getOwnPropertyNames(prototype);

  expect(childClassMembers.includes('constructor')).toBe(true);
  expect(childClassMembers.includes('_tabComplete')).toBe(true);
  expect(childClassMembers.includes('_writeToOutput')).toBe(true);
  expect(childClassMembers.includes('showTabCompletions')).toBe(true);
});

test('defaultCompleter returns matching completions', async () => {
  const completer = readline.defaultCompleter(['bob', 'bobby', 'yolk']);
  const [completions, line] = completer('bo');
  expect(completions).toEqual(['bob', 'bobby']);
  expect(line).toBe('bo');
});

test('defaultCompleter returns all completions when no match', async () => {
  const completer = readline.defaultCompleter(['bob', 'bobby', 'yolk']);
  const [completions, line] = completer('xyz');
  expect(completions).toEqual(['bob', 'bobby', 'yolk']);
  expect(line).toBe('xyz');
});

test('defaultCompleter returns all completions for empty line', async () => {
  const completer = readline.defaultCompleter(['bob', 'bobby', 'yolk']);
  const [completions, line] = completer('');
  expect(completions).toEqual(['bob', 'bobby', 'yolk']);
  expect(line).toBe('');
});
