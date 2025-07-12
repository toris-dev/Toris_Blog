describe('Contact Page', () => {
  beforeEach(() => {
    cy.visit('/contact');
  });

  it('should display the contact form', () => {
    cy.get('form').should('exist');
    cy.get('input[name="name"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('textarea[name="message"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('should show error messages for invalid submission', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.text-red-500').should('have.length.at.least', 1);
  });

  // Note: Actual form submission test would require mocking the API call
});
