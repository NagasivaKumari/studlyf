// curriculumData.ts – defines the hierarchical curriculum used by CoursePlayer
// No branding references; generic educational content placeholders.

export const CURRICULUM_DATA = [
  {
    title: "AI Foundations",
    description: "Core principles of generative AI, large language models, and modern AI systems.",
    duration: "90 mins",
    topics: [
      { type: "text", title: "Intro to Generative AI", content: "## Intro to Generative AI\n\nLearn the basics of generative models, their applications, and key concepts." },
      { type: "text", title: "Model Architectures", content: "## Model Architectures\n\nExplore transformer architectures, encoder‑decoder designs, and scaling laws." },
      { type: "practice_quiz", title: "Practice Quiz 1", content: "" },
      { type: "graded_quiz", title: "Chapter Assessment", content: "" }
    ]
  },
  {
    title: "Prompt Mastery",
    description: "Techniques for crafting high‑quality prompts that produce reliable, creative AI outputs.",
    duration: "75 mins",
    topics: [
      { type: "text", title: "Structured Prompting", content: "## Structured Prompting\n\nGuidelines for building clear, instruction‑based prompts." },
      { type: "text", title: "Zero‑shot vs Few‑shot", content: "## Zero‑shot vs Few‑shot\n\nWhen to use each approach and how to format examples." },
      { type: "practice_quiz", title: "Practice Quiz 2", content: "" },
      { type: "graded_quiz", title: "Chapter Assessment", content: "" }
    ]
  },
  {
    title: "AI Product Workflows",
    description: "Design AI‑driven products, set success metrics, and integrate AI into user journeys.",
    duration: "85 mins",
    topics: [
      { type: "text", title: "Product Discovery", content: "## Product Discovery\n\nMethods for identifying AI product opportunities and user needs." },
      { type: "text", title: "AI Feature Scoping", content: "## AI Feature Scoping\n\nHow to define scope, feasibility, and ROI for AI features." },
      { type: "practice_quiz", title: "Practice Quiz 3", content: "" },
      { type: "graded_quiz", title: "Chapter Assessment", content: "" }
    ]
  },
  {
    title: "Hands‑On AI Projects",
    description: "Guided project work that demonstrates engineering rigor and practical AI deployment.",
    duration: "120 mins",
    topics: [
      { type: "text", title: "Project Planning", content: "## Project Planning\n\nSteps to outline objectives, datasets, and timelines for AI projects." },
      { type: "text", title: "Model Integration", content: "## Model Integration\n\nBest practices for embedding models into applications and APIs." },
      { type: "practice_quiz", title: "Practice Quiz 4", content: "" },
      { type: "graded_quiz", title: "Chapter Assessment", content: "" }
    ]
  },
  {
    title: "Job‑Ready Portfolio",
    description: "Package AI work into a polished portfolio ready for recruiters and technical interviews.",
    duration: "60 mins",
    topics: [
      { type: "text", title: "Resume Updates", content: "## Resume Updates\n\nHow to highlight AI projects and skills on your resume." },
      { type: "text", title: "Project Storytelling", content: "## Project Storytelling\n\nCraft compelling narratives around your AI implementations." },
      { type: "practice_quiz", title: "Practice Quiz 5", content: "" },
      { type: "graded_quiz", title: "Chapter Assessment", content: "" }
    ]
  }
];
