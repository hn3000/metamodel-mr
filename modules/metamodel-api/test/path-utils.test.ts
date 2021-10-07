import { TestClass } from "@hn3000/tsunit-async";
import { combine2Paths, combinePaths } from "../src/path-utils";

export class PathUtilsTest extends TestClass {
  testCombine2PathsBothHaveSlashes() {
    let result = combine2Paths('a/', '/b');
    this.areIdentical('a/b', result);
  }
  testCombine2PathsNoneHaveSlashes() {
    let result = combine2Paths('a', 'b');
    this.areIdentical('a/b', result);
  }
  testCombine2PathsFirstHasSlash() {
    let result = combine2Paths('a/', 'b');
    this.areIdentical('a/b', result);
  }
  testCombine2PathsSecondHasSlash() {
    let result = combine2Paths('a', '/b');
    this.areIdentical('a/b', result);
  }
  testCombinePaths() {
    let result = combinePaths('a/', '/b','c','/d/','e');
    this.areIdentical('a/b/c/d/e', result);
  }
}