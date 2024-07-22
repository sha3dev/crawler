/**
 * imports: externals
 */

import Logger from "@sha3/logger";
import * as puppeteer from "puppeteer";
import { JSDOM } from "jsdom";
import * as sharp from "sharp";

/**
 * imports: internals
 */

/**
 * types
 */

export type TabOptions = {
  logger: Logger;
  url: string;
  page: puppeteer.Page;
  gotoResponse: puppeteer.HTTPResponse;
};

/**
 * consts
 */

/**
 * types
 */

export type TabViewport = { width: number; height: number };

export type FunctionToExec = (window: Window) => any;

export type GetImageOptions = { trim?: boolean; background?: string };

/**
 * export
 */

export default class Tab {
  /**
   * private: attributes
   */

  private logger: Logger;

  /**
   * private: methods
   */

  /**
   * constructor
   */

  constructor(private options: TabOptions) {
    this.logger = options.logger;
  }

  /**
   * public: properties
   */

  public get Viewport(): TabViewport {
    const { page } = this.options;
    const viewport = page.viewport();
    return { width: viewport.width, height: viewport.height };
  }

  /**
   * public : methods
   */

  public async close() {
    const { page } = this.options;
    await page.close();
  }

  public async wait(options: {
    functionToExec: FunctionToExec;
    timeout: number;
  }) {
    const { page } = this.options;
    const { functionToExec, timeout } = options;
    this.logger.debug(`waiting for function ${timeout}ms`);
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    const result = await page.waitForFunction(wrappedFunction, { timeout });
    return result;
  }

  public async html() {
    const { page } = this.options;
    this.logger.debug(`loading HTML from page`);
    const result = await page.evaluate(
      `(() => document.documentElement.innerHTML)()`
    );
    return result as string;
  }

  public async exec(functionToExec: FunctionToExec) {
    const { page } = this.options;
    this.logger.debug(`executing function`);
    const wrappedFunction = `((${functionToExec.toString()})(window))`;
    const result = await page.evaluate(wrappedFunction);
    return result;
  }

  public async evaluate(code: string) {
    this.logger.debug(`evalueting JS code`);
    const { page } = this.options;
    const result = await page.evaluate(code);
    return result;
  }

  public async addStyle(style: string) {
    const { page } = this.options;
    this.logger.debug(`adding style`);
    await page.addStyleTag({ content: style });
  }

  public async setViewport(viewport: TabViewport) {
    this.logger.debug(`setting viewport: ${JSON.stringify(viewport)}`);
    const { page } = this.options;
    await page.setViewport(viewport);
  }

  public async querySelectorAll<T>(selector: string) {
    this.logger.debug(`queryng elements: ${selector}`);
    const { page } = this.options;
    const elems = await page.$$(selector);
    return elems as T[];
  }

  public async getImage(selector: string, options: GetImageOptions) {
    const { page } = this.options;
    const { trim, background } = options;
    const elems = await page.$$(selector);
    const imageElem = elems[0];
    if (imageElem) {
      const imageBuffer = await imageElem.screenshot({ omitBackground: true });
      let sharpInstance = sharp(imageBuffer);
      if (trim) {
        sharpInstance = sharpInstance.trim();
      }
      if (background) {
        sharpInstance = sharpInstance.flatten({ background });
      }
      const buffer = await sharpInstance.toBuffer();
      return buffer;
    }
  }

  public async toDOM() {
    this.logger.debug(`obtaining DOM from HTML`);
    const html = await this.html();
    const { document } = new JSDOM(html).window;
    return document;
  }
}
