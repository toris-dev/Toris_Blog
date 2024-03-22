describe('홈페이지 테스트', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('사이드바 테스트', () => {
    cy.get('[data-cy="sidebarToggle"]').click();

    cy.contains('홈');
    cy.contains('태그');
    cy.get('[data-cy="githubLink"]').should(
      'have.attr',
      'href',
      'https://github.com/toris-dev'
    );
  });

  it('어드민', () => {
    cy.get('[data-cy="adminLink"]').click();
    cy.url().should('include', '/admin');
    cy.get('[data-cy="writeLink"]').click();
    cy.url().should('not.be.a', '/write');
  });

  it('챗봇 페이지 이동', () => {
    cy.get('[data-cy="chatbotLink"]').click();
    cy.url().should('include', '/search');
  });
  it('글 목록', () => {
    cy.get('a[href*="/posts/"]').first().click();
    cy.url().should('include', '/posts/');
  });

  it('푸터', () => {
    cy.contains('ABOUT ME');
    cy.contains('Full-Stack-Engineer Toris');
  });
});
