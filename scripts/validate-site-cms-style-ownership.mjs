import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const rootApp = read('apps/web/src/RootApplication.tsx');
const siteCmsApp = read('apps/web/src/modules/site-cms/SiteCmsApp.tsx');
const productCssPath = 'apps/web/src/modules/site-cms/site-cms-product.css';
const siteCmsProduct = read(productCssPath);
const legacyUiSystem = 'apps/web/src/styles/ui-system.css';
const legacyProductRefinement = 'apps/web/src/styles/product-refinement.css';

const cmsStyleImports = [
  "import './site-cms-base.css';",
  "import './site-cms-editor.css';",
  "import './site-cms-responsive.css';",
  "import './site-cms-product.css';",
];
let previousIndex = -1;
for (const styleImport of cmsStyleImports) {
  const index = siteCmsApp.indexOf(styleImport);
  assert(index > previousIndex, `Site CMS stylesheet order changed or import is missing: ${styleImport}`);
  previousIndex = index;
}

const siteCmsLoaderStart = rootApp.indexOf('const SiteCmsApp = lazy');
const siteCmsLoaderEnd = rootApp.indexOf('const TasksApp', siteCmsLoaderStart);
const siteCmsLoader = siteCmsLoaderStart >= 0 && siteCmsLoaderEnd > siteCmsLoaderStart
  ? rootApp.slice(siteCmsLoaderStart, siteCmsLoaderEnd)
  : '';

assert(Boolean(siteCmsLoader), 'Site CMS lazy loader is missing');
assert(siteCmsLoader.includes("await import('./styles/sidebar-v2.css');"), 'Site CMS must keep the shared sidebar contract loaded after module styles');
assert(!siteCmsLoader.includes('ui-system.css'), 'Site CMS must not reload the removed legacy UI system');
assert(!siteCmsLoader.includes('product-refinement.css'), 'Site CMS must not reload the removed global product refinement');
assert(existsSync(resolve(root, productCssPath)), 'Canonical Site CMS product refinement is missing');
assert(!existsSync(resolve(root, legacyUiSystem)), 'Legacy ui-system.css must stay removed');
assert(!existsSync(resolve(root, legacyProductRefinement)), 'Legacy product-refinement.css must stay removed');
assert(siteCmsProduct.includes('canonical Site CMS product refinement'), 'Site CMS product refinement ownership marker is missing');
assert(siteCmsProduct.includes('--product-border:#dfe3e8'), 'Site CMS product tokens are incomplete');
assert(siteCmsProduct.includes('.site-cms-topbar'), 'Site CMS topbar refinement is missing');
assert(siteCmsProduct.includes('.site-cms-modal'), 'Site CMS modal refinement is missing');
assert(!siteCmsProduct.includes('.crm-global-page'), 'Site CMS product stylesheet must not contain CRM page selectors');
assert(!siteCmsProduct.includes('.crm-sidebar'), 'Site CMS product stylesheet must not contain CRM sidebar selectors');

if (failures.length) {
  console.error('Site CMS style ownership validation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Site CMS style ownership validation passed.');
