# Playwright with Allure Reporting Framework

This is a skeleton testing project using Playwright with Allure reporting integration.

## Getting Started

```bash
# Install dependencies
npm install

# Install Playwright
npx playwright install

# Run the tests
npm test

# Generate allure report
npx allure serve
```

## Project Structure

```
├── framework/      # Core framework components
│   └── pages/      # Page Object Models
|   └── components/ # Common components patterns 
├── data/           # Test data
|   └── files       # Test data files
|   └── types       # Test data types
├── steps/          # Functional step definitions
└── test/           # Test files

```

## Overview

### Page Objects (`framework/pages/`)

Use the Page Object Model (POM) pattern to define what is on a given page route. For simplicity you can treat pages as classes to group actions and locators for a given page

Example usage:
```typescript
async search(query: string): Promise<void> {
  await this.page.fill(this.searchInput, query);
  await this.page.press(this.searchInput, 'Enter');
}

async getSearchResults(): Promise<string> {
  return await this.page.searchResult.textContent()
}
```
### Components

Components represent reusable UI elements that appear across multiple pages. Unlike pages that model an entire route, components model distinct UI elements like navigation bars, search widgets, or modals that can be reused.

Example usage:
```typescript
// A reusable component for a search widget that appears on multiple pages
export class SearchComponent {
  private searchInput;
  private searchButton;
  
  constructor(private page: Page, private rootLocator?: string) {
    // Initialize locators with proper context
    const root = this.rootLocator ? this.page.locator(this.rootLocator) : this.page;
    this.searchInput = root.locator('input[type="search"]');
    this.searchButton = root.locator('button[type="submit"]');
  }
  
  async searchFor(term: string): Promise<void> {
    // Use the pre-defined locators
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }
  
  async getCurrentSearchTerm(): Promise<string> {
    return await this.searchInput.inputValue();
  }
}

// Using the component in a page object
export class DashboardPage {
  // Define the component as a property
  public readonly headerSearch: SearchComponent;
  
  constructor(page: Page) {
    super(page);
    // Initialize component with proper context
    this.headerSearch = new SearchComponent(page, 'header');
  }
  
  async searchFromHeader(term: string): Promise<void> {
    await this.headerSearch.searchFor(term);
  }
}
```

Components help maintain DRY principles by allowing you to:
- Encapsulate interactions with repeated UI elements
- Reduce duplication across page objects
- Create a building-block approach to testing complex interfaces
- Improve maintainability when the UI changes

### Test Data (`data/`)

Keep your data seperate from your tests to make everything as composable and reusable as possible. You can store this any way you'd like, but JSON and associated types and interfaces is probably the neatest way to handle this:

Example interface:
```typescript
export interface GoogleSearchData {
  name: string
  query: string;
  baseUrl?: string;
  expectedResult?: {
    urlSubstring: string;
    pageText: string | RegExp;
    pageTitle: string;
    element: string | Locator; 
  };
}
```
Your test data would then look like this:
```json
[
  {
    "name": "Playwright Site",
    "query": "Playwright end-to-end testing",
    "expectations": {
      "resultLinkContains": "playwright.dev",
      "pageTitleContains": "Playwright end-to-end testing - Google Search",
      "pageText": "Fast and reliable end-to-end testing for modern web apps",
      "elementVisible": "#search"
    }
  },
  {
    "name": "Typescript Site"
    "query": "TypeScript official website",
    "baseUrl": "https://www.google.ca",
    "expectations": {
      "resultLinkContains": "typescriptlang.org",
      "pageTitleContains": "TypeScript official website"
    }
  },
  {
    "name": "Generic"
    "query": "latest news on AI development"
  }
]
```

### Step Definitions (`steps/`)

Step definitions create reusable, composable testing steps with built-in Allure reporting:

Example:
```typescript
// Steps wrap page object methods with Allure reporting. This in turn makes your reporting nice and readable. 
export async function performGoogleSearch(page: Page, query: string): Promise<void> {
  await step(`Perform search for "${query}"`, async () => {
    const googleHomePage = new GoogleHomePage(page);
    await googleHomePage.open();
    await googleHomePage.waitForPageLoad();
    await googleHomePage.search(query);
  });
}
```

