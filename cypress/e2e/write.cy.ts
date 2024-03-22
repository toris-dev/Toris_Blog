describe('글쓰기 페이지 테스트', () => {
  beforeEach(() => {
    cy.visit('/admin');
    cy.get('input[type="text"]').type('test@test.com');
    cy.get('input[type="password"]').type('1q2w3e4r!');
    cy.get('button[type="submit"]').click();
    cy.contains('글 쓰러 가기').click();
    cy.url().should('include', '/write');
  });
  it('글쓰기', () => {
    cy.get('input[placeholder="제목"').type('테스트');
    cy.get('input#category').type('Test{enter}');
    cy.get('input#tags').type('Test{enter}');
    cy.get('textarea').type('테스트 본문 애용');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/posts/');
  });

  afterEach(() => {
    cy.visit('/admin');
    cy.contains('테스트 글 삭제').click();
    cy.clearAllCookies();
  });
});
