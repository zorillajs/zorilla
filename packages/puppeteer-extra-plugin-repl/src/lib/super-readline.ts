import {
  clearLine,
  clearScreenDown,
  cursorTo,
  emitKeypressEvents,
  Interface,
  moveCursor,
  type ReadLineOptions,
} from 'node:readline';
import chalk from 'chalk';

// Extend Interface to include private methods we need to access
interface ExtendedInterface extends Interface {
  _tabComplete(lastKeypressWasTab: boolean): void;
  _writeToOutput(stringToWrite: string): void;
  _prompt: string;
}

interface SuperInterfaceOptions extends ReadLineOptions {
  colors?: {
    prompt?: (str: string) => string;
    completer?: (str: string) => string;
  };
}

/**
 * Extends the native readline interface with color support.
 *
 * A drop-in replacement for `readline`.
 *
 * Additionally accepts an options.color object with chalk colors
 * for `prompt` and `completer`.
 *
 * @todo this could be enhanced with auto complete hints in grey.
 * @todo similar to this: https://github.com/aantthony/node-color-readline
 *
 * @ignore
 *
 * @example
 * const readline = require('./super-readline')
 *
 * const rl = readline.createInterface({
 *   input: process.stdin,
 *   output: process.stdout,
 *   prompt: '> ',
 *   completer: readline.defaultCompleter([ 'bob', 'yolk' ]),
 *   colors: {
 *     prompt: readline.chalk.cyan,
 *     completer: readline.chalk.yellow
 *   }
 * })
 *
 * rl.prompt()
 */
class SuperInterface extends Interface implements ExtendedInterface {
  private _colors: SuperInterfaceOptions['colors'];
  private _writingTabComplete = false;
  _prompt!: string;

  constructor(options: SuperInterfaceOptions) {
    super(options);
    this._colors = options.colors || {};
  }

  _tabComplete(lastKeypressWasTab: boolean): void {
    this._writingTabComplete = true;
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private Node.js readline API
    (Interface.prototype as any)._tabComplete.call(this, lastKeypressWasTab);
    this._writingTabComplete = false;
  }

  showTabCompletions(): void {
    this._tabComplete(true);
  }

  _writeToOutput(stringToWrite: string): void {
    // colorize prompt itself
    const startsWithPrompt = stringToWrite.startsWith(this._prompt);
    if (this._colors?.prompt && startsWithPrompt) {
      stringToWrite = `${this._colors.prompt(
        this._prompt
      )}${stringToWrite.replace(this._prompt, '')}`;
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private Node.js readline API
      (Interface.prototype as any)._writeToOutput.call(this, stringToWrite);
      return;
    }
    // colorize completer output
    if (this._colors?.completer && this._writingTabComplete) {
      // biome-ignore lint/suspicious/noExplicitAny: Accessing private Node.js readline API
      (Interface.prototype as any)._writeToOutput.call(
        this,
        this._colors.completer(stringToWrite)
      );
      return;
    }
    // anything else
    // biome-ignore lint/suspicious/noExplicitAny: Accessing private Node.js readline API
    (Interface.prototype as any)._writeToOutput.call(this, stringToWrite);
  }
}

const createSuperInterface = (options: SuperInterfaceOptions): SuperInterface =>
  new SuperInterface(options);

/**
 * A typical default completer that can be used, for convenience.
 *
 * @ignore
 */
const defaultCompleter =
  (completions: string[]) =>
  (line: string): [string[], string] => {
    const hits = completions.filter(c => c.startsWith(line));
    // show all completions if none found
    const arr = hits.length ? hits : completions;
    return [arr, line];
  };

export {
  // customized exports:
  chalk,
  SuperInterface as Interface,
  createSuperInterface as createInterface,
  defaultCompleter,
  // default readline exports:
  clearLine,
  clearScreenDown,
  cursorTo,
  emitKeypressEvents,
  moveCursor,
};
