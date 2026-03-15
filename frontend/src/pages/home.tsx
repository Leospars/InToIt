import FeatureCards from "@/components/ui/feature-cards";
import { TextEffect } from "@/components/ui/text-effect";
import {
  UploadCloud,
  BookOpen,
  Sparkles,
  Brain
} from "lucide-react";

const Home = () => {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center pt-16 pb-12">

  
      <div className="flex w-full flex-col items-center gap-6 text-center">

        <FeatureCards />

        <div className="flex flex-col items-center gap-4">
              <TextEffect per='word' as='h1' preset='fade-in-blur' className="text-4xl font-semibold tracking-tight sm:text-5xl text-gray-950">
     
  
     
            Welcome to IntoIt
         
  </TextEffect>
          <p className="max-w-2xl text-lg text-gray-700">
            Turn your notes, PDFs, and lectures into structured study content.
            Generate quizzes, explore concepts, and learn faster with AI.
          </p>
        </div>

   
        <div className="flex items-center gap-3 mt-4">

          <a
            href="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-medium text-white transition hover:scale-[0.98]"
          >
            <UploadCloud className="size-4" />
            Upload Notes
          </a>

          <a
            href="/course-outline"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-custom hover:bg-gray-100"
          >
            <BookOpen className="size-4" />
            Add Course
          </a>

        </div>
      </div>




      <section className="w-full mt-28">

        <div className="text-center max-w-3xl mx-auto">

          <h2 className="text-4xl font-semibold">
            Learn with IntoIt in <span className="text-gray-950">4</span> easy steps
          </h2>

          <p className="text-gray-500 mt-4">
            Upload your study material and IntoIt turns it into structured
            learning tools powered by AI.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mt-20">

          <div className="text-center">
            <div className="text-8xl font-semibold text-gray-300">1</div>
            <h3 className="font-semibold mt-6 text-lg">Upload your notes</h3>
            <p className="text-gray-500 text-sm mt-2">
              Upload PDFs, lecture slides, or notes to start learning.
            </p>
          </div>

          <div className="text-center">
            <div className="text-8xl font-semibold text-gray-300">2</div>
            <h3 className="font-semibold mt-6 text-lg">
              AI processes content
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              IntoIt analyzes and organizes your notes into topics.
            </p>
          </div>

          <div className="text-center">
            <div className="text-8xl font-semibold text-gray-300">3</div>
            <h3 className="font-semibold mt-6 text-lg">
              Generate quizzes
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Automatically create quizzes and summaries.
            </p>
          </div>

          <div className="text-center">
            <div className="text-8xl font-semibold text-gray-300">4</div>
            <h3 className="font-semibold mt-6 text-lg">
              Master the material
            </h3>
            <p className="text-gray-500 text-sm mt-2">
              Study faster using AI explanations and practice tests.
            </p>
          </div>

        </div>

      </section>



      {/* FEATURES */}
      <section className="w-full mt-28">

        <div className="text-center max-w-3xl mx-auto">

          <h2 className="text-4xl font-semibold">
            Smarter studying made <span className="text-gray-950">simple</span>
          </h2>

          <p className="text-gray-500 mt-4">
            IntoIt helps you organize, understand and test your knowledge
            faster with AI-powered learning tools.
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">

          <div className="bg-white rounded-2xl p-8 text-left shadow-custom">
            <Sparkles className="text-gray-900 mb-4" />
            <h3 className="text-xl font-semibold">
              Artificial Intelligence
            </h3>
            <p className="text-gray-500 mt-2">
              Get summarized insights and explanations instantly.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-left shadow-custom">
            <BookOpen className="text-gray-900 mb-4" />
            <h3 className="text-xl font-semibold">
              Course organization
            </h3>
            <p className="text-gray-500 mt-2">
              Automatically structure topics from your study materials.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-left shadow-custom">
            <UploadCloud className="text-gray-900 mb-4" />
            <h3 className="text-xl font-semibold">
              Upload study material
            </h3>
            <p className="text-gray-500 mt-2">
              Add PDFs, lecture slides and notes instantly.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-left shadow-custom">
            <Brain className="text-gray-900 mb-4" />
            <h3 className="text-xl font-semibold">
              AI quiz generation
            </h3>
            <p className="text-gray-500 mt-2">
              Automatically create quizzes and practice questions.
            </p>
          </div>

        </div>

      </section>



 

    </div>
  );
};

export default Home;