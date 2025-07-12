describe('About Page', () => {
  beforeEach(() => {
    cy.visit('/about');
  });

  it('should display the about page content', () => {
    cy.get('h1').should('contain', 'About Me');
    cy.get('p').should('exist');
  });
});
