describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the main heading and recent posts section', () => {
    cy.get('h1').should('contain', 'Recent Posts');
    cy.get('[data-cy="posts-list"]').should('exist');
  });

  it('should navigate to a post detail page', () => {
    cy.get('[data-cy="post-card"]').first().click();
    cy.url().should('include', '/posts/');
  });

  it('should display the header and footer', () => {
    cy.get('header').should('exist');
    cy.get('footer').should('exist');
  });

  it('should navigate to About page from header', () => {
    cy.get('[data-cy="header-about-link"]').click();
    cy.url().should('include', '/about');
  });

  it('should navigate to Contact page from header', () => {
    cy.get('[data-cy="header-contact-link"]').click();
    cy.url().should('include', '/contact');
  });

  it('should navigate to Posts page from header', () => {
    cy.get('[data-cy="header-posts-link"]').click();
    cy.url().should('include', '/posts');
  });
});