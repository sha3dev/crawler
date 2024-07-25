/**
 * imports: externals
 */

import Logger from "@sha3/logger";
import * as puppeteer from "puppeteer";
import { JSDOM } from "jsdom";
import sharp from "sharp";

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

  public async evaluate(...args: Parameters<puppeteer.Page["evaluate"]>) {
    this.logger.debug(`evalueting JS code`);
    const { page } = this.options;
    const result = await page.evaluate(...args);
    return result;
  }

  public async addStyle(style: string) {
    const { page } = this.options;
    this.logger.debug(`adding style`);
    const result = await page.addStyleTag({ content: style });
    return result;
  }

  public async setViewport(
    viewport: TabViewport,
    options?: { waitInMs?: number }
  ) {
    this.logger.debug(`setting viewport: ${JSON.stringify(viewport)}`);
    const { page } = this.options;
    await page.setViewport(viewport);
    if (options?.waitInMs) {
      await new Promise((resolve) => setTimeout(resolve, options?.waitInMs));
    }
  }

  public async querySelectorAll<T extends HTMLElement>(selector: string) {
    this.logger.debug(`queryng elements: ${selector}`);
    const { page } = this.options;
    const elems = await page.$$(selector);
    return elems as puppeteer.ElementHandle<T>[];
  }

  public async getImage(selector: string, options?: GetImageOptions) {
    const { page } = this.options;
    const elems = await page.$$(selector);
    const imageElem = elems[0];
    if (imageElem) {
      const imageBuffer = await imageElem.screenshot({ omitBackground: true });
      let sharpInstance = sharp(imageBuffer);
      if (options?.trim) {
        sharpInstance = sharpInstance.trim();
      }
      if (options?.background) {
        sharpInstance = sharpInstance.flatten({
          background: options.background,
        });
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
