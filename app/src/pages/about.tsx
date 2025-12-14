import { BookOpen } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans flex items-center justify-center">
      <div className="max-w-2xl text-center space-y-8 p-8">
        <div className="flex justify-center">
          <div className="p-4 bg-zinc-900 text-white rounded-sm">
            <BookOpen className="h-12 w-12" />
          </div>
        </div>

        <h1 className="text-5xl font-black tracking-tighter">Dev-iterate</h1>

        <p className="text-xl text-zinc-500 leading-relaxed font-light">
          A minimal, distraction-free environment for creating and learning.
          Focus on content without the noise.
        </p>

        <div className="pt-8 border-t border-zinc-200 flex justify-center gap-12 text-sm font-bold uppercase tracking-widest text-zinc-400">
          <span>Design</span>
          <span>Create</span>
          <span>Learn</span>
        </div>
      </div>
    </div>
  );
};
export default About;
