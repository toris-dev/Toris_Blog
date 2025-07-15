// 블로그 게시글 관련 테스트

describe('블로그 게시글', () => {
  it('게시글 목록 페이지에 게시글 리스트가 보여야 한다', () => {
    cy.visit('/posts');
    cy.get('[data-cy="posts-list"]').should('exist');
    cy.get('[data-cy="post-card"]').should('have.length.at.least', 1);
  });

  it('게시글 카드를 클릭하면 상세 페이지로 이동하고, 내용이 보여야 한다', () => {
    cy.visit('/posts');
    cy.get('[data-cy="post-card"]').first().click();
    cy.url().should('include', '/posts/');
    cy.get('[data-cy="post-title"]').should('exist');
    cy.get('[data-cy="post-content"]').should('exist');
  });
});
