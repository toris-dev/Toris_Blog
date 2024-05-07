import About from '@/components/portfolio/About';
import Activity from '@/components/portfolio/Activity';
import Archiving from '@/components/portfolio/Archiving';
import Projects from '@/components/portfolio/Projects';
import Skills from '@/components/portfolio/Skill';

export default function Portfolio() {
  return (
    <div className="m-0 flex size-full min-h-screen flex-col items-center justify-center p-0">
      <About />
      <Skills />
      <Archiving />
      <Projects />
      <Activity />
    </div>
  );
}
