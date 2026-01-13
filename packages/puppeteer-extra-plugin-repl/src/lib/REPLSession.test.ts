import { expect, test, vi } from 'vitest';

import REPLSession from './REPLSession.js';
import * as readline from './super-readline.js';

test('is a function', async () => {
  expect(typeof REPLSession).toBe('function');
});

test('is a class', async () => {
  expect(REPLSession.constructor.name).toBe('Function');
});

test('will throw without opts', async () => {
  expect(() => new REPLSession()).toThrow(
    'Expected argument to be of type `object` but received type `undefined`'
  );
});

test('will throw when opts.obj is not a class derivative', async () => {
  expect(() => new REPLSession({ obj: 'foobar' } as any)).toThrow(
    'Expected argument to be of type `object` but received type `string`'
  );
});

test('should have the expected class members', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);
  const prototype = Object.getPrototypeOf(instance);
  const childClassMembers = Object.getOwnPropertyNames(prototype);

  expect(childClassMembers.includes('constructor')).toBe(true);
  expect(childClassMembers.includes('extraMethods')).toBe(true);
  expect(childClassMembers.includes('start')).toBe(true);
  expect(childClassMembers.includes('_createInterface')).toBe(true);
  expect(childClassMembers.includes('_showIntro')).toBe(true);
  expect(childClassMembers.includes('_onLineInput')).toBe(true);
  expect(childClassMembers.includes('_evalAsync')).toBe(true);
  expect(childClassMembers.length).toBe(7);
});

test('extraMethods returns expected array', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);
  expect(instance.extraMethods).toEqual(['inspect', 'exit']);
});

test('_evalAsync evaluates simple expressions', async () => {
  const FakeClass = class Foo {
    value = 42;
  };
  const obj = new FakeClass();
  const opts = { obj };
  const instance = new REPLSession(opts);

  // Test evaluating a property access
  await instance._evalAsync('this._obj.value');
  // The method logs the result, we just verify it doesn't throw
});

test('_evalAsync handles errors gracefully', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  // Test evaluating invalid code
  await instance._evalAsync('this._obj.nonexistent.property');
  // The method logs the error, we just verify it doesn't throw
});

test('constructor initializes _meta correctly', async () => {
  const FakeClass = class Foo {
    method1() {}
    method2() {}
  };
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  expect((instance as any)._meta.name).toBe('Foo');
  expect((instance as any)._meta.type).toBe('object');
  expect(Array.isArray((instance as any)._meta.members)).toBe(true);
});

test('constructor initializes _completions with extra methods and members', async () => {
  const FakeClass = class Foo {
    method1() {}
  };
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  expect((instance as any)._completions.includes('inspect')).toBe(true);
  expect((instance as any)._completions.includes('exit')).toBe(true);
});

test('_createInterface creates readline interface with correct options', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const createInterfaceSpy = vi.spyOn(readline, 'createInterface');

  (instance as any)._createInterface();

  expect(createInterfaceSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      input: process.stdin,
      output: process.stdout,
    })
  );

  createInterfaceSpy.mockRestore();
});

test('_showIntro displays welcome message', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // Create a mock readline interface first
  (instance as any)._rl = {
    showTabCompletions: vi.fn(),
  };

  (instance as any)._showIntro();

  expect(consoleLogSpy).toHaveBeenCalled();
  expect((instance as any)._rl.showTabCompletions).toHaveBeenCalled();

  consoleLogSpy.mockRestore();
});

test('_onLineInput handles empty input', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const promptFn = vi.fn();
  (instance as any)._rl = { prompt: promptFn };

  await (instance as any)._onLineInput('');

  expect(promptFn).toHaveBeenCalled();
});

test('_onLineInput handles exit command', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const closeFn = vi.fn();
  (instance as any)._rl = { close: closeFn };

  await (instance as any)._onLineInput('exit');

  expect(closeFn).toHaveBeenCalled();
});

test('_onLineInput handles inspect command', async () => {
  const FakeClass = class Foo {
    value = 42;
  };
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const promptFn = vi.fn();
  const evalAsyncSpy = vi
    .spyOn(instance as any, '_evalAsync')
    .mockResolvedValue(undefined);
  (instance as any)._rl = { prompt: promptFn };

  await (instance as any)._onLineInput('inspect');

  expect(evalAsyncSpy).toHaveBeenCalledWith((instance as any)._obj);
  expect(promptFn).toHaveBeenCalled();

  evalAsyncSpy.mockRestore();
});

test('_onLineInput handles normal commands', async () => {
  const FakeClass = class Foo {
    method1() {
      return 'result';
    }
  };
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  const promptFn = vi.fn();
  const evalAsyncSpy = vi
    .spyOn(instance as any, '_evalAsync')
    .mockResolvedValue(undefined);
  (instance as any)._rl = { prompt: promptFn };

  await (instance as any)._onLineInput('method1()');

  expect(evalAsyncSpy).toHaveBeenCalledWith('this._obj.method1()');
  expect(promptFn).toHaveBeenCalled();

  evalAsyncSpy.mockRestore();
});

test('start() method initializes REPL session', async () => {
  const FakeClass = class Foo {};
  const opts = { obj: new FakeClass() };
  const instance = new REPLSession(opts);

  // Mock the internal methods
  const createInterfaceSpy = vi
    .spyOn(instance as any, '_createInterface')
    .mockImplementation(() => {
      (instance as any)._rl = {
        prompt: vi.fn(),
        on: vi.fn(),
        once: vi.fn((_event, callback) => {
          // Immediately trigger close event for test
          setTimeout(() => callback(), 0);
        }),
      };
      (instance as any)._closePromise = Promise.resolve();
    });
  const showIntroSpy = vi
    .spyOn(instance as any, '_showIntro')
    .mockImplementation(() => {});

  const promise = instance.start();
  await promise;

  expect(createInterfaceSpy).toHaveBeenCalled();
  expect(showIntroSpy).toHaveBeenCalled();
  expect((instance as any)._rl.prompt).toHaveBeenCalled();

  createInterfaceSpy.mockRestore();
  showIntroSpy.mockRestore();
});
