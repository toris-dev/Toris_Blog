import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectDetail from '@/components/projects/ProjectDetail';
import { getAdjacentProjects, getProject, projects } from '@/data/projects';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) {
    return { title: '프로젝트를 찾을 수 없습니다 | Toris Blog' };
  }
  return {
    title: `${project.name} — ${project.tagline} | Toris Blog`,
    description: project.description,
    openGraph: {
      title: `${project.name} | Toris Projects`,
      description: project.tagline,
      images: [{ url: project.image }],
      type: 'website'
    }
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const { prev, next } = getAdjacentProjects(slug);

  return <ProjectDetail project={project} prev={prev} next={next} />;
}