### Tests (`test/`)

Tests combine steps to create complete test scenarios. Pass in test data to these test cases to cover different permutations of the same test case. 

Example:
```typescript
const testcases = getTestCaseData('googleSearchData.json');

test.describe('Google Search Tests', () => {
  testCases.foreach(test: GoogleSearchInput{
    test(`User can perform a ${test.name} search`, async ({ page }) => {
      // Use the step functions to create a clean, readable test
      await performGoogleSearch(page, searchQueries.simple);
      
      const searchResults = await getSearchResults(page);
      expect(searchResults.length).toBeGreaterThan(0);
      
      const pageTitle = await getSearchPageTitle(page);
      expect(pageTitle).toContain(expectedResults.simple.title);
    });
  });
});
```

## Best Practices

1. **Page Objects & Components:**
  - Only contain methods to interact with that specific page or component
  - Return meaningful page data
  - Model the page to improve test readability and minimize complexity
  - Return specific errors related to that page or component

2. **Steps:**
  - Use page objects and components for simpler maintenance & better readability 
  - ALWAYS wrap in Allure steps method for better reporting
  - Use a functional approach instead of classes for nicer composition of TCs

3. **Tests:**
  - Should generally be E2E business processes. Anything smaller likely belongs elsewhere...
  - Use the data-driven approach for similar scenarios and better coverage
  - Avoid performing actions outside of methods unless incredibly test case specific

4. **Test Data:**
  - Keep data separate from tests
  - Structure data in types or interfaces for readability. Steal types from dev repos for simplicity
  - Type everything

## Allure Integration

This framework uses Allure for beautiful test reporting:

- Steps are automatically tracked in reports
- Screenshots are attached on failures
- Test metadata is displayed in the report

Run `npx allure serve` after tests to view the report.

## CI/CD Pipeline

This project includes a GitHub Actions workflow that automatically runs tests and generates Allure reports on every push and pull request to the main branch.

### Pipeline Steps

1. **Setup Environment**: Installs Node.js and sets up the build environment
2. **Install Dependencies**: Runs `npm ci` to install exact versions from package-lock.json
3. **Install Playwright**: Installs Playwright browsers and dependencies
4. **Run Tests**: Executes the test suite with `npm test`
5. **Save Results**: Uploads test results as artifacts for later analysis
6. **Generate Report**: Creates an Allure report from the test results
7. **Publish Report**: Deploys the report to GitHub Pages for easy access
8. **Link Report**: Adds a link to the report in the PR or commit status

### Accessing Reports

After the pipeline runs, you can access the Allure reports at:
```
https://{owner}.github.io/{repo}/{run-number}
```

For example:
```
https://yourusername.github.io/playwright-allure-skeleton/123
```

The reports are also stored and accessible via the GitHub Actions artifacts for each run, providing a historical view of test results over time.

## Setting Up GitHub Pages

For the CI/CD pipeline to publish Allure reports, you need to set up GitHub Pages with a `gh-pages` branch. Follow these steps to create the branch:

### Creating the gh-pages Branch

```bash
# Clone the repository (if you haven't already)
git clone https://github.com/yourusername/playwright-allure-skeleton.git
cd playwright-allure-skeleton

# Create an orphan branch (no history)
git checkout --orphan gh-pages

# Remove all files from staging
git rm -rf .

# Create an index file
echo "# Allure Reports" > index.md

# Add and commit the file
git add index.md
git commit -m "Initial gh-pages commit"

# Push to GitHub
git push origin gh-pages
```

### Configuring GitHub Pages
For reporting to work this way, Github Actions needs to be able to write to branches to update your Allure Report results. to do this:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Click on "actions
4. Under workflow permissions select "read and write permissions"
6. Click "Save"

After a few minutes, your GitHub Pages site will be available at `https://{Your Org Name}.github.io/playwright-allure-skeleton/`.

### Verifying Setup

After running your GitHub Actions workflow for the first time, you'll see the following:

1. A new directory structure in your gh-pages branch
2. Allure reports accessible at the URL pattern: `https://{Your Org Name}.github.io/playwright-allure-skeleton/{run-number}`
3. Status checks on PRs linking directly to the report for that specific run
