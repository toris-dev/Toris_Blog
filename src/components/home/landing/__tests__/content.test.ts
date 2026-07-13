import * as content from '../content';
import { developerPipeline } from '../content';

describe('developerPipeline', () => {
  it('defines the approved developer identity and four ordered stages', () => {
    expect(developerPipeline).toMatchObject({
      eyebrow: 'HOW I BUILD',
      role: 'Product Full-Stack Developer',
      title: '제품의 처음과 끝을 연결하는 개발자',
      summary:
        '문제를 제품의 언어로 정리하고, 화면과 시스템을 함께 설계해, 실제로 운영되는 결과까지 만듭니다.',
      closing:
        '한 경계에서 다음 팀으로 넘기는 대신, 결정이 제품 전체에서 어떻게 작동하는지 끝까지 확인합니다.'
    });

    expect(developerPipeline.stages.map((stage) => stage.id)).toEqual([
      'frame',
      'shape',
      'build',
      'ship'
    ]);
    expect(developerPipeline.stages.map((stage) => stage.number)).toEqual([
      '01',
      '02',
      '03',
      '04'
    ]);
    expect(
      new Set(developerPipeline.stages.map((stage) => stage.id)).size
    ).toBe(4);
    expect(developerPipeline.stages.at(-1)?.outcome).toBe(
      '운영 가능한 릴리스와 반복'
    );
  });

  it('does not export the superseded 21n career object', () => {
    expect((content as Record<string, unknown>).career).toBeUndefined();
    expect(JSON.stringify(developerPipeline)).not.toContain('21앤');
    expect(JSON.stringify(developerPipeline)).not.toContain('B2B2C');
  });
});
