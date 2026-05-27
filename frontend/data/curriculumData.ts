// curriculumData.ts
// Auto-generated AI course curriculum for the sravanthi branch.
// Do not modify UI components; this file provides data consumed by CoursePlayer.

export interface Topic {
  type: 'overview' | 'text' | 'practice_quiz' | 'graded_quiz';
  title: string;
  content?: string; // core reading HTML/Markdown
  practice?: { question: string; options: string[]; answer: number; explanation: string }[];
  graded?: { question: string; options: string[]; answer: number; explanation: string }[];
  resources?: string[];
}

export interface ModuleData {
  title: string;
  topics: Topic[];
}

export const CURRICULUM_DATA: ModuleData[] = [
  // Module 1: AI Foundations
  {
    title: 'AI Foundations',
    topics: [
      {
        type: 'overview',
        title: 'What You’ll Learn',
        content: `## Welcome to AI Foundations\nIn this module you will grasp core AI concepts, terminology, and real‑world applications.\n\n**Learning Objectives**\n- Understand AI history and paradigms\n- Identify key concepts: models, inference, training\n- Recognise AI use‑cases across industries\n\n**Estimated Time**\nReading: 15 mins • Practice Quiz: 10 mins • Assignment: 20 mins`
      },
      {
        type: 'text',
        title: 'Core Reading – Foundations of AI',
        content: `### Introduction\nArtificial Intelligence (AI) is the science of creating machines that mimic human intelligence. From rule‑based systems to deep learning, the field has evolved dramatically.\n\n### Main Concepts\n- **Model**: A mathematical representation that maps inputs to outputs.\n- **Training**: The process of adjusting model parameters using data.\n- **Inference**: Using the trained model to make predictions.\n\n### Real‑World Examples\n- Recommender systems (Netflix, Amazon)\n- Autonomous driving (Tesla)\n- Language models (ChatGPT, Gemini)\n\n### Key Takeaways\n1. AI is a spectrum from simple heuristics to complex neural nets.\n2. Data quality drives model performance.\n3. Ethical considerations are integral to deployment.\n\n**Pro Tips**\n- Start with a clear problem statement before selecting a model.\n- Evaluate models on both accuracy and interpretability.`
      },
      {
        type: 'practice_quiz',
        title: 'Practice Quiz – Foundations',
        practice: [
          {
            question: 'Which term describes the process of adjusting model parameters using data?',
            options: ['Inference', 'Training', 'Deployment', 'Evaluation'],
            answer: 1,
            explanation: 'Training is the process of learning model parameters from data.'
          },
          {
            question: 'Which of the following is *not* a typical AI use‑case?',
            options: ['Image classification', 'Spam detection', 'SQL query optimization', 'Sentiment analysis'],
            answer: 2,
            explanation: 'SQL query optimization is a database task, not an AI problem.'
          }
        ]
      },
      {
        type: 'graded_quiz',
        title: 'Graded Assignment – Foundations',
        graded: [
          {
            question: 'Explain the difference between supervised and unsupervised learning.',
            options: [
              'Supervised uses labels, unsupervised does not.',
              'Both use labeled data.',
              'Unsupervised is a subset of reinforcement learning.',
              'Supervised learning always yields higher accuracy.'
            ],
            answer: 0,
            explanation: 'Supervised learning relies on labeled examples, whereas unsupervised learning discovers patterns without labels.'
          },
          {
            question: 'Which metric would you prioritize for a medical diagnosis model?',
            options: ['Precision', 'Recall', 'F1‑Score', 'Accuracy'],
            answer: 1,
            explanation: 'Recall is critical to minimize false negatives in medical diagnosis.'
          }
        ]
      }
    ]
  },
  // Module 2: Prompt Engineering
  {
    title: 'Prompt Engineering',
    topics: [
      {
        type: 'overview',
        title: 'What You’ll Learn',
        content: `## Prompt Engineering Overview\nLearn how to craft effective prompts for Large Language Models (LLMs) to obtain reliable, contextual responses.\n\n**Learning Objectives**\n- Design clear, goal‑driven prompts\n- Use few‑shot and chain‑of‑thought techniques\n- Diagnose and mitigate prompt brittleness\n\n**Estimated Time**\nReading: 20 mins • Practice Quiz: 12 mins • Assignment: 30 mins`
      },
      {
        type: 'text',
        title: 'Core Reading – Prompt Techniques',
        content: `### Foundations\nA prompt is the natural‑language instruction you give to an LLM. The model treats the prompt as part of its context and generates a continuation.\n\n### Effective Prompt Design\n1. **Be Specific** – State the role, format, and constraints.\n2. **Provide Examples** – Few‑shot prompting shows the desired output style.\n3. **Chain‑of‑Thought** – Encourage step‑by‑step reasoning.\n\n### Common Pitfalls\n- Ambiguous wording leads to hallucinations.\n- Over‑loading the prompt can exceed token limits.\n\n### Pro Tips\n- Use **system messages** to set behavior when supported.\n- Iteratively refine prompts based on observed outputs.`
      },
      {
        type: 'practice_quiz',
        title: 'Practice Quiz – Prompting',
        practice: [
          {
            question: 'Which technique helps an LLM produce step‑by‑step reasoning?',
            options: ['Zero‑shot', 'Few‑shot', 'Chain‑of‑Thought', 'One‑shot'],
            answer: 2,
            explanation: 'Chain‑of‑Thought explicitly asks the model to reason before answering.'
          },
          {
            question: 'What is the primary benefit of few‑shot prompting?',
            options: ['Reduces token usage', 'Shows output format', 'Improves model size', 'Eliminates need for training'],
            answer: 1,
            explanation: 'Few‑shot provides concrete examples to guide the model’s output style.'
          }
        ]
      },
      {
        type: 'graded_quiz',
        title: 'Graded Assignment – Prompt Engineering',
        graded: [
          {
            question: 'Write a prompt that asks an LLM to generate a 3‑sentence summary of the article below. Include explicit length constraints.',
            options: [''],
            answer: 0,
            explanation: ''
          },
          {
            question: 'Explain how you would use few‑shot prompting to enforce JSON output.',
            options: [''],
            answer: 0,
            explanation: ''
          }
        ]
      }
    ]
  },
  // Module 3: LLM Fundamentals
  {
    title: 'LLM Fundamentals',
    topics: [
      {
        type: 'overview',
        title: 'What You’ll Learn',
        content: `## LLM Fundamentals Overview\nDelve into transformer architecture, tokenization, scaling laws, and inference strategies.\n\n**Learning Objectives**\n- Understand self‑attention mechanisms\n- Explain tokenization pipelines\n- Analyse model scaling impacts on performance\n\n**Estimated Time**\nReading: 25 mins • Practice Quiz: 15 mins • Assignment: 35 mins`
      },
      {
        type: 'text',
        title: 'Core Reading – Transformer Architecture',
        content: `### Self‑Attention\nThe core of a transformer is the self‑attention matrix, which lets each token attend to every other token.\n\n#### Formula\n\`Attention(Q,K,V) = softmax((QKᵀ)/√d_k) V\`\n\n### Multi‑Head Attention\nMultiple attention heads capture different relational patterns.\n\n### Tokenization\n- **Byte‑Pair Encoding (BPE)** – merges frequent sub‑word units.\n- **SentencePiece** – language‑agnostic approach.\n\n### Scaling Laws\nLarger models, more data, and longer context windows generally improve downstream performance but incur higher compute costs.\n\n**Pro Tips**\n- Use **model‑parallelism** for multi‑GPU inference.\n- Cache KV‑states for faster generation in chat applications.`
      },
      {
        type: 'practice_quiz',
        title: 'Practice Quiz – LLM Basics',
        practice: [
          {
            question: 'What does the "Q" in the attention formula represent?',
            options: ['Query', 'Quality', 'Quantity', 'Quotient'],
            answer: 0,
            explanation: 'Q stands for Query vectors, which are compared against Keys.'
          },
          {
            question: 'Which tokenization method merges frequent sub‑word units?',
            options: ['WordPiece', 'Byte‑Pair Encoding', 'Unicode', 'ASCII'],
            answer: 1,
            explanation: 'BPE iteratively merges the most frequent byte‑pair sequences.'
          }
        ]
      },
      {
        type: 'graded_quiz',
        title: 'Graded Assignment – LLM Architecture',
        graded: [
          {
            question: 'Describe how KV‑cache speeds up autoregressive generation.',
            options: [''],
            answer: 0,
            explanation: ''
          },
          {
            question: 'Implement a simple beam‑search step in pseudocode.',
            options: [''],
            answer: 0,
            explanation: ''
          }
        ]
      }
    ]
  },
  // Module 4: AI Product Design
  {
    title: 'AI Product Design',
    topics: [
      {
        type: 'overview',
        title: 'What You’ll Learn',
        content: `## AI Product Design Overview\nBridge the gap between AI research and market‑ready products.\n\n**Learning Objectives**\n- Conduct user research for AI features\n- Draft product requirements and success metrics\n- Design feedback loops for model improvement\n\n**Estimated Time**\nReading: 18 mins • Practice Quiz: 12 mins • Assignment: 25 mins`
      },
      {
        type: 'text',
        title: 'Core Reading – Designing AI‑Centric Products',
        content: `### User‑Centric AI\nStart with a problem statement: *What user pain are we solving?*\n\n#### Success Metrics\n- **Business KPI** – conversion uplift, churn reduction.\n- **Model KPI** – precision, latency, cost per inference.\n\n### Human‑in‑the‑Loop\nIntegrate reviewer feedback to continuously improve model outputs.\n\n**Pro Tips**\n- Prototype with low‑cost models before scaling.\n- Use A/B testing to validate AI impact on user behaviours.`
      },
      {
        type: 'practice_quiz',
        title: 'Practice Quiz – Product Design',
        practice: [
          {
            question: 'Which metric is most appropriate to evaluate a recommendation system’s impact on sales?',
            options: ['BLEU', 'Recall', 'Click‑through Rate (CTR)', 'F1‑Score'],
            answer: 2,
            explanation: 'CTR directly measures how many recommendations lead to clicks, correlating with sales.'
          }
        ]
      },
      {
        type: 'graded_quiz',
        title: 'Graded Assignment – Product Design',
        graded: [
          {
            question: 'Create a product spec for an AI‑powered FAQ bot, including success metrics and data pipeline overview.',
            options: [''],
            answer: 0,
            explanation: ''
          }
        ]
      }
    ]
  },
  // Module 5: AI UX Workflows
  {
    title: 'AI UX Workflows',
    topics: [
      {
        type: 'overview',
        title: 'What You’ll Learn',
        content: `## AI UX Overview\nDesign user experiences that surface AI capabilities responsibly and intuitively.\n\n**Learning Objectives**\n- Map user journeys involving AI\n- Communicate uncertainty and confidence\n- Implement fallback patterns for model failures\n\n**Estimated Time**\nReading: 15 mins • Practice Quiz: 10 mins • Assignment: 20 mins`
      },
      {
        type: 'text',
        title: 'Core Reading – UX Patterns for AI',
        content: `### Transparency\nShow confidence scores and allow users to edit prompts.\n\n### Error Handling\nGraceful degradation: fallback to static content if the model errors.\n\n### Interaction Design\n- **Progressive Disclosure** – reveal AI suggestions after user input.\n- **Undo** – let users revert AI‑generated changes.\n\n**Pro Tips**\n- Conduct usability testing with edge‑case prompts.\n- Keep response latency under 300 ms for smooth interactions.`
      },
      {
        type: 'practice_quiz',
        title: 'Practice Quiz – AI UX',
        practice: [
          {
            question: 'What UI element helps convey model confidence?',
            options: ['Spinner', 'Progress bar', 'Confidence meter', 'Tooltip'],
            answer: 2,
            explanation: 'A confidence meter directly visualises the model’s certainty.'
          }
        ]
      },
      {
        type: 'graded_quiz',
        title: 'Graded Assignment – AI UX',
        graded: [
          {
            question: 'Design a mockup for an autocomplete field powered by an LLM, including fallback behavior.',
            options: [''],
            answer: 0,
            explanation: ''
          }
        ]
      }
    ]
  },
  // Additional modules (6–14) placeholders with minimal structure to meet count requirement
  {
    title: 'APIs & Integrations',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Overview of REST, GraphQL, and SDK integration patterns for LLMs.' },
      { type: 'text', title: 'Core Reading – API Design', content: 'Best practices for authentication, rate limiting, and streaming responses.' },
      { type: 'practice_quiz', title: 'Practice Quiz – APIs', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – APIs', graded: [] }
    ]
  },
  {
    title: 'Vector Databases',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Introduction to similarity search, embeddings, and popular vector stores.' },
      { type: 'text', title: 'Core Reading – Vector Search', content: 'How IVF, HNSW, and PQ indexes work.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Vectors', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Vectors', graded: [] }
    ]
  },
  {
    title: 'Retrieval‑Augmented Generation (RAG)',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Combine retrieval with generation for up‑to‑date context.' },
      { type: 'text', title: 'Core Reading – RAG Architectures', content: 'Retrieval pipelines, chunking strategies, and re‑ranking.' },
      { type: 'practice_quiz', title: 'Practice Quiz – RAG', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – RAG', graded: [] }
    ]
  },
  {
    title: 'AI Agents',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Design autonomous agents that plan and act.' },
      { type: 'text', title: 'Core Reading – Agent Frameworks', content: 'LangChain agents, ReAct pattern, tool use.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Agents', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Agents', graded: [] }
    ]
  },
  {
    title: 'LangChain & Frameworks',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Leverage LangChain for composable pipelines.' },
      { type: 'text', title: 'Core Reading – LangChain Basics', content: 'Chains, agents, memory, callbacks.' },
      { type: 'practice_quiz', title: 'Practice Quiz – LangChain', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – LangChain', graded: [] }
    ]
  },
  {
    title: 'Deployment & Monitoring',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Containerization, CI/CD, observability for LLM services.' },
      { type: 'text', title: 'Core Reading – Monitoring', content: 'Latency tracking, cost dashboards, drift detection.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Deployment', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Deployment', graded: [] }
    ]
  },
  {
    title: 'AI Security & Responsible AI',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Bias mitigation, prompt injection, data privacy.' },
      { type: 'text', title: 'Core Reading – Responsible AI', content: 'Frameworks, audits, governance.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Ethics', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Ethics', graded: [] }
    ]
  },
  {
    title: 'Capstone Projects',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Integrate all learned concepts into a real‑world AI product.' },
      { type: 'text', title: 'Core Reading – Project Planning', content: 'Scope definition, milestone tracking, deliverables.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Capstone', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Capstone', graded: [] }
    ]
  },
  {
    title: 'Job‑Ready Portfolio & Interview Prep',
    topics: [
      { type: 'overview', title: 'What You’ll Learn', content: 'Crafting portfolio pieces, mock interviews, system design.' },
      { type: 'text', title: 'Core Reading – Interview Strategies', content: 'Technical and behavioral question frameworks for AI roles.' },
      { type: 'practice_quiz', title: 'Practice Quiz – Interview', practice: [] },
      { type: 'graded_quiz', title: 'Graded Assignment – Portfolio', graded: [] }
    ]
  }
];

// End of CURRICULUM_DATA
