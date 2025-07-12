describe('Blog Posts', () => {
  it('should display a list of posts on the posts page', () => {
    cy.visit('/posts');
    cy.get('[data-cy="posts-list"]').should('exist');
    cy.get('[data-cy="post-card"]').should('have.length.at.least', 1);
  });

  it('should navigate to a post detail page and display its content', () => {
    cy.visit('/posts');
    cy.get('[data-cy="post-card"]').first().click();
    cy.url().should('include', '/posts/');
    cy.get('[data-cy="post-title"]').should('exist');
    cy.get('[data-cy="post-content"]').should('exist');
  });
});