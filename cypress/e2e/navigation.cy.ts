describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display header navigation links', () => {
    cy.get('[data-cy="header-home-link"]').should('exist');
    cy.get('[data-cy="header-posts-link"]').should('exist');
    cy.get('[data-cy="header-about-link"]').should('exist');
    cy.get('[data-cy="header-contact-link"]').should('exist');
  });

  it('should display footer navigation links', () => {
    cy.get('[data-cy="footer-about-link"]').should('exist');
    cy.get('[data-cy="footer-contact-link"]').should('exist');
  });

  it('should navigate to posts page', () => {
    cy.get('[data-cy="header-posts-link"]').click();
    cy.url().should('include', '/posts');
  });

  it('should navigate to about page', () => {
    cy.get('[data-cy="header-about-link"]').click();
    cy.url().should('include', '/about');
  });

  it('should navigate to contact page', () => {
    cy.get('[data-cy="header-contact-link"]').click();
    cy.url().should('include', '/contact');
  });
});