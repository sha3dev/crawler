/**
 * imports: externals
 */

import Logger from "@sha3/logger";
import * as puppeteer from "puppeteer";

/**
 * imports: internals
 */

import Tab, { ColorScheme } from "./tab";

/**
 * module: initializations
 */

const logger = new Logger("crawler");

/**
 * types
 */

export type CrawlerOptions = {
  viewport?: puppeteer.Viewport;
  headers?: Record<string, string>;
  waitUntil?: puppeteer.PuppeteerLifeCycleEvent;
  userAgent?: string;
  navigatorProperties?: Record<string, any>;
  timeout?: number;
};

export type OpenOptions = {
  style?: string;
  viewport?: puppeteer.Viewport;
  headless?: boolean;
  preferredColorScheme?: ColorScheme;
  blockNotHeadlessContent?: boolean;
};

/**
 * consts
 */

const DEFAULT_PUPPETEER_ARGS = [
  "--no-sandbox",
  "--disable-web-security",
  "--allow-running-insecure-content",
  "--lang=en-US,en",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  // "--no-zygote",
  // "--single-process"
];

const DEFAULT_CRAWLER_OPTIONS: CrawlerOptions = {
  viewport: { width: 1440, height: 900 },
  timeout: 60000,
  waitUntil: "networkidle0",
};

/**
 * export
 */

export default class Crawler {
  /**
   * private: attributes
   */

  private options: CrawlerOptions;
  private browser: puppeteer.Browser | null = null;

  /**
   * private: methods
   */

  private async getBrowserInstance(headless?: boolean) {
    if (!this.browser) {
      logger.debug(`launching puppeteer instance`);
      this.browser = await puppeteer.launch({
        headless: !!headless,
        devtools: !headless,
        args: DEFAULT_PUPPETEER_ARGS,
      });
    }
    return this.browser;
  }

  /**
   * constructor
   */

  constructor(options?: CrawlerOptions) {
    logger.debug(`creating new crawler instance`);
    this.options = { ...DEFAULT_CRAWLER_OPTIONS, ...options };
  }

  /**
   * public : methods
   */

  public async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  public async open(url: string, options: OpenOptions = {}) {
    logger.debug(`openning new page: ${url}`);
    const { style, headless, preferredColorScheme: colorScheme } = options;
    const { headers, navigatorProperties, waitUntil, userAgent, timeout } =
      this.options;
    const viewport = options.viewport || this.options.viewport;
    const browserInstance = await this.getBrowserInstance(headless);
    const page = await browserInstance.newPage();
    if (colorScheme) {
      await Tab.setPreferredColorScheme(page, colorScheme);
    }
    await page.setViewport(viewport);
    if (headers) {
      await page.setExtraHTTPHeaders(headers);
    }
    if (navigatorProperties) {
      await page.evaluateOnNewDocument(() => {
        Object.keys(navigatorProperties).forEach((key) => {
          Object.defineProperty(navigator, key, {
            get: () => navigatorProperties[key],
          });
        });
      });
    }
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }
    if (options.blockNotHeadlessContent) {
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (
          req.resourceType() == "stylesheet" ||
          req.resourceType() == "font" ||
          req.resourceType() == "image"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }
    const gotoResponse = await page.goto(url, { waitUntil, timeout });
    if (style) {
      await page.addStyleTag({ content: style });
    }
    return new Tab({ url, page, gotoResponse, style, logger, colorScheme });
  }
}
