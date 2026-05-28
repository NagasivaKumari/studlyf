export interface DSAQuestion {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequency: number;
  tags: string[];
  input: string;
  output: string;
  approach: string;
  code: { [key: string]: string };
  time: string;
  space: string;
  acceptanceRate?: number;
  estimatedRounds?: string;
  visualizerType: 'tree' | 'sliding-window' | 'linked-list' | 'dp' | 'sorting' | 'graph';
  explanation: {
    intuition: string;
    brute: string;
    optimized: string;
    dryRun: string[];
    edgeCases: string[];
    tips: string[];
  };
}

export interface TechQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  keyPoints: string[];
  followUps: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  frequency: number;
}

export interface HRQuestion {
  id: string;
  question: string;
  modelAnswer: string;
  aiTips: string;
  starTips: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
}

export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  hiringRoles: string[];
  interviewRounds: string[];
  salaryRange: string;
  culture: string;
  difficulty: 'Moderate' | 'High' | 'Elite';
  completion: number;
  brandColor: string;
  stats: {
    placed: string;
    avgpackage: string;
  };
  dsa: DSAQuestion[];
  technical: TechQuestion[];
  hr: HRQuestion[];
}

export const PREMIUM_COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    industry: 'Software & Cloud Technology',
    hiringRoles: ['SDE I', 'SDE II', 'Cloud Architect', 'ML Engineer'],
    interviewRounds: ['Online Assessment', '3x Technical (DSA/Systems)', 'Googliness & Leadership'],
    salaryRange: '₹32L - ₹65L+',
    brandColor: '#4285F4',
    culture: 'Googliness, Innovation, Openness, High Autonomy',
    difficulty: 'Elite',
    completion: 45,
    stats: { placed: '142', avgpackage: '34.8 LPA' },
    dsa: [
      {
        id: 'g1',
        title: 'Validate Binary Search Tree',
        difficulty: 'Medium',
        frequency: 94,
        tags: ['Tree', 'DFS', 'Recursion'],
        input: '[10, 5, 15, 2, 7, 12, 20]',
        output: 'true',
        approach: 'Traverse recursively, updating upper/lower validation boundaries at each node.',
        time: 'O(N)',
        space: 'O(H)',
        visualizerType: 'tree',
        explanation: {
          intuition: 'Each node must remain strictly within a valid value range defined by its ancestors. As we move left, the maximum boundary shrinks. As we move right, the minimum boundary expands.',
          brute: 'In-order traversal, collect into array, then verify if array is strictly sorted. Uses O(N) auxiliary space.',
          optimized: 'DFS traversal carrying dynamic (minVal, maxVal) boundaries. Recursively checks root.val > minVal && root.val < maxVal.',
          dryRun: [
            'Visiting Root (10): Bound (-∞, +∞) -> Valid',
            'Moving Left (5): Bound (-∞, 10) -> Valid',
            'Moving Right (15): Bound (10, +∞) -> Valid',
            'Moving Left under 5 (2): Bound (-∞, 5) -> Valid',
            'Moving Right under 5 (7): Bound (5, 10) -> Valid'
          ],
          edgeCases: ['Single node trees', 'Trees containing integer bounds (Integer.MIN_VALUE/MAX_VALUE)', 'Duplicate node values (BST rules typically disallow duplicate values)'],
          tips: ['Clarify whether duplicate values are allowed in the BST input before coding.', 'If using integer limit bounds, use null or double precision bounds to avoid integer underflow/overflow.']
        },
        code: {
          python: `def isValidBST(root, min_val=float('-inf'), max_val=float('inf')):\n    if not root:\n        return True\n    if not (min_val < root.val < max_val):\n        return False\n    return (\n        isValidBST(root.left, min_val, root.val) and\n        isValidBST(root.right, root.val, max_val)\n    )`,
          java: `public boolean isValidBST(TreeNode root) {\n    return validate(root, null, null);\n}\n\nprivate boolean validate(TreeNode node, Integer min, Integer max) {\n    if (node == null) return true;\n    if ((min != null && node.val <= min) || (max != null && node.val >= max)) return false;\n    return validate(node.left, min, node.val) && validate(node.right, node.val, max);\n}`
        }
      },
      {
        id: 'g2',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        frequency: 89,
        tags: ['Sliding Window', 'String', 'Hash Table'],
        input: '"abcabcbb"',
        output: '3',
        approach: 'Maintain a sliding window using two pointers, saving the latest character indices in a map.',
        time: 'O(N)',
        space: 'O(min(A, M))',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'Store index references of characters. When we encounter a repeating character in our current window, shift the left pointer to the right of the previous occurrence immediately to maintain unique characters.',
          brute: 'Check all possible substrings with nested loops and a frequency set. O(N^3) time complexity.',
          optimized: 'Keep track of left and right pointers. Update left = max(left, lastSeenIndex[char] + 1) to execute in a single linear pass.',
          dryRun: [
            'Right=0: char "a", Window: [a], MaxLength = 1',
            'Right=1: char "b", Window: [a,b], MaxLength = 2',
            'Right=2: char "c", Window: [a,b,c], MaxLength = 3',
            'Right=3: char "a" repeat! Shift Left to 1. Window: [b,c,a], MaxLength = 3',
            'Right=4: char "b" repeat! Shift Left to 2. Window: [c,a,b], MaxLength = 3'
          ],
          edgeCases: ['Empty string ""', 'String with identical characters "bbbbb"', 'No repeating characters "abcdefg"'],
          tips: ['Always ask whether character set is ASCII or Unicode, as this affects space complexity guarantees.', 'Avoid converting string to character arrays repeatedly inside inner loops.']
        },
        code: {
          python: `def lengthOfLongestSubstring(s: str) -> int:\n    char_map = {}\n    left = 0\n    max_len = 0\n    for right, char in enumerate(s):\n        if char in char_map and char_map[char] >= left:\n            left = char_map[char] + 1\n        char_map[char] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len`,
          java: `public int lengthOfLongestSubstring(String s) {\n    int n = s.length(), ans = 0;\n    Map<Character, Integer> map = new HashMap<>();\n    for (int j = 0, i = 0; j < n; j++) {\n        if (map.containsKey(s.charAt(j))) {\n            i = Math.max(map.get(s.charAt(j)) + 1, i);\n        }\n        ans = Math.max(ans, j - i + 1);\n        map.put(s.charAt(j), j);\n    }\n    return ans;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'g-t-1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 98,
        question: 'How do you handle horizontal database scaling (Sharding) and prevent massive re-allocations?',
        answer: 'Horizontal partitioning divides a table across multiple database engines (shards) based on a partition key. Using naive hashing (hash(key) % N) creates massive re-indexing overhead when scaling database instances. Consistent Hashing maps keys and shards onto a circular hash ring, ensuring that adding or removing a shard only affects a tiny fraction (1/N) of total dataset migrations.',
        keyPoints: ['Consistent Hashing', 'Hash Ring', 'Partition Keys', 'Minimize Data Migration', 'Virtual Nodes'],
        followUps: ['How do virtual nodes prevent hot spots on the hash ring?', 'What is the impact of choosing an unevenly distributed shard key?']
      },
      {
        id: 'g-t-2',
        category: 'OOP & Architecture',
        difficulty: 'Intermediate',
        frequency: 85,
        question: 'Explain Dependency Injection and why it is critical for testing.',
        answer: 'Dependency Injection (DI) is a design pattern where an object receives its dependencies from an external source rather than creating them internally. It follows the Inversion of Control principle. In testing, DI is critical because it allows you to inject mock or stub implementations of dependencies (like a mock database client), isolating the unit being tested without making actual network or database calls.',
        keyPoints: ['Inversion of Control', 'Decoupling', 'Mocking / Stubbing', 'Testability', 'Constructor Injection'],
        followUps: ['What is the difference between Constructor, Setter, and Interface injection?', 'How does a DI container manage singleton lifecycles?']
      },
      {
        id: 'g-t-3',
        category: 'Backend / APIs',
        difficulty: 'Intermediate',
        frequency: 92,
        question: 'What happens behind the scenes when you type a URL into a browser and press Enter?',
        answer: '1. DNS Resolution (browser cache, OS cache, resolver, root servers). 2. TCP Handshake (SYN, SYN-ACK, ACK). 3. TLS Handshake (if HTTPS, exchange certificates and establish session keys). 4. HTTP Request (GET request sent). 5. Server Processing (Load balancer, reverse proxy, application server routing). 6. HTTP Response (Status code 200, HTML body). 7. Browser Rendering (Parse DOM, fetch CSS/JS, build Render Tree, layout, paint).',
        keyPoints: ['DNS Resolution', 'TCP/TLS Handshake', 'Load Balancing', 'HTTP Protocol', 'Browser DOM Rendering'],
        followUps: ['How does DNS caching reduce latency?', 'What is multiplexing in HTTP/2?']
      },
      {
        id: 'g-t-4',
        category: 'Databases',
        difficulty: 'Advanced',
        frequency: 88,
        question: 'Describe the ACID properties in database transactions and explain how Isolation levels affect them.',
        answer: 'Atomicity (all operations succeed or fail together), Consistency (database rules are never violated), Isolation (concurrent transactions do not interfere), Durability (committed changes persist). Isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) determine the trade-off between performance and strict isolation. Lower levels improve concurrency but introduce anomalies like dirty reads, non-repeatable reads, or phantom reads.',
        keyPoints: ['Atomicity', 'Consistency', 'Isolation', 'Durability', 'Transaction Anomalies'],
        followUps: ['What is a Phantom Read?', 'How does Multi-Version Concurrency Control (MVCC) solve read locks?']
      },
      {
        id: 'g-t-5',
        category: 'Debugging & Core CS',
        difficulty: 'Advanced',
        frequency: 76,
        question: 'You have a microservice that randomly spikes in CPU usage to 100% and crashes. How do you debug this in a production environment?',
        answer: '1. Check monitoring dashboards (Prometheus/Grafana) to correlate the spike with traffic, specific endpoints, or memory usage (checking for GC thrashing). 2. Capture a CPU profile or flamegraph during the spike to identify the exact functions consuming CPU. 3. Look at application logs (ELK stack) for specific errors or infinite loop patterns immediately preceding the crash. 4. Check for resource leaks, deadlocks, or unoptimized regex running on large inputs (ReDoS).',
        keyPoints: ['Flamegraphs / Profiling', 'Garbage Collection Thrashing', 'Log Correlation', 'ReDoS / Infinite Loops', 'Monitoring Dashboards'],
        followUps: ['How would you capture a core dump in a Kubernetes pod before it restarts?', 'What is a thread dump and how does it help identify deadlocks?']
      }
    ],
    hr: [
      {
        id: 'g-hr-1',
        question: 'Tell me about yourself.',
        modelAnswer: 'I am a final-year Computer Science student passionate about distributed systems and cloud architecture. Over the last two years, I have built several full-stack applications, including a real-time data scraper that processed 50k nodes daily. I focus heavily on writing clean, scalable code. I am drawn to Google because of its scale and the opportunity to work alongside industry leaders who build resilient systems used by billions.',
        aiTips: 'Emphasize your technical journey, a significant achievement, and why your goals align specifically with Google.',
        starTips: {
          situation: 'Introduce your current status (e.g., CS student, recent grad) and your core engineering interests.',
          task: 'Highlight what you strive to build (e.g., scalable, resilient systems, high-performance apps).',
          action: 'Briefly mention a specific project or achievement that proves your technical capability.',
          result: 'Connect your background and skills to the company’s specific scale and engineering culture.'
        }
      },
      {
        id: 'g-hr-2',
        question: 'Tell me about a time you worked on a technically challenging project under severe ambiguity.',
        modelAnswer: 'In my third-year internship, I was tasked with designing a real-time data scraper without knowing the exact rate limits or page limits of host sites. I researched the problem from first principles, implemented a dynamic back-off algorithm (exponential decay) to prevent getting IP-blocked, structured the crawler using robust multi-threading, and successfully delivered a highly robust ETL pipeline that processed 50k nodes daily.',
        aiTips: 'Emphasize Google values: proactivity, technical excellence, and improving team efficiency through automation.',
        starTips: {
          situation: 'I was assigned a critical project with vague requirements and no clear technical precedent.',
          task: 'I had to architect a resilient client-side interface that could gracefully fail and simulate database calls cleanly.',
          action: 'I researched from first principles, built prototypes, and implemented a robust exponential back-off algorithm.',
          result: 'Delivered a highly robust pipeline that processed data reliably without service interruption.'
        }
      },
      {
        id: 'g-hr-3',
        question: 'Describe a time you failed or made a significant mistake. What did you learn?',
        modelAnswer: 'During a hackathon, I insisted on using a new, complex database technology (Cassandra) that I hadn\'t fully mastered, rather than sticking to Postgres which I knew well. Halfway through, we encountered severe configuration issues and spent hours debugging instead of building features, ultimately causing us to miss the submission deadline. I learned that while exploring new tech is great, production environments require proven stability. Now, I always validate technology choices against strict deadlines before committing.',
        aiTips: 'Take full accountability. Focus heavily on the "learning" and how it changed your future behavior.',
        starTips: {
          situation: 'Our team was participating in a competitive 24-hour hackathon.',
          task: 'We needed to deliver a working MVP, and I was leading the backend architecture.',
          action: 'I chose an overly complex database I wasn\'t familiar with, causing us to lose hours debugging infrastructure.',
          result: 'We failed to submit on time. I learned to prioritize reliability and risk-management under tight deadlines.'
        }
      },
      {
        id: 'g-hr-4',
        question: 'How do you handle disagreements with a team member regarding a technical decision?',
        modelAnswer: 'When a colleague and I disagreed on whether to use REST or GraphQL for a new API, I suggested we evaluate both objectively. I created a matrix comparing the two based on our specific project requirements: payload size, over-fetching, and caching needs. By shifting the conversation from personal opinions to data-driven metrics, it became clear that REST was more appropriate for our simple, cache-heavy use case. We aligned quickly once we looked at the data.',
        aiTips: 'Show that you are data-driven, objective, and collaborative. Avoid ego.',
        starTips: {
          situation: 'A team member and I had conflicting views on a core architectural choice.',
          task: 'We needed to reach a consensus quickly without damaging team morale or delaying the project.',
          action: 'I proposed building a data-driven comparison matrix evaluating both options against our specific use-case metrics.',
          result: 'We aligned on the best objective choice, maintaining a strong relationship and delivering on schedule.'
        }
      },
      {
        id: 'g-hr-5',
        question: 'Why should we hire you over other qualified candidates?',
        modelAnswer: 'What sets me apart is my ability to bridge the gap between complex backend engineering and product vision. While many candidates can write algorithms, I always optimize for the end-user experience. For example, when optimizing database queries for a student dashboard, I didn\'t just improve the DB index; I implemented a UI skeleton loader so perceived latency dropped to zero. I bring strong coding fundamentals combined with deep product empathy.',
        aiTips: 'Highlight your unique combination of skills (e.g., technical depth + product sense, or speed + code quality).',
        starTips: {
          situation: 'Acknowledge the strong candidate pool but pivot to your unique differentiator.',
          task: 'Demonstrate how your specific skill combination brings outsized value to the company.',
          action: 'Provide a concrete example where your unique perspective solved a hard problem effectively.',
          result: 'Show how this translates to long-term impact for the company\'s bottom line or culture.'
        }
      }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    industry: 'E-commerce & Cloud Computing (AWS)',
    hiringRoles: ['SDE I', 'Cloud Support Associate', 'Data Engineer'],
    interviewRounds: ['Online Assessment', 'Technical Coding Screen', 'Onsite Bar Raiser (LP-focused)'],
    salaryRange: '₹28L - ₹50L',
    brandColor: '#FF9900',
    culture: 'Customer Obsession, Frugality, Bias for Action, Ownership',
    difficulty: 'High',
    completion: 12,
    stats: { placed: '89', avgpackage: '28.5 LPA' },
    dsa: [],
    technical: [
      {
        id: 'a-t-1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 95,
        question: 'Design a highly available shopping cart system that survives database crashes during a massive flash sale.',
        answer: 'Use a high-availability masterless distributed database like DynamoDB or Cassandra. Utilize eventual consistency and decentralized consensus to handle extreme traffic loads. Store temporary shopping cart updates locally inside cookies or local Redis caches, sinking batches down to DynamoDB asynchronously to protect database performance.',
        keyPoints: ['High Availability', 'DynamoDB Write Partitioning', 'Session States Management', 'Asynchronous DB Writing', 'Local Storage Syncing'],
        followUps: ['How do we prevent items from overselling during flash sales with synchronous stock constraints?', 'What are the trade-offs of storing shopping carts in local storage vs server database?']
      },
      {
        id: 'a-t-2',
        category: 'CS Fundamentals',
        difficulty: 'Intermediate',
        frequency: 80,
        question: 'Explain the difference between a Process and a Thread. Why is multi-threading important for an e-commerce backend?',
        answer: 'A process has its own isolated memory address space. Threads share the parent process\'s memory, making context switching and data sharing much cheaper. In an e-commerce backend handling thousands of concurrent requests, creating a new process per request consumes too much RAM. Thread pools (or async event loops) allow the server to handle many concurrent connections efficiently while sharing database connection pools and caches in memory.',
        keyPoints: ['Memory Isolation vs Shared Memory', 'Context Switching Overhead', 'Concurrency', 'Thread Pools', 'Resource Efficiency'],
        followUps: ['What is the Global Interpreter Lock (GIL) in Python?', 'How do you prevent Race Conditions when multiple threads update inventory?']
      }
    ],
    hr: [
      {
        id: 'a-hr-1',
        question: 'Tell me about a time you showed Ownership and went above and beyond your defined role.',
        modelAnswer: 'While building a student application, I noticed that database queries were loading entire user profiles repeatedly for each post on the dashboard. This wasted network bandwidth and degraded server loading times. Without being asked, I took Ownership of the issue, researched database optimizations, implemented MongoDB projection to only fetch necessary post summaries, and added a Redis cache for static profiles. This demonstrated Bias for Action by proactively solving the problem, and Frugality by optimizing resource usage. The result was a 45% reduction in average page latency and 70% reduction in database load.',
        aiTips: 'Hit specific Amazon Leadership Principles explicitly: Ownership, Bias for Action, Frugality, or Customer Obsession.',
        starTips: {
          situation: 'I noticed an inefficient database fetching pattern causing high server load.',
          task: 'It wasn\'t my ticket, but the system performance was degrading the user experience.',
          action: 'Demonstrated Bias for Action by implementing debouncing (300ms delay) on the frontend search bar, indexed database text search fields, and cached queries. Applied Frugality by reducing unnecessary database calls.',
          result: 'Reduced database query stress by 70% and eliminated lag, yielding extremely smooth, real-time query rendering. This proactive approach became a best practice for the team.'
        }
      }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    industry: 'Enterprise Software & OS',
    hiringRoles: ['Software Engineer', 'Program Manager', 'Security Researcher'],
    interviewRounds: ['Online Assessment', '2x Technical Coding', 'Hiring Manager Round'],
    salaryRange: '₹25L - ₹45L',
    brandColor: '#00A4EF',
    culture: 'Growth Mindset, Empathy, Diversity, Work-Life Balance',
    difficulty: 'High',
    completion: 80,
    stats: { placed: '115', avgpackage: '25.0 LPA' },
    dsa: [],
    technical: [
      {
        id: 'ms-t-1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 90,
        question: 'How would you design a real-time collaborative text editor like Microsoft Word Online?',
        answer: 'Real-time collaboration requires Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) to resolve concurrent edits without locks. I would use WebSockets for full-duplex communication between clients and the server. The server acts as a central authority ordering operations (OT). Caching active documents in Redis allows fast retrieval, while persisting snapshots to Azure Cosmos DB or Blob Storage periodically ensures durability.',
        keyPoints: ['Operational Transformation (OT)', 'CRDTs', 'WebSockets', 'Concurrency Control', 'Eventual Consistency'],
        followUps: ['How does OT resolve conflicting operations at the exact same index?', 'How do you handle a user making edits while offline?']
      }
    ],
    hr: [
      {
        id: 'ms-hr-1',
        question: 'Tell me about a time you used a "Growth Mindset" to overcome a difficult technical hurdle.',
        modelAnswer: 'While working on a Microsoft Teams integration project, I noticed that our API calls were being made synchronously, causing the UI to freeze during data fetches. I had never worked with asynchronous JavaScript patterns before. Instead of passing it off, I spent the weekend learning Promises and async/await concepts. I then refactored all API calls to be asynchronous and implemented loading states. This improved user experience significantly and reduced app crashes by 60%.',
        aiTips: 'Emphasize Microsoft values: Growth Mindset (learning and improving), Customer Obsession (improving UX), and technical excellence.',
        starTips: {
          situation: 'Our Teams integration had UI freezing issues due to synchronous API calls during data fetches.',
          task: 'I needed to fix the UI blocking, but lacked experience with asynchronous programming.',
          action: 'Researched async/await patterns, refactored all API calls to be asynchronous, implemented loading states and error handling.',
          result: 'Achieved a smooth UX, reduced crash rate by 60%, and expanded my own technical skill set.'
        }
      }
    ]
  }
];
