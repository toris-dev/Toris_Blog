import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// 다양한 파일명 패턴을 처리하기 위한 유틸리티 함수
const findFileBySlug = (files: string[], slug: string) => {
  // 케이스 1: "slug.md" 형태
  const exactMatch = files.find((file) => file === `${slug}.md`);
  if (exactMatch) return exactMatch;

  // 케이스 2: "anything-slug.md" 형태
  const hyphenMatch = files.find((file) => {
    const filePattern = new RegExp(`^.*-${slug}\\.md$`);
    return filePattern.test(file);
  });
  if (hyphenMatch) return hyphenMatch;

  // 케이스 3: 파일명에 slug가 포함된 경우 (위에서 정확히 매칭되지 않은 경우)
  const partialMatch = files.find((file) => {
    // .md 확장자 제거
    const nameWithoutExt = file.replace(/\.md$/, '');
    // slug가 파일명에 포함되어 있는지 확인 (대소문자 구분 없이)
    return nameWithoutExt.toLowerCase().includes(slug.toLowerCase());
  });

  return partialMatch;
};

// 게시글 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions);

    // GitHub 계정이 toris-dev인 경우에만 수정 허용
    if (!session || !session.user || session.user.login !== 'toris-dev') {
      return NextResponse.json(
        { error: '관리자만 게시글을 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 요청 바디에서 데이터 파싱
    const { content, fileName } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '게시글 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 파일 경로 구성
    const postsDirectory = path.join(process.cwd(), 'public/markdown');

    let filePath;

    // fileName이 제공된 경우 해당 파일 사용
    if (fileName) {
      filePath = path.join(postsDirectory, fileName);
    }
    // fileName이 없는 경우 slug로 파일 찾기
    else {
      const files = fs.readdirSync(postsDirectory);
      const targetFile = findFileBySlug(files, params.slug);

      if (!targetFile) {
        return NextResponse.json(
          { error: '수정할 게시글 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      filePath = path.join(postsDirectory, targetFile);
    }

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '수정할 게시글 파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 내용 업데이트
    fs.writeFileSync(filePath, content, 'utf8');

    return NextResponse.json(
      { message: '게시글이 성공적으로 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return NextResponse.json(
      { error: '게시글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 관리자 권한 확인
    const session = await getServerSession(authOptions);

    // GitHub 계정이 toris-dev인 경우에만 삭제 허용
    if (!session || !session.user || session.user.login !== 'toris-dev') {
      return NextResponse.json(
        { error: '관리자만 게시글을 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 파라미터에서 slug 가져오기
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    // 마크다운 파일 경로 구성
    const postsDirectory = path.join(process.cwd(), 'public/markdown');

    // posts 디렉토리 파일 목록 가져오기
    const files = fs.readdirSync(postsDirectory);
    console.log('파일 목록 (삭제):', files);

    // slug와 일치하는 파일 찾기
    const targetFile = findFileBySlug(files, slug);
    console.log('삭제할 파일:', targetFile);

    if (!targetFile) {
      return NextResponse.json(
        { error: '삭제할 게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 삭제
    const filePath = path.join(postsDirectory, targetFile);
    fs.unlinkSync(filePath);

    // GitHub Issue 삭제 시도
    try {
      // 쿼리 파라미터에서 issueNumber를 추출
      const url = new URL(request.url);
      const issueNumber = url.searchParams.get('issueNumber');
      const githubToken = process.env.GITHUB_TOKEN;

      if (issueNumber) {
        // GitHub API를 사용하여 해당 Issue 삭제 (사실상 Close 처리)
        if (!githubToken) {
          console.warn(
            'GitHub 토큰이 설정되지 않아 이슈를 삭제할 수 없습니다.'
          );
        } else {
          const response = await fetch(
            `https://api.github.com/repos/toris-dev/Toris_Blog/issues/${issueNumber}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `token ${githubToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                state: 'closed'
              })
            }
          );

          if (!response.ok) {
            console.error('GitHub Issue 닫기 실패:', await response.text());
          } else {
            console.log(`GitHub Issue #${issueNumber} 닫기 성공`);
          }
        }
      } else {
        // Issue Number가 없는 경우, 자동으로 찾아보기
        // '[새 글] {slug}' 형태의 이슈를 검색
        if (githubToken) {
          const searchResponse = await fetch(
            `https://api.github.com/search/issues?q=repo:toris-dev/Toris_Blog+is:issue+in:title+${encodeURIComponent(`[새 글] ${slug}`)}`,
            {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json'
              }
            }
          );

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              // 첫 번째 일치하는 이슈 닫기
              const foundIssue = searchData.items[0];
              const closeResponse = await fetch(
                `https://api.github.com/repos/toris-dev/Toris_Blog/issues/${foundIssue.number}`,
                {
                  method: 'PATCH',
                  headers: {
                    Authorization: `token ${githubToken}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.github.v3+json'
                  },
                  body: JSON.stringify({
                    state: 'closed'
                  })
                }
              );

              if (closeResponse.ok) {
                console.log(`GitHub Issue #${foundIssue.number} 닫기 성공`);
              } else {
                console.error(
                  'GitHub Issue 닫기 실패:',
                  await closeResponse.text()
                );
              }
            } else {
              console.log(
                `'${slug}'와 관련된 GitHub Issue를 찾을 수 없습니다.`
              );
            }
          } else {
            console.error(
              'GitHub Issue 검색 실패:',
              await searchResponse.text()
            );
          }
        }
      }
    } catch (error) {
      console.error('GitHub Issue 삭제 중 오류 발생:', error);
      // Issue 삭제에 실패하더라도 게시글 삭제는 성공으로 처리
    }

    return NextResponse.json(
      { message: '게시글이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 정보 가져오기 API
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 파라미터에서 slug 가져오기
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: '유효하지 않은 요청입니다.' },
        { status: 400 }
      );
    }

    // 마크다운 파일 경로 구성
    const postsDirectory = path.join(process.cwd(), 'public/markdown');

    // posts 디렉토리 파일 목록 가져오기
    const files = fs.readdirSync(postsDirectory);
    console.log('파일 목록:', files);

    // slug와 일치하는 파일 찾기
    const targetFile = findFileBySlug(files, slug);
    console.log('찾은 파일:', targetFile);

    if (!targetFile) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 내용 읽기
    const filePath = path.join(postsDirectory, targetFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    return NextResponse.json(
      {
        slug,
        fileName: targetFile,
        content: fileContent
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    return NextResponse.json(
      { error: '게시글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
