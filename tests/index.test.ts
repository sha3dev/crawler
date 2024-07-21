/**
 * imports: externals
 */

import * as assert from "node:assert";
import { test } from "node:test";
import Crawler from "../dist";

/**
 * env init
 */

require("dotenv").config({ path: [".env", "../.env"] });

/**
 * consts
 */

const crawler = new Crawler();

/**
 * tests
 */

test("Test", async () => {
  const tab = await crawler.open(
    "https://www.notion.so/jc-ninja/The-Cupcakes-Newsletter-57773a2257a44e02945d338bcfcfb9e3"
  );
  const html = await tab.html();
  assert.ok(html.length);
});
