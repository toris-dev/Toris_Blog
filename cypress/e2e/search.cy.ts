describe('Search Functionality', () => {
  beforeEach(() => {
    cy.visit('/posts'); // Assuming search is available on the posts page or a dedicated search component
  });

  it('should display the search input', () => {
    cy.get('[data-cy="search-input"]').should('exist');
  });

  it('should filter posts based on search query', () => {
    // Type a search query that should yield results
    cy.get('[data-cy="search-input"]').type('Next.js');
    cy.wait(500); // Wait for debounce
    cy.get('[data-cy="post-card"]').should('have.length.at.least', 1);
    cy.get('[data-cy="post-card"]').first().should('contain', 'Next.js');
  });

  it('should display no results message for an invalid search query', () => {
    // Type a search query that should yield no results
    cy.get('[data-cy="search-input"]').type('asdfghjkl12345');
    cy.wait(500); // Wait for debounce
    cy.get('[data-cy="posts-list"]').should('not.exist'); // Assuming the list disappears or shows a message
    cy.get('[data-cy="no-results-message"]').should('exist').and('contain', 'No posts found');
  });
});