/**
 * Cache tag for the derived resource counts (downloads/comments/loves)
 * computed in the resources listing API. Write routes revalidate this tag so
 * counters stay fresh without re-running full-collection aggregations on read.
 */
export const RESOURCE_COUNTS_TAG = "resource-counts";
