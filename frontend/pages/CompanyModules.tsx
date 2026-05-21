import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import {
  ShieldCheck,
  ChevronRight,
  Search,
  LayoutGrid,
  Unlock,
  CheckCircle2,
  Clock,
  Medal,
  Cpu,
  Terminal,
  Briefcase,
  ArrowLeft,
  Play,
  Pause,
  Bot,
  MessageSquare,
  FileText,
  Zap,
  BarChart3,
  BookOpen,
  Info,
  ChevronDown,
  Globe,
  ChevronLeft,
  Volume2,
  VolumeX,
  Bookmark,
  Sparkles,
  Award,
  TrendingUp,
  User,
  Star,
  Check,
  FileSpreadsheet,
  Grid,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronUp,
  BookMarked
} from 'lucide-react';

// --- Types & Interfaces ---

interface DSAQuestion {
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

interface TechQuestion {
  id: string;
  category: string;
  question: string;
  answer: string;
  keyPoints: string[];
  followUps: string[];
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  frequency: number;
}

interface HRQuestion {
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

interface Company {
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

// --- Extended & Premium Placement Database ---

const PREMIUM_COMPANIES: Company[] = [
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
        id: 'gt1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 95,
        question: 'Design a highly available distributed global rate limiter.',
        answer: 'Utilize the Token Bucket or Sliding Window Log algorithm. Use Redis Clusters to persist rate limiting keys globally, coupled with local in-memory caches to cut network latency. Implement consistent hashing to balance load across nodes, and handle local sync failures gracefully with fallback defaults.',
        keyPoints: ['Token Bucket or Sliding Window', 'Redis Distributed Counter', 'Consistent Hashing', 'Race Conditions (Redis transaction/Lua Scripting)', 'In-memory Cache (with low TTL)'],
        followUps: ['How do we handle rate-limiting sync across regions if Redis encounters networking partitions?', 'What is the memory consumption difference between a Sliding Window and a Fixed Window approach?']
      },
      {
        id: 'gt2',
        category: 'DBMS & Core CS',
        difficulty: 'Intermediate',
        frequency: 88,
        question: 'How do you handle horizontal database scaling (Sharding) and prevent massive re-allocations?',
        answer: 'Horizontal partitioning divides a table across multiple database engines (shards) based on a partition key. Using naive hashing (hash(key) % N) creates massive re-indexing overhead when scaling database instances. Consistent Hashing maps keys and shards onto a circular hash ring, ensuring that adding or removing a shard only affects a tiny fraction (1/N) of total dataset migrations.',
        keyPoints: ['Horizontal Scaling vs Vertical Scaling', 'Partition Keys', 'Consistent Hashing Ring', 'Virtual Nodes', 'Resharding Overheads'],
        followUps: ['How do you handle complex transaction queries spanning multiple shards?', 'What are the downfalls of selecting a poor sharding key like timestamp?']
      }
    ],
    hr: [
      {
        id: 'gh1',
        question: 'Tell me about a time you worked on a technically challenging project under severe ambiguity.',
        modelAnswer: 'In my third-year internship, I was tasked with designing a real-time data scraper without knowing the exact rate limits or page limits of host sites. I researched the problem from first principles, implemented a dynamic back-off algorithm (exponential decay) to prevent getting IP-blocked, structured the crawler using robust multi-threading, and successfully delivered a highly robust ETL pipeline that processed 50k nodes daily.',
        aiTips: 'Highlight Googliness: proactive curiosity, systematic handling of ambiguity, resilience, and data-driven prioritization.',
        starTips: {
          situation: 'Our university team was tasked with building a web engine without clear system requirements or API access to mock resources.',
          task: 'I had to architect a resilient client-side interface that could gracefully fail and simulate database calls cleanly.',
          action: 'I developed a solid mock service worker layer, researched best-practices on browser offline-states, and drafted an interactive client layer.',
          result: 'Achieved 100% developer operational efficiency during API downtime, allowing frontend and backend development to progress simultaneously.'
        }
      }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    industry: 'Cloud Computing & E-Commerce',
    hiringRoles: ['SDE I', 'Cloud Engineer', 'Operations Analyst', 'Solutions Architect'],
    interviewRounds: ['Online Assessment', 'Technical Coding Screen', 'Onsite Bar Raiser (LP-focused)'],
    salaryRange: '₹24L - ₹55L',
    brandColor: '#FF9900',
    culture: 'Customer Obsession, Ownership, Leadership Principles, Fast Delivery',
    difficulty: 'Elite',
    completion: 30,
    stats: { placed: '228', avgpackage: '29.2 LPA' },
    dsa: [
      {
        id: 'a1',
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        frequency: 96,
        tags: ['Linked List', 'Pointers'],
        input: '1 -> 2 -> 3 -> 4 -> 5',
        output: '5 -> 4 -> 3 -> 2 -> 1',
        approach: 'Maintain prev, curr, and next pointers. Iterate through the nodes, flipping direction arrows in-place.',
        time: 'O(N)',
        space: 'O(1)',
        visualizerType: 'linked-list',
        explanation: {
          intuition: 'Iterate through the list. For each node, point its next link backward to the previous node. Because this breaks the forward link, save a reference to the next node before modifying current pointers.',
          brute: 'Store elements inside an array list, reverse array list, then reconstruct a brand new linked list. Takes O(N) space.',
          optimized: 'Perform in-place reversal by managing 3 temporary pointers (prev, curr, nextNode). Constant O(1) extra memory.',
          dryRun: [
            'Initialize: prev=null, curr=Node(1)',
            'Step 1: nextNode=Node(2), curr.next=null (prev), prev=Node(1), curr=Node(2)',
            'Step 2: nextNode=Node(3), curr.next=Node(1) (prev), prev=Node(2), curr=Node(3)',
            'Step 3: nextNode=Node(4), curr.next=Node(2) (prev), prev=Node(3), curr=Node(4)',
            'Complete: Head becomes Node(5) pointing back sequentially to Node(1)'
          ],
          edgeCases: ['Empty linked list (null)', 'Single node linked list (no action required)', 'Highly cyclical linked list (causes infinite loops if handled poorly)'],
          tips: ['Clarify whether we need to reverse the list in-place or if we can return a new list.', 'Always write down the pointer reassignments on a board first to avoid NullPointerExceptions.']
        },
        code: {
          python: `def reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node\n    return prev`,
          java: `public ListNode reverseList(ListNode head) {\n    ListNode prev = null;\n    ListNode curr = head;\n    while (curr != null) {\n        ListNode nextTemp = curr.next;\n        curr.next = prev;\n        prev = curr;\n        curr = nextTemp;\n    }\n    return prev;\n}`
        }
      },
      {
        id: 'a2',
        title: 'Sort Array (Quick Sort)',
        difficulty: 'Medium',
        frequency: 85,
        tags: ['Sorting', 'Divide & Conquer', 'Recursion'],
        input: '[4, 2, 7, 3, 1, 6]',
        output: '[1, 2, 3, 4, 6, 7]',
        approach: 'Select a pivot element. Partition array such that elements smaller than pivot are left, larger are right. Recursively sort subsets.',
        time: 'O(N log N)',
        space: 'O(log N)',
        visualizerType: 'sorting',
        explanation: {
          intuition: 'Pick a pivot index. Divide the array into elements smaller than pivot and elements larger than pivot. Once partitioned, the pivot sits in its final sorted position. Repeat this dividing step recursively on the sub-arrays.',
          brute: 'Bubble Sort or Insertion Sort yielding O(N^2) time complexity under most datasets.',
          optimized: 'Quick Sort or Merge Sort. Quick Sort performs highly efficient in-place partitioning without needing O(N) extra merge buffers.',
          dryRun: [
            'Pick Pivot = 6 (Last Element)',
            'Partitioning: Left values <= 6, Right values > 6. Array becomes: [4, 2, 3, 1, 6, 7]',
            'Pivot 6 placed at index 4.',
            'Recursively sort Left [4, 2, 3, 1] and Right [7].',
            'Sub-partitioning sorts complete successfully!'
          ],
          edgeCases: ['Array already sorted (worst-case O(N^2) if pivot selection is naive)', 'Array reverse-sorted', 'Array containing identical elements'],
          tips: ['Use randomized pivot selection or median-of-three to avoid worst-case O(N^2) performance.', 'Mention in-place sorting optimizations to show strong system memory mastery.']
        },
        code: {
          python: `def quickSort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quickSort(left) + middle + quickSort(right)`,
          java: `public void quickSort(int[] arr, int begin, int end) {\n    if (begin < end) {\n        int partitionIndex = partition(arr, begin, end);\n        quickSort(arr, begin, partitionIndex-1);\n        quickSort(arr, partitionIndex+1, end);\n    }\n}\n\nprivate int partition(int[] arr, int begin, int end) {\n    int pivot = arr[end];\n    int i = (begin-1);\n    for (int j = begin; j < end; j++) {\n        if (arr[j] <= pivot) {\n            i++;\n            int swapTemp = arr[i];\n            arr[i] = arr[j];\n            arr[j] = swapTemp;\n        }\n    }\n    int swapTemp = arr[i+1];\n    arr[i+1] = arr[end];\n    arr[end] = swapTemp;\n    return i+1;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'at1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 93,
        question: 'Explain how a highly active, fault-tolerant shopping cart persists item states.',
        answer: 'Use a high-availability masterless distributed database like DynamoDB or Cassandra. Utilize eventual consistency and decentralized consensus to handle extreme traffic loads. Store temporary shopping cart updates locally inside cookies or local Redis caches, sinking batches down to DynamoDB asynchronously to protect database performance.',
        keyPoints: ['High Availability', 'DynamoDB Write Partitioning', 'Session States Management', 'Asynchronous DB Writing', 'Local Storage Syncing'],
        followUps: ['How do we prevent items from overselling during flash sales with synchronous stock constraints?', 'What are the trade-offs of storing shopping carts in local storage vs server database?']
      }
    ],
    hr: [
      {
        id: 'ah1',
        question: 'Describe a situation where you noticed an inefficiency in a project and fixed it without being asked.',
        modelAnswer: 'While building a student application, I realized that database queries were loading entire user profiles repeatedly for each post on the dashboard. This wasted network bandwidth and degraded server loading times. I researched database optimizations, implemented MongoDB projection to only fetch necessary post summaries, and added a Redis cache for static profiles. This reduced average page latency by 45%.',
        aiTips: 'Emphasize Amazon Leadership Principles: Ownership, Bias for Action, and Frugality.',
        starTips: {
          situation: 'Our team was building a dashboard that had highly laggy search results under large records.',
          task: 'I took the initiative to optimize API responses and search rendering logic.',
          action: 'Implemented debouncing (300ms delay) on the frontend search bar, indexed database text search fields, and cached queries.',
          result: 'Reduced database query stress by 70% and eliminated lag, yielding extremely smooth, real-time query rendering.'
        }
      }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    industry: 'Enterprise OS & Productivity',
    hiringRoles: ['SDE I', 'Systems Engineer', 'Integration Developer'],
    interviewRounds: ['Technical Assessment', '2x Codility Interviews', 'As Appropriate (AA) Round'],
    salaryRange: '₹22L - ₹48L',
    brandColor: '#00A4EF',
    culture: 'Growth Mindset, Empathy, Customer Obsession, Accessibility',
    difficulty: 'High',
    completion: 5,
    stats: { placed: '185', avgpackage: '26.0 LPA' },
    dsa: [
      {
        id: 'm1',
        title: 'Longest Palindromic Substring',
        difficulty: 'Medium',
        frequency: 91,
        tags: ['String', 'Dynamic Programming', 'Expand Center'],
        input: '"babad"',
        output: '"bab"',
        approach: 'Expand outwards from each character acting as a potential center, checking both odd and even palindrome centers.',
        time: 'O(N^2)',
        space: 'O(1)',
        visualizerType: 'dp',
        explanation: {
          intuition: 'A palindrome expands symmetrically from its center. We can iterate through the string and, for each index, assume it is either the single-character center (odd) or space-between center (even), expanding outward while character matches hold.',
          brute: 'Verify every possible substring individually. Reversing and checking each takes O(N^3) time.',
          optimized: 'Expand Around Center technique. Avoids the O(N^2) memory footprint required by standard 2D DP matrices.',
          dryRun: [
            'Center index 0 ("b"): Odd expansion -> "b"',
            'Center index 1 ("a"): Odd expansion -> expands to "bab" (valid) -> expands to "babad" (invalid)',
            'Center index 2 ("b"): Odd expansion -> expands to "aba" (valid) -> expands to "babad" (invalid)',
            'Compare all and return the maximum valid length substring: "bab" (or "aba")'
          ],
          edgeCases: ['Single character "a"', 'String containing all identical characters "aaaa"', 'Entire string is already a palindrome "racecar"'],
          tips: ['Always ask whether a case-sensitive palindrome is required (e.g. "AbA" vs "aba").', 'If space complexity is an absolute bottleneck, emphasize that the center expansion method cuts memory to O(1) compared to O(N^2) DP matrices.']
        },
        code: {
          python: `def longestPalindrome(s: str) -> str:\n    if not s or len(s) < 1: return ""\n    start, end = 0, 0\n    \n    def expand(left, right):\n        while left >= 0 and right < len(s) and s[left] == s[right]:\n            left -= 1\n            right += 1\n        return right - left - 1\n        \n    for i in range(len(s)):\n        len1 = expand(i, i)\n        len2 = expand(i, i + 1)\n        max_len = max(len1, len2)\n        if max_len > end - start:\n            start = i - (max_len - 1) // 2\n            end = i + max_len // 2\n    return s[start:end + 1]`,
          java: `public String longestPalindrome(String s) {\n    if (s == null || s.length() < 1) return "";\n    int start = 0, end = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int len1 = expandAroundCenter(s, i, i);\n        int len2 = expandAroundCenter(s, i, i + 1);\n        int len = Math.max(len1, len2);\n        if (len > end - start) {\n            start = i - (len - 1) / 2;\n            end = i + len / 2;\n        }\n    }\n    return s.substring(start, end + 1);\n}\n\nprivate int expandAroundCenter(String s, int left, int right) {\n    int L = left, R = right;\n    while (L >= 0 && R < s.length() && s.charAt(L) == s.charAt(R)) {\n        L--;\n        R++;\n    }\n    return R - L - 1;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'mt1',
        category: 'System Design',
        difficulty: 'Advanced',
        frequency: 91,
        question: 'How do you design a real-time collaborative chat dashboard for enterprise users?',
        answer: 'Use full-duplex WebSockets connections to broadcast instant messages. Implement a publish-subscribe architecture (Redis Pub/Sub or Apache Kafka) in the backend to route messages across different clusters. Persist chat history in horizontally scalable NoSQL databases (Cassandra) optimized for rapid writes. Integrate local SQLite cache on mobile/desktop applications to ensure offline availability and seamless sync.',
        keyPoints: ['WebSockets Connection Pooling', 'Kafka Message Queuing', 'Cassandra Partitioning Key', 'Offline SQLite Syncing', 'Global CDN Edge Caching'],
        followUps: ['How do you ensure message delivery guarantees (at-least-once vs exactly-once)?', 'How do you handle heavy media attachments (images/video) sharing efficiently within high-activity chat rooms?']
      }
    ],
    hr: [
      {
        id: 'mh1',
        question: 'Give an example of a time when you had to learn a completely new framework/technology in a very short timeline.',
        modelAnswer: 'During a hackathon, we decided to integrate an NLP model, which required writing backend logic in FastStream and Python. Having never built FastStream systems, I read the official documentation, consulted source examples, set up a simple API structure within 3 hours, and debugged connection bottlenecks. We successfully completed and deployed the integrated AI engine, winning the "Most Innovative Implementation" award.',
        aiTips: 'Emphasize Growth Mindset: curiosity, active self-directed learning, seeking feedback, and viewing setbacks as lessons.',
        starTips: {
          situation: 'Our project team had to quickly build interactive charts using complex SVG mathematics.',
          task: 'I had to learn detailed D3 coordinates and React SVG rendering in 48 hours.',
          action: 'I spent a day building basic coordinate mockups, studied SVG path commands, and created custom responsive components.',
          result: 'Delivered robust, dependency-free interactive dashboard analytics charts, boosting performance compared to heavy external charting libraries.'
        }
      }
    ]
  },
  {
    id: 'adobe',
    name: 'Adobe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Adobe_Corporate_Logo.png',
    industry: 'Creative Software & Digital Media',
    hiringRoles: ['SDE I', 'Frontend Engineer', 'ML Engineer', 'Data Scientist'],
    interviewRounds: ['Online Assessment', '2x Technical Coding', 'Hiring Manager Round'],
    salaryRange: '₹20L - ₹42L',
    brandColor: '#FF0000',
    culture: 'Creativity, Innovation, User Experience, Inclusion, Excellence',
    difficulty: 'High',
    completion: 15,
    stats: { placed: '96', avgpackage: '22.5 LPA' },
    dsa: [
      {
        id: 'ad1',
        title: 'Merge Intervals',
        difficulty: 'Medium',
        frequency: 92,
        tags: ['Array', 'Sorting', 'Greedy'],
        input: '[[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        approach: 'Sort intervals by start time, then merge overlapping intervals by comparing end times.',
        time: 'O(N log N)',
        space: 'O(N)',
        acceptanceRate: 78,
        estimatedRounds: 'Technical Round 1',
        visualizerType: 'sorting',
        explanation: {
          intuition: 'After sorting by start time, overlapping intervals become adjacent. We iterate and merge whenever the current interval start is less than or equal to the previous interval end.',
          brute: 'Compare every pair of intervals for overlap and merge iteratively. O(N^2) time complexity.',
          optimized: 'Sort by start time in O(N log N), then single-pass merge comparing current start with previous end. Total: O(N log N).',
          dryRun: [
            'Sort: [[1,3],[2,6],[8,10],[15,18]] (already sorted)',
            'Compare [1,3] and [2,6]: 2 <= 3, merge → [1,6]',
            'Compare [1,6] and [8,10]: 8 > 6, no overlap. Keep [8,10]',
            'Compare [8,10] and [15,18]: 15 > 10, no overlap. Keep [15,18]',
            'Result: [[1,6],[8,10],[15,18]]'
          ],
          edgeCases: ['Single interval input', 'All intervals overlap into one', 'No overlapping intervals', 'Intervals sharing exact endpoints [1,4],[4,5]'],
          tips: ['Clarify whether interval boundaries are inclusive or exclusive.', 'Mention sorting as a preprocessing step — interviewers want to see systematic thinking.']
        },
        code: {
          python: `def merge(intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for curr in intervals[1:]:\n        if curr[0] <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], curr[1])\n        else:\n            merged.append(curr)\n    return merged`,
          java: `public int[][] merge(int[][] intervals) {\n    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);\n    List<int[]> merged = new ArrayList<>();\n    merged.add(intervals[0]);\n    for (int i = 1; i < intervals.length; i++) {\n        int[] last = merged.get(merged.size() - 1);\n        if (intervals[i][0] <= last[1])\n            last[1] = Math.max(last[1], intervals[i][1]);\n        else merged.add(intervals[i]);\n    }\n    return merged.toArray(new int[0][]);\n}`
        }
      },
      {
        id: 'ad2',
        title: 'Two Sum',
        difficulty: 'Easy',
        frequency: 98,
        tags: ['Array', 'Hash Table'],
        input: '[2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        approach: 'Use a hash map to store complement values. For each element, check if target - element exists.',
        time: 'O(N)',
        space: 'O(N)',
        acceptanceRate: 92,
        estimatedRounds: 'Online Assessment',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'For each number, we need target - num. Store seen numbers in a hash map for O(1) lookup instead of nested searching.',
          brute: 'Nested loops checking all pairs. O(N^2) time complexity.',
          optimized: 'Single pass with hash map. Check if complement exists, if yes return indices, else store current.',
          dryRun: [
            'Index 0: num=2, comp=7. Map: {} → not found. Store {2:0}.',
            'Index 1: num=7, comp=2. Map: {2:0} → found! Return [0,1].'
          ],
          edgeCases: ['No valid solution', 'Negative numbers', 'Duplicate values in array', 'Array with exactly 2 elements'],
          tips: ['Ask if there is guaranteed exactly one solution.', 'Clarify whether the same element can be used twice.']
        },
        code: {
          python: `def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i\n    return []`,
          java: `public int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> map = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int comp = target - nums[i];\n        if (map.containsKey(comp))\n            return new int[]{map.get(comp), i};\n        map.put(nums[i], i);\n    }\n    return new int[]{};\n}`
        }
      }
    ],
    technical: [
      {
        id: 'adt1',
        category: 'OOPs & Design Patterns',
        question: 'Explain SOLID Principles with Real-world Examples',
        difficulty: 'Intermediate',
        frequency: 90,
        answer: 'SOLID stands for: Single Responsibility (one class, one job), Open-Closed (open for extension, closed for modification via interfaces), Liskov Substitution (child types must be substitutable for parent), Interface Segregation (prefer small, focused interfaces), and Dependency Inversion (depend on abstractions). In Adobe Creative Cloud, each filter follows SRP. Plugin architecture uses Open-Closed. Export formats implement a common interface (ISP).',
        keyPoints: ['Single Responsibility', 'Open-Closed Principle', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'],
        followUps: ['How would you refactor a god class that violates SRP?', 'Give an example where Liskov Substitution is violated.']
      },
      {
        id: 'adt2',
        category: 'Operating Systems',
        question: 'Explain Process vs Thread and Concurrency Models',
        difficulty: 'Intermediate',
        frequency: 85,
        answer: 'A process has its own memory address space. Threads share the parent process memory but have individual stacks and registers. Context switching between processes is expensive (TLB flush, page table swap). Thread switching is cheaper. Modern concurrency uses thread pools, async/await patterns, and event loops. Adobe uses multi-threaded rendering pipelines for real-time video processing in Premiere Pro.',
        keyPoints: ['Process Address Space Isolation', 'Thread Shared Memory', 'Context Switch Cost', 'Thread Pools', 'Async Event Loops'],
        followUps: ['What is a deadlock and how do you prevent it?', 'Explain the difference between concurrency and parallelism.']
      }
    ],
    hr: [
      {
        id: 'adh1',
        question: 'Tell me about a creative solution you implemented to solve a complex technical problem.',
        modelAnswer: 'During a college project, our image processing pipeline took 30+ seconds per batch. I researched Web Workers and proposed offloading computation to background threads. I implemented a worker pool pattern processing images in parallel, reducing batch time to under 5 seconds — an 83% improvement. This creative approach earned recognition and was adopted by two other project teams.',
        aiTips: 'Adobe values creativity and innovation. Show you think outside the box and combine technical skill with creative problem-solving.',
        starTips: {
          situation: 'Our team\'s image processing pipeline caused UI freezes and took 30+ seconds per batch.',
          task: 'Find an innovative way to handle heavy computation without blocking the main thread.',
          action: 'Researched Web Workers, designed a worker pool architecture, implemented parallel processing.',
          result: 'Reduced processing time by 83%, eliminated UI freezes, solution adopted by other teams.'
        }
      }
    ]
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: 'https://logo.clearbit.com/flipkart.com',
    industry: 'E-Commerce & Supply Chain',
    hiringRoles: ['SDE I', 'SDE II', 'Backend Engineer', 'Data Engineer'],
    interviewRounds: ['Online Coding Test', 'Machine Coding Round', '2x Technical DSA', 'Hiring Manager'],
    salaryRange: '₹18L - ₹38L',
    brandColor: '#F8E71C',
    culture: 'Customer First, Speed, Boldness, Data-Driven, Integrity',
    difficulty: 'High',
    completion: 10,
    stats: { placed: '174', avgpackage: '24.5 LPA' },
    dsa: [
      {
        id: 'fk1',
        title: 'Maximum Subarray (Kadane\'s Algorithm)',
        difficulty: 'Medium',
        frequency: 91,
        tags: ['Array', 'Dynamic Programming', 'Greedy'],
        input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]',
        output: '6',
        approach: 'Track current maximum subarray sum ending at each position. Reset when sum becomes negative.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 82,
        estimatedRounds: 'Technical Round 1',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'At each index, decide: extend the current subarray or start fresh from here. If the running sum drops below zero, starting fresh is always better.',
          brute: 'Check all possible subarrays with nested loops. O(N^2) or O(N^3) depending on implementation.',
          optimized: 'Kadane\'s Algorithm: maintain currentMax and globalMax. currentMax = max(nums[i], currentMax + nums[i]). globalMax = max(globalMax, currentMax).',
          dryRun: [
            'i=0: num=-2, currMax=-2, globalMax=-2',
            'i=1: num=1, currMax=max(1,-2+1)=1, globalMax=1',
            'i=2: num=-3, currMax=max(-3,1-3)=-2, globalMax=1',
            'i=3: num=4, currMax=max(4,-2+4)=4, globalMax=4',
            'i=4..6: Subarray [4,-1,2,1] yields currMax=6, globalMax=6'
          ],
          edgeCases: ['All negative numbers', 'Single element array', 'All positive numbers', 'Array with zeros'],
          tips: ['Ask if empty subarrays are allowed (sum = 0).', 'Mention divide and conquer O(N log N) as an alternative approach.']
        },
        code: {
          python: `def maxSubArray(nums):\n    curr_max = global_max = nums[0]\n    for num in nums[1:]:\n        curr_max = max(num, curr_max + num)\n        global_max = max(global_max, curr_max)\n    return global_max`,
          java: `public int maxSubArray(int[] nums) {\n    int currMax = nums[0], globalMax = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        currMax = Math.max(nums[i], currMax + nums[i]);\n        globalMax = Math.max(globalMax, currMax);\n    }\n    return globalMax;\n}`
        }
      },
      {
        id: 'fk2',
        title: 'LRU Cache',
        difficulty: 'Hard',
        frequency: 88,
        tags: ['Hash Table', 'Linked List', 'Design'],
        input: 'capacity=2, put(1,1), put(2,2), get(1), put(3,3)',
        output: 'get(1)→1, get(2)→-1',
        approach: 'Combine a doubly linked list (for ordering) with a hash map (for O(1) lookup). Move accessed nodes to front.',
        time: 'O(1)',
        space: 'O(capacity)',
        acceptanceRate: 65,
        estimatedRounds: 'Machine Coding Round',
        visualizerType: 'linked-list',
        explanation: {
          intuition: 'We need O(1) get and put. A hash map gives O(1) lookup. A doubly linked list lets us add/remove nodes in O(1). Combine both: map stores key→node, list maintains recency order.',
          brute: 'Use an array with timestamps. Search and evict oldest. O(N) per operation.',
          optimized: 'HashMap + Doubly Linked List. Head = most recently used. Tail = least recently used. On access, move node to head. On capacity overflow, remove tail.',
          dryRun: [
            'put(1,1): Add node(1,1) to head. Map: {1→node}',
            'put(2,2): Add node(2,2) to head. Map: {1→node, 2→node}. List: [2,1]',
            'get(1): Found in map. Move node(1) to head. List: [1,2]. Return 1',
            'put(3,3): Capacity full. Evict tail (node 2). Add node(3,3) to head. List: [3,1]',
            'get(2): Not in map. Return -1'
          ],
          edgeCases: ['Capacity of 1', 'Updating existing key value', 'Getting non-existent key', 'Rapid sequential puts exceeding capacity'],
          tips: ['Draw the linked list on a whiteboard to show pointer manipulation clearly.', 'Use sentinel head/tail nodes to simplify edge case handling at boundaries.']
        },
        code: {
          python: `class LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.cache = {}\n        self.order = collections.OrderedDict()\n\n    def get(self, key):\n        if key not in self.cache: return -1\n        self.order.move_to_end(key)\n        return self.cache[key]\n\n    def put(self, key, value):\n        if key in self.cache:\n            self.order.move_to_end(key)\n        self.cache[key] = value\n        self.order[key] = None\n        if len(self.cache) > self.cap:\n            oldest = next(iter(self.order))\n            del self.cache[oldest]\n            del self.order[oldest]`,
          java: `class LRUCache extends LinkedHashMap<Integer, Integer> {\n    private int capacity;\n    public LRUCache(int capacity) {\n        super(capacity, 0.75f, true);\n        this.capacity = capacity;\n    }\n    public int get(int key) {\n        return super.getOrDefault(key, -1);\n    }\n    public void put(int key, int value) {\n        super.put(key, value);\n    }\n    @Override\n    protected boolean removeEldestEntry(Map.Entry e) {\n        return size() > capacity;\n    }\n}`
        }
      }
    ],
    technical: [
      {
        id: 'fkt1',
        category: 'System Design',
        question: 'Design a Real-time Inventory Management System',
        difficulty: 'Advanced',
        frequency: 92,
        answer: 'Use event-driven architecture with Apache Kafka for real-time inventory updates. Redis for caching current stock levels. PostgreSQL for persistent storage. Implement optimistic locking to prevent overselling during flash sales. Use CQRS pattern to separate read (product listing) and write (order placement) paths for scalability.',
        keyPoints: ['Event-Driven Architecture', 'Kafka Streaming', 'Redis Cache Layer', 'Optimistic Locking', 'CQRS Pattern'],
        followUps: ['How do you handle inventory sync across multiple warehouses?', 'What happens during a flash sale with 100K concurrent requests?']
      }
    ],
    hr: [
      {
        id: 'fkh1',
        question: 'Describe a time when you had to deliver results under extreme time pressure.',
        modelAnswer: 'During our college hackathon, our team\'s backend crashed 4 hours before the deadline. I took ownership, quickly identified the issue as a database connection pool exhaustion, implemented connection pooling with HikariCP, added request rate limiting, and restored service within 90 minutes. We still delivered our presentation on time and won second place.',
        aiTips: 'Flipkart values Speed and Boldness. Show you can make quick decisions under pressure without sacrificing quality.',
        starTips: {
          situation: 'Our hackathon project\'s backend crashed 4 hours before the final presentation deadline.',
          task: 'Diagnose the root cause and restore service while maintaining feature completeness.',
          action: 'Identified connection pool exhaustion, implemented HikariCP pooling, added rate limiting.',
          result: 'Restored service in 90 minutes, delivered on time, won second place among 50+ teams.'
        }
      }
    ]
  },
  {
    id: 'goldman',
    name: 'Goldman Sachs',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg',
    industry: 'Investment Banking & Financial Technology',
    hiringRoles: ['Software Engineer', 'Quantitative Analyst', 'Platform Engineer'],
    interviewRounds: ['HackerRank Coding Test', 'Coderpad Interview', 'Technical + Behavioral', 'Superday'],
    salaryRange: '₹22L - ₹45L',
    brandColor: '#6FA8DC',
    culture: 'Client Service, Integrity, Excellence, Teamwork, Partnership',
    difficulty: 'Elite',
    completion: 8,
    stats: { placed: '64', avgpackage: '28.0 LPA' },
    dsa: [
      {
        id: 'gs1',
        title: 'Best Time to Buy and Sell Stock',
        difficulty: 'Easy',
        frequency: 95,
        tags: ['Array', 'Dynamic Programming', 'Greedy'],
        input: '[7, 1, 5, 3, 6, 4]',
        output: '5',
        approach: 'Track minimum price seen so far. At each step, calculate potential profit and update maximum.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 88,
        estimatedRounds: 'HackerRank Test',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'We want to buy low and sell high. Track the lowest price seen and at each day compute profit if we sold today. Keep the maximum profit.',
          brute: 'Check all pairs (buy day i, sell day j where j > i). O(N^2) time.',
          optimized: 'Single pass: maintain minPrice and maxProfit. For each price, update minPrice = min(minPrice, price) and maxProfit = max(maxProfit, price - minPrice).',
          dryRun: [
            'Day 0: price=7, minPrice=7, maxProfit=0',
            'Day 1: price=1, minPrice=1, maxProfit=0',
            'Day 2: price=5, profit=5-1=4, maxProfit=4',
            'Day 3: price=3, profit=3-1=2, maxProfit=4',
            'Day 4: price=6, profit=6-1=5, maxProfit=5 ✓'
          ],
          edgeCases: ['Prices only decrease (profit = 0)', 'Single day', 'All prices identical', 'Two days only'],
          tips: ['Clarify if short selling is allowed (sell before buy).', 'Ask about transaction fees if this is a follow-up question.']
        },
        code: {
          python: `def maxProfit(prices):\n    min_price = float('inf')\n    max_profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        max_profit = max(max_profit, price - min_price)\n    return max_profit`,
          java: `public int maxProfit(int[] prices) {\n    int minPrice = Integer.MAX_VALUE, maxProfit = 0;\n    for (int price : prices) {\n        minPrice = Math.min(minPrice, price);\n        maxProfit = Math.max(maxProfit, price - minPrice);\n    }\n    return maxProfit;\n}`
        }
      },
      {
        id: 'gs2',
        title: 'Trapping Rain Water',
        difficulty: 'Hard',
        frequency: 87,
        tags: ['Array', 'Two Pointers', 'Stack', 'DP'],
        input: '[0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        approach: 'For each bar, water trapped = min(maxLeft, maxRight) - height. Use two pointers to compute in O(1) space.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 58,
        estimatedRounds: 'Technical Interview',
        visualizerType: 'sorting',
        explanation: {
          intuition: 'Water above any bar is bounded by the shorter of the tallest bars on its left and right. We precompute or dynamically track these maximums.',
          brute: 'For each element, scan left and right to find max heights. O(N^2) time.',
          optimized: 'Two-pointer approach: left and right pointers move inward. Track leftMax and rightMax. Process the side with smaller max (water is bounded by the smaller side).',
          dryRun: [
            'L=0,R=11: leftMax=0,rightMax=1. Process left. No water (height=0, leftMax=0).',
            'L=1: leftMax=1. Continue...',
            'L=2: height=0 < leftMax=1. Water += 1-0 = 1.',
            'Process continues, accumulating water at each valley.',
            'Total water trapped = 6 units.'
          ],
          edgeCases: ['Monotonically increasing/decreasing', 'All same height', 'Empty or single bar', 'Very tall single bar in middle'],
          tips: ['Draw the elevation map on whiteboard to visualize water accumulation.', 'Mention stack-based approach as an alternative O(N) solution.']
        },
        code: {
          python: `def trap(height):\n    left, right = 0, len(height) - 1\n    left_max = right_max = water = 0\n    while left < right:\n        if height[left] < height[right]:\n            if height[left] >= left_max:\n                left_max = height[left]\n            else:\n                water += left_max - height[left]\n            left += 1\n        else:\n            if height[right] >= right_max:\n                right_max = height[right]\n            else:\n                water += right_max - height[right]\n            right -= 1\n    return water`,
          java: `public int trap(int[] height) {\n    int left = 0, right = height.length - 1;\n    int leftMax = 0, rightMax = 0, water = 0;\n    while (left < right) {\n        if (height[left] < height[right]) {\n            leftMax = Math.max(leftMax, height[left]);\n            water += leftMax - height[left++];\n        } else {\n            rightMax = Math.max(rightMax, height[right]);\n            water += rightMax - height[right--];\n        }\n    }\n    return water;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'gst1',
        category: 'DBMS & SQL',
        question: 'Explain ACID Properties and Transaction Isolation Levels',
        difficulty: 'Intermediate',
        frequency: 93,
        answer: 'ACID: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don\'t interfere), Durability (committed data persists). Isolation levels: Read Uncommitted (dirty reads possible), Read Committed (no dirty reads), Repeatable Read (no phantom reads within transaction), Serializable (full isolation, slowest). Financial systems like Goldman\'s trading platforms use Serializable for critical transactions.',
        keyPoints: ['Atomicity & Rollback', 'Consistency Constraints', 'Isolation Levels', 'Write-Ahead Logging', 'MVCC (Multi-Version Concurrency)'],
        followUps: ['What is the performance trade-off between Read Committed and Serializable?', 'How does PostgreSQL implement MVCC internally?']
      }
    ],
    hr: [
      {
        id: 'gsh1',
        question: 'Tell me about a situation where you had to make a difficult ethical decision in a team project.',
        modelAnswer: 'During a group project, a teammate suggested copying code from an open-source project without attribution. I understood the time pressure but explained the importance of intellectual property and academic integrity. I proposed we use the library properly with correct licensing and attribution, and I volunteered to handle the integration myself to save time. The team agreed, and we delivered a fully compliant, well-documented solution.',
        aiTips: 'Goldman Sachs deeply values Integrity and Partnership. Show ethical judgment, transparency, and collaborative resolution.',
        starTips: {
          situation: 'A teammate proposed using open-source code without proper attribution under deadline pressure.',
          task: 'Address the ethical concern while maintaining team morale and meeting the deadline.',
          action: 'Explained IP importance, proposed proper licensing, volunteered to handle the integration.',
          result: 'Delivered a fully compliant solution on time, strengthened team\'s approach to ethical coding.'
        }
      }
    ]
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Atlassian_Logo.svg',
    industry: 'Enterprise Collaboration Software',
    hiringRoles: ['SDE I', 'Full Stack Engineer', 'Platform Engineer', 'SRE'],
    interviewRounds: ['Values Interview', 'Technical Phone Screen', 'Coding Challenge', 'System Design'],
    salaryRange: '₹25L - ₹52L',
    brandColor: '#0052CC',
    culture: 'Open Company No Bullshit, Build with Heart and Balance, Play as a Team, Don\'t #@!% the Customer',
    difficulty: 'Elite',
    completion: 12,
    stats: { placed: '48', avgpackage: '32.0 LPA' },
    dsa: [
      {
        id: 'at1',
        title: 'Clone Graph (BFS Traversal)',
        difficulty: 'Medium',
        frequency: 86,
        tags: ['Graph', 'BFS', 'Hash Map'],
        input: 'adjacency: [[2,4],[1,3],[2,4],[1,3]]',
        output: 'Deep copy of entire graph',
        approach: 'BFS traversal with a hash map mapping original nodes to cloned nodes. Clone neighbors as you traverse.',
        time: 'O(V + E)',
        space: 'O(V)',
        acceptanceRate: 72,
        estimatedRounds: 'Coding Challenge',
        visualizerType: 'graph',
        explanation: {
          intuition: 'Traverse the graph (BFS/DFS). For each node, create a clone if not already created. Use a hash map to track original → clone mapping to avoid infinite loops in cyclic graphs.',
          brute: 'Serialize the graph to a string/JSON, then deserialize into new objects. Wastes memory and is fragile.',
          optimized: 'BFS with HashMap<Node, ClonedNode>. Start from any node, clone it, add to queue. For each neighbor: if not cloned yet, clone and enqueue. Link cloned neighbors.',
          dryRun: [
            'Start BFS from Node 1. Clone Node 1\'. Map: {1→1\'}. Queue: [1]',
            'Process Node 1. Neighbors: [2,4]. Clone 2\' and 4\'. Link 1\'→[2\',4\']. Queue: [2,4]',
            'Process Node 2. Neighbors: [1,3]. 1\' exists. Clone 3\'. Link 2\'→[1\',3\']. Queue: [4,3]',
            'Process Node 4. Neighbors: [1,3]. Both exist. Link 4\'→[1\',3\'].',
            'Process Node 3. Neighbors: [2,4]. Both exist. Link 3\'→[2\',4\']. Graph fully cloned!'
          ],
          edgeCases: ['Empty graph (null input)', 'Single node with self-loop', 'Disconnected components', 'Very large cyclic graph'],
          tips: ['Emphasize the hash map prevents infinite loops in cycles.', 'Mention both BFS and DFS approaches and their trade-offs.']
        },
        code: {
          python: `def cloneGraph(node):\n    if not node: return None\n    cloned = {node: Node(node.val)}\n    queue = deque([node])\n    while queue:\n        curr = queue.popleft()\n        for neighbor in curr.neighbors:\n            if neighbor not in cloned:\n                cloned[neighbor] = Node(neighbor.val)\n                queue.append(neighbor)\n            cloned[curr].neighbors.append(cloned[neighbor])\n    return cloned[node]`,
          java: `public Node cloneGraph(Node node) {\n    if (node == null) return null;\n    Map<Node, Node> map = new HashMap<>();\n    map.put(node, new Node(node.val));\n    Queue<Node> queue = new LinkedList<>();\n    queue.add(node);\n    while (!queue.isEmpty()) {\n        Node curr = queue.poll();\n        for (Node neighbor : curr.neighbors) {\n            if (!map.containsKey(neighbor)) {\n                map.put(neighbor, new Node(neighbor.val));\n                queue.add(neighbor);\n            }\n            map.get(curr).neighbors.add(map.get(neighbor));\n        }\n    }\n    return map.get(node);\n}`
        }
      },
      {
        id: 'at2',
        title: 'Course Schedule (Topological Sort)',
        difficulty: 'Medium',
        frequency: 84,
        tags: ['Graph', 'Topological Sort', 'BFS'],
        input: 'numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]',
        output: 'true (can finish all courses)',
        approach: 'Build a directed graph from prerequisites. Use Kahn\'s algorithm (BFS topological sort) to detect cycles.',
        time: 'O(V + E)',
        space: 'O(V + E)',
        acceptanceRate: 68,
        estimatedRounds: 'Technical Phone Screen',
        visualizerType: 'graph',
        explanation: {
          intuition: 'Prerequisites form a directed graph. If there\'s a cycle, some courses can never be completed. Topological sort processes nodes with no incoming edges first — if all nodes are processed, no cycle exists.',
          brute: 'Try all permutations of course orderings. Exponential time.',
          optimized: 'Kahn\'s Algorithm: compute in-degrees. Start with nodes having in-degree 0. Process each, decrementing neighbors\' in-degrees. If processed count equals total nodes, no cycle.',
          dryRun: [
            'Build graph: 0→[1,2], 1→[3], 2→[3]. In-degrees: {0:0, 1:1, 2:1, 3:2}',
            'Queue starts with [0] (in-degree 0). Process 0, decrement 1 and 2.',
            'In-degrees: {1:0, 2:0, 3:2}. Queue: [1, 2].',
            'Process 1, decrement 3. Process 2, decrement 3. In-degree of 3 → 0.',
            'Process 3. All 4 courses processed. Return true!'
          ],
          edgeCases: ['No prerequisites', 'Circular dependency (cycle)', 'Isolated courses', 'Single course'],
          tips: ['Mention both DFS (cycle detection via recursion stack) and BFS (Kahn\'s) approaches.', 'Ask if the interviewer wants to return the actual course order or just feasibility.']
        },
        code: {
          python: `def canFinish(numCourses, prerequisites):\n    graph = defaultdict(list)\n    in_degree = [0] * numCourses\n    for dest, src in prerequisites:\n        graph[src].append(dest)\n        in_degree[dest] += 1\n    queue = deque([i for i in range(numCourses) if in_degree[i] == 0])\n    count = 0\n    while queue:\n        node = queue.popleft()\n        count += 1\n        for neighbor in graph[node]:\n            in_degree[neighbor] -= 1\n            if in_degree[neighbor] == 0:\n                queue.append(neighbor)\n    return count == numCourses`,
          java: `public boolean canFinish(int n, int[][] prereqs) {\n    List<List<Integer>> graph = new ArrayList<>();\n    int[] inDeg = new int[n];\n    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());\n    for (int[] p : prereqs) {\n        graph.get(p[1]).add(p[0]);\n        inDeg[p[0]]++;\n    }\n    Queue<Integer> q = new LinkedList<>();\n    for (int i = 0; i < n; i++) if (inDeg[i] == 0) q.add(i);\n    int count = 0;\n    while (!q.isEmpty()) {\n        int node = q.poll(); count++;\n        for (int nb : graph.get(node))\n            if (--inDeg[nb] == 0) q.add(nb);\n    }\n    return count == n;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'att1',
        category: 'System Design',
        question: 'Design a Distributed Task Queue (like Jira Workflows)',
        difficulty: 'Advanced',
        frequency: 89,
        answer: 'Use a message broker (RabbitMQ/Kafka) for task distribution. Workers consume tasks from queues with acknowledgment-based processing. Implement dead letter queues for failed tasks. Use Redis for task state tracking and deduplication. Horizontal scaling of workers based on queue depth. Implement priority queues for urgent tasks and backpressure mechanisms to prevent worker overload.',
        keyPoints: ['Message Broker Architecture', 'Worker Pool Scaling', 'Dead Letter Queues', 'Task Deduplication', 'Backpressure Handling'],
        followUps: ['How do you handle task ordering guarantees?', 'What happens when a worker crashes mid-task?']
      }
    ],
    hr: [
      {
        id: 'ath1',
        question: 'Tell me about a time you had to give honest, direct feedback to someone — even when it was uncomfortable.',
        modelAnswer: 'In a team project, a teammate was consistently submitting code without tests, causing CI failures. Instead of escalating, I had a direct one-on-one conversation, sharing specific examples and the impact on the team. I offered to pair-program on writing tests together. They appreciated the honesty, and within a week, they were writing tests independently. Our CI pass rate improved from 60% to 95%.',
        aiTips: 'Atlassian values "Open Company, No Bullshit." Show direct communication, empathy, and constructive approach.',
        starTips: {
          situation: 'A teammate consistently pushed untested code, causing 40% of CI builds to fail.',
          task: 'Address the issue directly without damaging the relationship or team morale.',
          action: 'Had an honest 1:1 with specific examples, offered to pair-program on testing practices.',
          result: 'Teammate adopted testing habits independently, CI pass rate improved from 60% to 95%.'
        }
      }
    ]
  },
  {
    id: 'tcs',
    name: 'TCS',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/512px-Tata_Consultancy_Services_Logo.svg.png',
    industry: 'IT Services & Consulting',
    hiringRoles: ['System Engineer', 'Digital Engineer', 'Assistant Consultant'],
    interviewRounds: ['TCS NQT (National Qualifier Test)', 'Technical Interview', 'HR Round'],
    salaryRange: '₹3.6L - ₹11L',
    brandColor: '#0072C6',
    culture: 'Integrity, Respect, Excellence, Learning, Pioneering',
    difficulty: 'Moderate',
    completion: 35,
    stats: { placed: '520', avgpackage: '7.2 LPA' },
    dsa: [
      {
        id: 'tcs1',
        title: 'Fibonacci Number',
        difficulty: 'Easy',
        frequency: 90,
        tags: ['Recursion', 'Dynamic Programming', 'Math'],
        input: 'n = 6',
        output: '8',
        approach: 'Use iterative DP to compute Fibonacci in O(N) time and O(1) space.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 95,
        estimatedRounds: 'TCS NQT',
        visualizerType: 'dp',
        explanation: {
          intuition: 'Each Fibonacci number is the sum of the two preceding numbers. F(n) = F(n-1) + F(n-2). Instead of recursion (exponential), iterate and keep only the last two values.',
          brute: 'Recursive approach: fib(n) = fib(n-1) + fib(n-2). O(2^N) time due to overlapping subproblems.',
          optimized: 'Iterative with two variables: prev1 and prev2. Swap and add each iteration. O(N) time, O(1) space.',
          dryRun: [
            'F(0) = 0, F(1) = 1',
            'F(2) = F(1) + F(0) = 1',
            'F(3) = F(2) + F(1) = 2',
            'F(4) = F(3) + F(2) = 3',
            'F(5) = F(4) + F(3) = 5, F(6) = F(5) + F(4) = 8'
          ],
          edgeCases: ['n = 0 (return 0)', 'n = 1 (return 1)', 'Very large n (use modular arithmetic)'],
          tips: ['Mention memoization vs tabulation trade-offs.', 'For very large N, mention matrix exponentiation O(log N) approach.']
        },
        code: {
          python: `def fib(n):\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b`,
          java: `public int fib(int n) {\n    if (n <= 1) return n;\n    int a = 0, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}`
        }
      },
      {
        id: 'tcs2',
        title: 'Palindrome String Check',
        difficulty: 'Easy',
        frequency: 88,
        tags: ['String', 'Two Pointers'],
        input: '"racecar"',
        output: 'true',
        approach: 'Use two pointers from start and end, compare characters moving inward.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 96,
        estimatedRounds: 'TCS NQT',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'A palindrome reads the same forwards and backwards. Compare first with last character, second with second-to-last, etc. If all match, it is a palindrome.',
          brute: 'Reverse the string and compare. O(N) time and O(N) space for the reversed copy.',
          optimized: 'Two pointers: left from start, right from end. Compare s[left] == s[right]. Move inward. O(1) extra space.',
          dryRun: [
            'left=0 (r), right=6 (r) → match',
            'left=1 (a), right=5 (a) → match',
            'left=2 (c), right=4 (c) → match',
            'left=3 (e), right=3 (e) → match, pointers crossed',
            'All matched. Return true!'
          ],
          edgeCases: ['Empty string', 'Single character', 'Even length palindrome', 'Case sensitivity ("Racecar")'],
          tips: ['Ask whether the check should be case-insensitive.', 'Ask if non-alphanumeric characters should be ignored.']
        },
        code: {
          python: `def isPalindrome(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        if s[left] != s[right]:\n            return False\n        left += 1\n        right -= 1\n    return True`,
          java: `public boolean isPalindrome(String s) {\n    int left = 0, right = s.length() - 1;\n    while (left < right) {\n        if (s.charAt(left) != s.charAt(right))\n            return false;\n        left++;\n        right--;\n    }\n    return true;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'tcst1',
        category: 'SQL & Databases',
        question: 'What is Normalization in DBMS? Explain Normal Forms.',
        difficulty: 'Basic',
        frequency: 95,
        answer: 'Normalization organizes database tables to minimize redundancy. 1NF: Atomic values only (no repeating groups). 2NF: 1NF + no partial dependencies (all non-key attributes depend on full primary key). 3NF: 2NF + no transitive dependencies (non-key attributes don\'t depend on other non-key attributes). BCNF: Every determinant is a candidate key. Example: separating Student(id, name) and Enrollment(student_id, course_id) eliminates redundancy.',
        keyPoints: ['1NF: Atomic Values', '2NF: No Partial Dependencies', '3NF: No Transitive Dependencies', 'BCNF: Strict Key Dependency', 'Denormalization Trade-offs'],
        followUps: ['When would you choose denormalization over normalization?', 'What problems does over-normalization create?']
      }
    ],
    hr: [
      {
        id: 'tcsh1',
        question: 'Why do you want to join TCS and how do you see your career growing here?',
        modelAnswer: 'TCS\'s global presence across 46+ countries offers unmatched exposure to diverse industries. I\'m drawn to the TCS Digital program for its focus on emerging technologies like AI, cloud, and blockchain. I see myself growing from a strong engineering foundation to eventually leading cross-functional teams on global client projects, leveraging TCS\'s renowned learning culture and Career 4.0 framework.',
        aiTips: 'TCS values Learning and Pioneering. Show genuine interest in their global scale, technology initiatives, and long-term career growth.',
        starTips: {
          situation: 'Researching companies for campus placement, I needed to find the best fit for long-term growth.',
          task: 'Evaluate which company aligned with my goals of global exposure and technical depth.',
          action: 'Studied TCS\'s Digital initiatives, spoke with alumni, and mapped my career aspirations to their growth framework.',
          result: 'Identified TCS as the ideal platform for building both technical expertise and leadership skills globally.'
        }
      }
    ]
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
    industry: 'IT Services & Digital Transformation',
    hiringRoles: ['Systems Engineer', 'Power Programmer', 'Digital Specialist'],
    interviewRounds: ['InfyTQ / HackWithInfy', 'Technical Interview', 'HR Interview'],
    salaryRange: '₹3.6L - ₹12L',
    brandColor: '#007CC3',
    culture: 'Client Value, Leadership by Example, Integrity, Fairness, Excellence',
    difficulty: 'Moderate',
    completion: 40,
    stats: { placed: '680', avgpackage: '6.8 LPA' },
    dsa: [
      {
        id: 'inf1',
        title: 'Reverse a String',
        difficulty: 'Easy',
        frequency: 92,
        tags: ['String', 'Two Pointers', 'Array'],
        input: '["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        approach: 'Two pointers from both ends, swap characters until they meet in the middle.',
        time: 'O(N)',
        space: 'O(1)',
        acceptanceRate: 97,
        estimatedRounds: 'InfyTQ Test',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'Place two pointers at the start and end. Swap the characters at both pointers. Move inward. Repeat until pointers cross.',
          brute: 'Create a new reversed copy. O(N) extra space.',
          optimized: 'In-place swap with two pointers. O(1) extra space. Swap s[left] and s[right], increment left, decrement right.',
          dryRun: [
            'left=0 (h), right=4 (o) → swap → [o,e,l,l,h]',
            'left=1 (e), right=3 (l) → swap → [o,l,l,e,h]',
            'left=2, right=2 → pointers meet. Done!'
          ],
          edgeCases: ['Empty string', 'Single character', 'Already a palindrome', 'String with spaces'],
          tips: ['Clarify if modifying in-place is required or if a new string is acceptable.', 'In Java, strings are immutable — use char array.']
        },
        code: {
          python: `def reverseString(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1\n        right -= 1`,
          java: `public void reverseString(char[] s) {\n    int left = 0, right = s.length - 1;\n    while (left < right) {\n        char temp = s[left];\n        s[left++] = s[right];\n        s[right--] = temp;\n    }\n}`
        }
      },
      {
        id: 'inf2',
        title: 'Binary Search',
        difficulty: 'Easy',
        frequency: 94,
        tags: ['Array', 'Binary Search', 'Divide & Conquer'],
        input: '[-1,0,3,5,9,12], target = 9',
        output: '4',
        approach: 'Maintain left and right boundaries. Compare middle element with target. Halve search space each iteration.',
        time: 'O(log N)',
        space: 'O(1)',
        acceptanceRate: 93,
        estimatedRounds: 'Technical Interview',
        visualizerType: 'sliding-window',
        explanation: {
          intuition: 'In a sorted array, comparing the middle element with target tells us which half to discard. This halving gives logarithmic time.',
          brute: 'Linear scan through entire array. O(N) time.',
          optimized: 'Binary Search: mid = (left + right) / 2. If nums[mid] == target, found. If nums[mid] < target, search right half. Else search left half.',
          dryRun: [
            'left=0, right=5, mid=2: nums[2]=3 < 9. Search right: left=3',
            'left=3, right=5, mid=4: nums[4]=9 == target. Found at index 4!'
          ],
          edgeCases: ['Target not in array', 'Single element array', 'Target at boundaries', 'Integer overflow in mid calculation'],
          tips: ['Use mid = left + (right - left) / 2 to prevent integer overflow.', 'Clarify if duplicates exist and which occurrence to return.']
        },
        code: {
          python: `def search(nums, target):\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = left + (right - left) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1`,
          java: `public int search(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}`
        }
      }
    ],
    technical: [
      {
        id: 'inft1',
        category: 'Computer Networks',
        question: 'Explain the OSI Model and TCP/IP Protocol Stack',
        difficulty: 'Basic',
        frequency: 94,
        answer: 'OSI has 7 layers: Physical (bits), Data Link (frames, MAC), Network (packets, IP routing), Transport (segments, TCP/UDP), Session (connection management), Presentation (encryption, compression), Application (HTTP, FTP). TCP/IP simplifies to 4 layers: Network Access, Internet, Transport, Application. TCP provides reliable ordered delivery with 3-way handshake. UDP provides fast, connectionless, best-effort delivery.',
        keyPoints: ['7 OSI Layers', 'TCP vs UDP', '3-Way Handshake', 'IP Addressing & Routing', 'DNS Resolution'],
        followUps: ['What happens when you type google.com in a browser?', 'When would you choose UDP over TCP?']
      }
    ],
    hr: [
      {
        id: 'infh1',
        question: 'Where do you see yourself in 5 years and how does Infosys fit into that plan?',
        modelAnswer: 'In 5 years, I aim to be a technical lead managing complex digital transformation projects. Infosys\'s focus on continuous learning through platforms like Lex and InfyTQ aligns with my growth goals. I plan to gain deep expertise in cloud architecture through Infosys\'s Cobalt initiative, earn relevant certifications, and transition from individual contributor to a mentor who helps junior engineers grow.',
        aiTips: 'Infosys values Leadership by Example and Excellence. Show ambition, alignment with company programs, and desire to uplift others.',
        starTips: {
          situation: 'Planning my career trajectory during final year, I needed a company offering structured growth.',
          task: 'Find an organization where I could grow from engineer to technical leader within 5 years.',
          action: 'Researched Infosys\'s Lex platform, Cobalt initiative, and career progression frameworks.',
          result: 'Mapped a clear 5-year path: 2 years deep tech, 1 year specialization, 2 years leadership transition.'
        }
      }
    ]
  }
];

const CompanyModules: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Sidebar state
  const [activeTab, setActiveTab] = useState<'companies' | 'dsa' | 'tech' | 'hr' | 'resume' | 'mock' | 'progress'>('companies');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [savedQuestions, setSavedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('studlyf_saved_questions');
    return saved ? JSON.parse(saved) : [];
  });

  // Track user progress
  const [solvedQuestions, setSolvedQuestions] = useState<string[]>(() => {
    const solved = localStorage.getItem('studlyf_solved_questions');
    return solved ? JSON.parse(solved) : [];
  });
  const [streaks, setStreaks] = useState(5); // mock streak

  // --- Dynamic DSA Visualizer States ---
  const [selectedQuestion, setSelectedQuestion] = useState<DSAQuestion | null>(null);
  const [visStep, setVisStep] = useState(0);
  const [visPlaying, setVisPlaying] = useState(false);
  const [visSpeed, setVisSpeed] = useState(1000); // ms
  const [customInput, setCustomInput] = useState('');
  const [visualizerState, setVisualizerState] = useState<any>(null);
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'java' | 'cpp' | 'javascript'>('python');
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Tech Round States ---
  const [activeTechIndex, setActiveTechIndex] = useState<number | null>(null);
  const [speechSpeaking, setSpeechSpeaking] = useState<string | null>(null); // tracks active tech question id
  const [techQuizMode, setTechQuizMode] = useState(false);
  const [techQuizScore, setTechQuizScore] = useState<number | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{ [key: string]: string }>({});
  const [techFlashcardsMode, setTechFlashcardsMode] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // --- HR Round States ---
  const [hrAnswer, setHrAnswer] = useState('');
  const [hrEvaluation, setHrEvaluation] = useState<any>(null);
  const [evaluatingHr, setEvaluatingHr] = useState(false);
  const [starTab, setStarTab] = useState<'S' | 'T' | 'A' | 'R'>('S');
  const [starInputs, setStarInputs] = useState({ S: '', T: '', A: '', R: '' });

  // HR Simulator State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [simActive, setSimActive] = useState(false);
  const [simQuestionIndex, setSimQuestionIndex] = useState(0);
  const [simUserText, setSimUserText] = useState('');
  const [simSpeaking, setSimSpeaking] = useState(false);

  // --- Resume Portfolio States ---
  const [portfolioData, setPortfolioData] = useState({
    about: 'Enthusiastic SDE looking to build dynamic, scalable systems utilizing Modern React and Node.js.',
    skills: 'React, TypeScript, Node.js, Python, MongoDB, System Design, SQL, Docker',
    projects: 'Studlyf - Placement Prep, Smart IoT Controller, Cloud Scale Analytics System',
    experience: 'Summer Internship at Google (Cloud Engineering Intern), Hackathon Lead Dev',
    certifications: 'Google Cloud Associate, AWS Solutions Architect Associate, DSA Mastery Certificate',
    achievements: 'Winner of National Hackathon 2025, Top 1% in Algorithmic Code Competition',
    github: 'https://github.com/studlyf-pro',
    linkedin: 'https://linkedin.com/in/studlyf'
  });
  const [atsScore, setAtsScore] = useState(78);
  const [showImprovementList, setShowImprovementList] = useState(false);
  const [portfolioPreviewDevice, setPortfolioPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSavedToastOpen, setIsSavedToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Handle URL navigation redirects (e.g. from LearnerDashboard)
  useEffect(() => {
    const state = location.state as { companyId?: string } | null;
    if (state?.companyId) {
      const company = PREMIUM_COMPANIES.find(c => c.id === state.companyId);
      if (company) {
        setSelectedCompany(company);
        setActiveTab('dsa');
      }
    }
  }, [location.state]);

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('studlyf_saved_questions', JSON.stringify(savedQuestions));
  }, [savedQuestions]);

  useEffect(() => {
    localStorage.setItem('studlyf_solved_questions', JSON.stringify(solvedQuestions));
  }, [solvedQuestions]);

  // Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setIsSavedToastOpen(true);
    setTimeout(() => setIsSavedToastOpen(false), 3000);
  };

  // --- Visualizer Step Generator ---
  useEffect(() => {
    if (!selectedQuestion) return;

    // Reset steps when question changes
    setVisStep(0);
    setVisPlaying(false);

    let baseInput = selectedQuestion.input;
    if (customInput) {
      baseInput = customInput;
    }

    // Prepare steps based on visualizer type
    if (selectedQuestion.visualizerType === 'tree') {
      // Setup tree visual state
      // Node schema: val, left, right, color
      setVisualizerState({
        nodes: [
          { id: 0, val: 10, x: 200, y: 50, left: 1, right: 2, state: 'normal' },
          { id: 1, val: 5, x: 100, y: 120, left: 3, right: 4, state: 'normal' },
          { id: 2, val: 15, x: 300, y: 120, left: 5, right: 6, state: 'normal' },
          { id: 3, val: 2, x: 50, y: 190, state: 'normal' },
          { id: 4, val: 7, x: 150, y: 190, state: 'normal' },
          { id: 5, val: 12, x: 250, y: 190, state: 'normal' },
          { id: 6, val: 20, x: 350, y: 190, state: 'normal' }
        ],
        steps: [
          { node: 0, desc: 'Starting validation at root node (10). Range: (-∞, +∞). Node 10 is within range.', highlight: [0] },
          { node: 1, desc: 'Moving Left to node (5). Bound updates: (-∞, 10). Node 5 is within range.', highlight: [0, 1] },
          { node: 3, desc: 'Moving Left to node (2). Bound updates: (-∞, 5). Node 2 is valid.', highlight: [0, 1, 3] },
          { node: 4, desc: 'Backtrack to 5, moving Right to node (7). Bound updates: (5, 10). Node 7 is valid.', highlight: [0, 1, 3, 4] },
          { node: 2, desc: 'Backtrack to root, moving Right to node (15). Bound updates: (10, +∞). Node 15 is valid.', highlight: [0, 1, 3, 4, 2] },
          { node: 5, desc: 'Moving Left to node (12). Bound updates: (10, 15). Node 12 is valid.', highlight: [0, 1, 3, 4, 2, 5] },
          { node: 6, desc: 'Moving Right to node (20). Bound updates: (15, +∞). Node 20 is valid.', highlight: [0, 1, 3, 4, 2, 5, 6] },
          { node: -1, desc: 'Validation complete. All nodes recursively meet boundary constraints. Returns TRUE.', highlight: [0, 1, 2, 3, 4, 5, 6], success: true }
        ]
      });
    } else if (selectedQuestion.visualizerType === 'sliding-window') {
      // sliding window on string
      const chars = baseInput.replace(/"/g, '').split('');
      setVisualizerState({
        chars,
        steps: chars.map((c, idx) => {
          // simple dynamic logic to find window boundaries
          const seen: { [key: string]: number } = {};
          let left = 0;
          let maxLen = 0;
          let conflictIdx = -1;

          for (let r = 0; r <= idx; r++) {
            const char = chars[r];
            if (seen[char] !== undefined && seen[char] >= left) {
              left = seen[char] + 1;
              if (r === idx) conflictIdx = seen[char];
            }
            seen[char] = r;
            maxLen = Math.max(maxLen, r - left + 1);
          }

          return {
            left,
            right: idx,
            conflictIdx,
            c,
            desc: conflictIdx !== -1
              ? `Character "${c}" repeated. Shrink left boundary of window to index ${left} to resolve collision.`
              : `Add character "${c}" to window. Window boundaries: [${left} to ${idx}]. Window is unique.`,
            maxLen
          };
        })
      });
    } else if (selectedQuestion.visualizerType === 'linked-list') {
      // Linked list steps
      setVisualizerState({
        nodes: [1, 2, 3, 4, 5],
        steps: [
          { curr: 0, prev: -1, desc: 'Initialize prev = null, curr = 1. nextNode pointer holds reference to 2.' },
          { curr: 1, prev: 0, desc: 'Reverse link: Node(1) now points back to NULL (prev). Shift prev to 1, curr to 2.' },
          { curr: 2, prev: 1, desc: 'Reverse link: Node(2) now points back to 1 (prev). Shift prev to 2, curr to 3.' },
          { curr: 3, prev: 2, desc: 'Reverse link: Node(3) now points back to 2 (prev). Shift prev to 3, curr to 4.' },
          { curr: 4, prev: 3, desc: 'Reverse link: Node(4) now points back to 3 (prev). Shift prev to 4, curr to 5.' },
          { curr: 5, prev: 4, desc: 'Reverse link: Node(5) now points back to 4 (prev). Shift prev to 5, curr to NULL.' },
          { curr: -1, prev: 5, desc: 'List fully reversed! Return Node(5) as the new head of the list.', finished: true }
        ]
      });
    } else if (selectedQuestion.visualizerType === 'dp') {
      // DP Table
      const chars = (selectedQuestion.input || 'babad').replace(/"/g, '').split('');
      const n = chars.length;
      const matrix = Array(n).fill(null).map(() => Array(n).fill(false));
      const steps: any[] = [];

      // Base cases
      for (let i = 0; i < n; i++) {
        matrix[i][i] = true;
        steps.push({
          row: i, col: i, val: true,
          desc: `Base Case (Len 1): Substring "${chars[i]}" is a palindrome. Mark DP[${i}][${i}] = True.`
        });
      }

      // Len 2
      for (let i = 0; i < n - 1; i++) {
        const isPal = chars[i] === chars[i + 1];
        matrix[i][i + 1] = isPal;
        steps.push({
          row: i, col: i + 1, val: isPal,
          desc: `Check Len 2 Substring "${chars[i]}${chars[i + 1]}": s[${i}] ${isPal ? '==' : '!='} s[${i + 1}]. DP[${i}][${i + 1}] = ${isPal ? 'True' : 'False'}.`
        });
      }

      // Len 3+
      for (let len = 3; len <= n; len++) {
        for (let i = 0; i < n - len + 1; i++) {
          const j = i + len - 1;
          const isPal = chars[i] === chars[j] && matrix[i + 1][j - 1];
          matrix[i][j] = isPal;
          steps.push({
            row: i, col: j, val: isPal,
            desc: `Check Len ${len} "${chars.slice(i, j + 1).join('')}": s[${i}] == s[${j}] && inner DP[${i + 1}][${j - 1}] is ${matrix[i + 1][j - 1] ? 'True' : 'False'}. DP[${i}][${j}] = ${isPal ? 'True' : 'False'}.`
          });
        }
      }

      setVisualizerState({ chars, n, steps });
    } else if (selectedQuestion.visualizerType === 'sorting') {
      const arr = customInput ? customInput.split(',').map(Number) : [4, 2, 7, 3, 1, 6];
      setVisualizerState({
        initialArr: [...arr],
        steps: [
          { arr: [...arr], pivot: -1, active: [-1, -1], desc: 'Initial array loaded. Prepare Quick Sort partitioning.' },
          { arr: [...arr], pivot: 5, active: [0, 5], desc: 'Selected last element "6" as pivot. Iterate through items to partition.' },
          { arr: [4, 2, 7, 3, 1, 6], pivot: 5, active: [1, 5], desc: 'Value "4" <= pivot "6". Place in left partition.' },
          { arr: [4, 2, 7, 3, 1, 6], pivot: 5, active: [2, 5], desc: 'Value "7" > pivot "6". Keep in right partition.' },
          { arr: [4, 2, 3, 7, 1, 6], pivot: 5, active: [3, 5], desc: 'Value "3" <= pivot "6". Swap "7" and "3". Array: [4,2,3,7,1,6]' },
          { arr: [4, 2, 3, 1, 7, 6], pivot: 5, active: [4, 5], desc: 'Value "1" <= pivot "6". Swap "7" and "1". Array: [4,2,3,1,7,6]' },
          { arr: [4, 2, 3, 1, 6, 7], pivot: 4, active: [4, 5], desc: 'Loop finished. Swap pivot "6" into sorted partition index. Pivot is now in final position!' },
          { arr: [1, 2, 3, 4, 6, 7], pivot: -1, active: [-1, -1], desc: 'Quick Sort recursive division sorted all subsets! Sorting complete.', finished: true }
        ]
      });
    } else if (selectedQuestion.visualizerType === 'graph') {
      setVisualizerState({
        nodes: [
          { id: 0, label: '0', x: 100, y: 150, state: 'normal' },
          { id: 1, label: '1', x: 220, y: 80, state: 'normal' },
          { id: 2, label: '2', x: 220, y: 220, state: 'normal' },
          { id: 3, label: '3', x: 340, y: 150, state: 'normal' }
        ],
        edges: [
          { from: 0, to: 1 },
          { from: 0, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 3 }
        ],
        steps: [
          {
            desc: 'Initialize adjacency list and compute in-degrees. In-degrees: {0:0, 1:1, 2:1, 3:2}. Queue: [0].',
            queue: [0],
            inDegrees: { 0: 0, 1: 1, 2: 1, 3: 2 },
            nodesState: { 0: 'processing', 1: 'normal', 2: 'normal', 3: 'normal' },
            edgesState: { '0-1': 'normal', '0-2': 'normal', '1-3': 'normal', '2-3': 'normal' }
          },
          {
            desc: 'Process node 0. Remove from queue. Decrement in-degree of neighbors 1 and 2.',
            queue: [],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 2 },
            nodesState: { 0: 'processed', 1: 'processing', 2: 'processing', 3: 'normal' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'normal', '2-3': 'normal' }
          },
          {
            desc: 'Neighbors 1 and 2 have in-degree 0. Add to queue. Queue: [1, 2].',
            queue: [1, 2],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 2 },
            nodesState: { 0: 'processed', 1: 'processing', 2: 'processing', 3: 'normal' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'normal', '2-3': 'normal' }
          },
          {
            desc: 'Process node 1. Remove from queue. Decrement in-degree of its neighbor 3 (in-degree of 3 becomes 1).',
            queue: [2],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 1 },
            nodesState: { 0: 'processed', 1: 'processed', 2: 'processing', 3: 'normal' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'processed', '2-3': 'normal' }
          },
          {
            desc: 'Process node 2. Remove from queue. Decrement in-degree of neighbor 3 (in-degree of 3 becomes 0).',
            queue: [],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 0 },
            nodesState: { 0: 'processed', 1: 'processed', 2: 'processed', 3: 'processing' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'processed', '2-3': 'processed' }
          },
          {
            desc: 'Neighbor 3 has in-degree 0. Add to queue. Queue: [3].',
            queue: [3],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 0 },
            nodesState: { 0: 'processed', 1: 'processed', 2: 'processed', 3: 'processing' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'processed', '2-3': 'processed' }
          },
          {
            desc: 'Process node 3. Remove from queue. All courses processed successfully (Count = 4). No cycles detected. Return true!',
            queue: [],
            inDegrees: { 0: 0, 1: 0, 2: 0, 3: 0 },
            nodesState: { 0: 'processed', 1: 'processed', 2: 'processed', 3: 'processed' },
            edgesState: { '0-1': 'processed', '0-2': 'processed', '1-3': 'processed', '2-3': 'processed' }
          }
        ]
      });
    }

  }, [selectedQuestion, customInput]);

  // Autoplay Timer
  useEffect(() => {
    if (visPlaying) {
      playTimerRef.current = setInterval(() => {
        setVisStep((prev) => {
          const maxSteps = visualizerState?.steps?.length || 0;
          if (prev >= maxSteps - 1) {
            setVisPlaying(false);
            if (playTimerRef.current) clearInterval(playTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, visSpeed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [visPlaying, visSpeed, visualizerState]);

  // --- Voice Synthesis implementation ---
  const speakExplanation = (questionId: string, textToSpeak: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speechSpeaking === questionId) {
        setSpeechSpeaking(null);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => {
      setSpeechSpeaking(null);
    };
    utterance.onerror = () => {
      setSpeechSpeaking(null);
    };

    setSpeechSpeaking(questionId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // --- Bookmark / Solver Triggers ---
  const toggleBookmark = (id: string) => {
    if (savedQuestions.includes(id)) {
      setSavedQuestions(prev => prev.filter(q => q !== id));
      triggerToast('Question removed from bookmarks');
    } else {
      setSavedQuestions(prev => [...prev, id]);
      triggerToast('Question added to bookmarks!');
    }
  };

  const markAsSolved = (id: string) => {
    if (!solvedQuestions.includes(id)) {
      setSolvedQuestions(prev => [...prev, id]);
      triggerToast('Marked as completed! Points added.');
      setStreaks(prev => prev + 1);
    } else {
      setSolvedQuestions(prev => prev.filter(q => q !== id));
      triggerToast('Question marked uncompleted.');
    }
  };

  // --- Client-side AI HR Round Evaluator ---
  const runHrEvaluation = () => {
    if (!hrAnswer.trim()) {
      alert('Kindly type an answer first!');
      return;
    }
    setEvaluatingHr(true);
    setTimeout(() => {
      const length = hrAnswer.split(' ').length;
      const lower = hrAnswer.toLowerCase();

      // Simulated NLP score computing
      const confidence = length > 60 ? 88 : length > 30 ? 74 : 52;
      const grammar = lower.includes('i did') || lower.includes('we achieved') ? 92 : 80;
      const structure = lower.includes('situation') || lower.includes('result') || lower.includes('task') ? 95 : 65;
      const professionalism = lower.includes('however') || lower.includes('subsequently') || lower.includes('collaboration') ? 90 : 72;
      const overall = Math.round((confidence + grammar + structure + professionalism) / 4);

      let feedback = [];
      if (length < 40) {
        feedback.push('Your response is slightly brief. Expand with concrete metrics to deliver higher impact.');
      } else {
        feedback.push('Great depth of explanation and good usage of action-oriented verbs.');
      }

      if (structure < 80) {
        feedback.push('Utilize the STAR structure explicitly. Briefly state the Situation and your measurable Result first.');
      }

      setHrEvaluation({
        overall,
        confidence,
        grammar,
        structure,
        professionalism,
        feedback,
        starAdherence: structure > 80 ? 'Excellent' : 'Needs Structuring'
      });
      setEvaluatingHr(false);
      triggerToast('Simulated AI Evaluation Complete!');
    }, 1500);
  };

  // Construct STAR Answer helper
  const importStarAnswer = () => {
    const combined = `[Situation] ${starInputs.S} \n[Task] ${starInputs.T} \n[Action] ${starInputs.A} \n[Result] ${starInputs.R}`;
    setHrAnswer(combined);
    triggerToast('STAR narrative synced to active text editor!');
  };

  // --- HR Simulator Flow ---
  const launchHrSimulator = () => {
    setSimActive(true);
    setChatMessages([
      {
        sender: 'ai',
        text: `Welcome to the ${selectedCompany?.name || 'Google'} Placement Simulator. I am your HR calibration agent. Let's begin. Tell me about a time you had to resolve a severe team conflict?`
      }
    ]);
    setSimQuestionIndex(0);
  };

  const handleSimSubmit = () => {
    if (!simUserText.trim()) return;

    const userMsg = simUserText;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setSimUserText('');

    // Simulated Bot Speaking
    setSimSpeaking(true);
    setTimeout(() => {
      const answersList = [
        `That shows good resilience. Now, why should we hire you over other highly qualified engineering candidates for ${selectedCompany?.name || 'our company'}?`,
        `Fascinating metrics. Describe a time you made a technical error. What did you learn and how did you communicate it?`,
        `Perfect. Our simulation run is complete. Based on our communication algorithms, your confidence matrix is exceptionally calibrated. Let's export your analytics to your portfolio.`
      ];

      const nextIdx = simQuestionIndex + 1;
      if (nextIdx < answersList.length) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: answersList[simQuestionIndex] }]);
        setSimQuestionIndex(nextIdx);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: 'All simulation queries answered. I am generating your placement readiness report in the Progress tab.', completed: true }]);
        setStreaks(prev => prev + 1);
      }
      setSimSpeaking(false);
    }, 1500);
  };

  // --- Tech Round Quiz Logic ---
  const handleQuizSubmit = () => {
    if (!selectedCompany) return;
    let score = 0;
    selectedCompany.technical.forEach((q, idx) => {
      const selected = selectedQuizAnswers[q.id];
      // simple mock correct checker (index-based)
      if (selected === q.keyPoints[0]) {
        score++;
      }
    });
    setTechQuizScore(Math.round((score / selectedCompany.technical.length) * 100));
    triggerToast('Practice quiz graded successfully!');
  };

  // Resume Analyzer simulated scoring updating
  const handleResumeChange = (field: string, val: string) => {
    setPortfolioData(prev => {
      const updated = { ...prev, [field]: val };
      // compute simulated ATS score based on word length / keyword density
      const textLen = Object.values(updated).join(' ').length;
      const skillsCount = updated.skills.split(',').length;
      let score = 65;
      if (textLen > 400) score += 10;
      if (skillsCount > 5) score += 10;
      if (updated.github.includes('github.com')) score += 5;
      if (updated.linkedin.includes('linkedin.com')) score += 5;
      setAtsScore(Math.min(98, score));
      return updated;
    });
  };

  // Reset page helper
  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setActiveTab('companies');
  };

  // Filtering companies lists
  const filteredCompanies = PREMIUM_COMPANIES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.industry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] selection:bg-purple-600 selection:text-white pt-24 pb-12 transition-colors duration-500 overflow-x-hidden relative">
      
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-purple-100/30 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-50/20 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-violet-50/20 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Toast Notification */}
      <AnimatePresence>
        {isSavedToastOpen && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-[999] bg-gradient-to-r from-purple-900/90 to-violet-800/90 backdrop-blur-xl border border-purple-500/30 px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-purple-200/50"
          >
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* UPPER DASHBOARD BANNER */}
          {!selectedCompany ? (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="text-center max-w-4xl mx-auto mb-12">
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-purple-100 text-purple-700 border border-purple-300 px-5 py-2 rounded-full font-black uppercase tracking-[0.35em] text-[9px] mb-6 inline-block backdrop-blur-md"
              >
                STUDLYF v2 • Placement Command Center
              </motion.span>
              <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight tracking-tighter uppercase">
                PLACEMENT{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-violet-500 inline-block animate-pulse">
                  GATES.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                Crack the most rigorous algorithmic, core technology, and behavioral interviews at global tech giants using high-fidelity simulations.
              </p>
            </div>

            {/* Premium Stats Blocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[
                { label: 'Active Gates', val: '12+', icon: ShieldCheck, color: 'text-purple-400' },
                { label: 'DSA Visualizers', val: 'Dynamic', icon: Cpu, color: 'text-pink-400' },
                { label: 'HR Simulations', val: 'Speech Sync', icon: MessageSquare, color: 'text-violet-400' },
                { label: 'Streak Status', val: `${streaks} Days 🔥`, icon: Zap, color: 'text-yellow-400' }
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="bg-white backdrop-blur-xl border border-gray-200 shadow-sm hover:border-purple-500/30 p-6 rounded-3xl relative overflow-hidden transition-all group shadow-2xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/15">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="text-2xl font-black text-slate-800 mb-1">{s.val}</div>
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Header controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/80 border border-gray-200 p-4 rounded-[2rem] mb-12">
              <div className="relative w-full max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search placement target (e.g. Google)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:outline-none focus:border-purple-500 transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                <span>Filter Level:</span>
                {['All', 'Elite', 'High', 'Moderate'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRoleFilter(lvl)}
                    className={`px-4 py-2 rounded-xl border transition-all ${roleFilter === lvl ? 'bg-purple-100 border-purple-500 text-slate-700' : 'bg-transparent border-gray-200 hover:border-white/[0.2]'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCompanies
                .filter((comp) => roleFilter === 'All' || comp.difficulty === roleFilter)
                .map((comp) => {
                  return (
                    <motion.div
                      key={comp.id}
                      onClick={() => setSelectedCompany(comp)}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="bg-white backdrop-blur-xl border border-gray-200 shadow-sm hover:border-purple-500/40 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer shadow-2xl transition-all"
                    >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent blur-2xl rounded-full" />
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 bg-white p-3 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <img src={comp.logo} alt={comp.name} className="max-w-full max-h-full object-contain" onError={(e) => { const t = e.currentTarget; const domain = comp.id === 'flipkart' ? 'flipkart.com' : comp.id === 'tcs' ? 'tcs.com' : comp.id === 'atlassian' ? 'atlassian.com' : comp.id + '.com'; t.onerror = null; t.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; }} />
                      </div>
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${comp.difficulty === 'Elite' ? 'bg-red-950 text-red-400 border border-red-500/30' : comp.difficulty === 'High' ? 'bg-orange-950 text-orange-400 border border-orange-500/30' : 'bg-green-950 text-green-400 border border-green-500/30'}`}>
                        {comp.difficulty}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-purple-400 transition-colors mb-2">{comp.name}</h3>
                    <p className="text-xs text-slate-400 mb-6 font-semibold">{comp.industry}</p>

                    {/* Progress Bar */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        <span>Preparation Complete</span>
                        <span>{comp.completion}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${comp.completion}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-gray-200 pt-5 text-slate-400">
                      <div>
                        <span className="block font-black text-slate-700">{comp.stats.placed}+ Placed</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">Alumni</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-purple-400">{comp.stats.avgpackage}</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">Avg Package</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </motion.div>
        ) : (
          
          /* ACTIVE COMPANY TARGET DASHBOARD */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col lg:flex-row gap-8"
          >
            
            {/* LEFT GLOWING SIDEBAR */}
            <div className={`flex-shrink-0 transition-all duration-300 w-full lg:w-72`}>
              <div className="sticky top-28 bg-white backdrop-blur-xl border border-gray-200 shadow-sm rounded-[2rem] p-5 shadow-2xl space-y-6">
                
                {/* Header Back Button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <button
                    onClick={handleBackToCompanies}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Exit Gate
                  </button>
                  <span className="text-[8px] bg-purple-100/50 px-2 py-0.5 rounded border border-purple-500/20 text-purple-400 font-bold uppercase">Active</span>
                </div>

                {/* Company logo profile */}
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="w-12 h-12 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                    <img src={selectedCompany.logo} alt="" className="max-w-full max-h-full object-contain" onError={(e) => { const t = e.currentTarget; const domain = selectedCompany.id === 'flipkart' ? 'flipkart.com' : selectedCompany.id === 'tcs' ? 'tcs.com' : selectedCompany.id === 'atlassian' ? 'atlassian.com' : selectedCompany.id + '.com'; t.onerror = null; t.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; }} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">{selectedCompany.name}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">{selectedCompany.difficulty} Target</p>
                  </div>
                </div>

                {/* Navigation items */}
                <div className="space-y-1.5">
                  {[
                    { id: 'dsa', label: 'DSA Matrix', icon: Terminal },
                    { id: 'tech', label: 'Tech Round', icon: Cpu },
                    { id: 'hr', label: 'HR Round', icon: Briefcase },
                    { id: 'resume', label: 'Resume Portfolio', icon: FileText },
                    { id: 'mock', label: 'Mock Interview', icon: Zap },
                    { id: 'progress', label: 'Progress Tracker', icon: BarChart3 }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id as any);
                        setSimActive(false);
                        setSelectedQuestion(null);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${activeTab === t.id
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-lg shadow-purple-100/20'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white hover:text-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <t.icon className="w-4 h-4" />
                        <span>{t.label}</span>
                      </div>
                      {activeTab === t.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400" />}
                    </button>
                  ))}
                </div>

                {/* Micro Progress Tracker Ring */}
                <div className="bg-[#130E26]/80 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between text-[9px] uppercase font-black text-slate-400 mb-2">
                    <span>Gate Readiness</span>
                    <span>{selectedCompany.completion}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{ width: `${selectedCompany.completion}%` }} />
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT MAIN WORKSPACE */}
            <div className="flex-grow min-w-0">
              <div className="bg-white backdrop-blur-xl border border-gray-200 shadow-sm rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-2xl min-h-[600px] relative overflow-hidden">
                
                {/* Visual Background Orbs inside container */}
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >

                    {/* ====================================================
                        TAB: DSA MATRIX
                        ==================================================== */}
                    {activeTab === 'dsa' && (
                      <div className="space-y-8">
                        {!selectedQuestion ? (
                          <>
                            <header>
                              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">DSA Matrix</h2>
                              <p className="text-xs font-semibold text-slate-400">Master frequently asked coding challenges for {selectedCompany.name}.</p>
                            </header>

                            <div className="grid gap-6">
                              {selectedCompany.dsa.map((q) => (
                                <div
                                  key={q.id}
                                  className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-500/30 p-6 rounded-3xl transition-all shadow-xl group"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                      <span className={`w-2.5 h-2.5 rounded-full ${q.difficulty === 'Hard' ? 'bg-red-500' : q.difficulty === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`} />
                                      <h4 className="text-xl font-bold text-slate-800">{q.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] uppercase font-black px-2.5 py-1 bg-purple-50/70 border border-purple-500/20 text-purple-400 rounded-lg">Freq: {q.frequency}%</span>
                                      <button
                                        onClick={() => toggleBookmark(q.id)}
                                        className="p-2 bg-gray-100 border border-gray-100 hover:border-purple-500/30 rounded-xl transition-all"
                                      >
                                        <Bookmark className={`w-4 h-4 ${savedQuestions.includes(q.id) ? 'fill-purple-500 text-purple-500' : 'text-slate-400'}`} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                    <div className="p-4 bg-gray-100/50 rounded-2xl border border-gray-100">
                                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Time | Space</span>
                                      <span className="font-bold text-slate-700 text-xs">{q.time} | {q.space}</span>
                                    </div>
                                    <div className="p-4 bg-gray-100/50 rounded-2xl border border-gray-100 lg:col-span-2">
                                      <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Algorithmic Approach</span>
                                      <span className="text-xs text-slate-400 font-medium leading-relaxed">{q.approach}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
                                    <div className="flex gap-2">
                                      {q.tags.map(t => (
                                        <span key={t} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{t}</span>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setSelectedQuestion(q)}
                                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2"
                                      >
                                        <Play className="w-3 h-3 fill-white" /> Practice challenge
                                      </button>
                                      <button
                                        onClick={() => markAsSolved(q.id)}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${solvedQuestions.includes(q.id) ? 'bg-green-950 border-green-500/40 text-green-400' : 'bg-transparent border-gray-200 hover:border-white/[0.2] text-slate-600'}`}
                                      >
                                        {solvedQuestions.includes(q.id) ? '✓ Completed' : 'Mark Completed'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          
                          /* DSA QUESTION ACTIVE PREPARATION INTERFACE */
                          <div className="space-y-8">
                            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
                              <div>
                                <button
                                  onClick={() => setSelectedQuestion(null)}
                                  className="text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 mb-2"
                                >
                                  <ArrowLeft className="w-4 h-4" /> Back to Matrix
                                </button>
                                <div className="flex items-center gap-3">
                                  <span className={`w-2.5 h-2.5 rounded-full ${selectedQuestion.difficulty === 'Hard' ? 'bg-red-500' : selectedQuestion.difficulty === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`} />
                                  <h3 className="text-2xl font-bold text-slate-800">{selectedQuestion.title}</h3>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-[9px] uppercase font-black px-3 py-1.5 bg-gray-100 border border-gray-200 text-slate-400 rounded-lg">Time: {selectedQuestion.time}</span>
                                <button
                                  onClick={() => toggleBookmark(selectedQuestion.id)}
                                  className="p-2.5 bg-gray-100 border border-gray-200 rounded-xl transition-all"
                                >
                                  <Bookmark className={`w-4 h-4 ${savedQuestions.includes(selectedQuestion.id) ? 'fill-purple-500 text-purple-500' : 'text-slate-400'}`} />
                                </button>
                              </div>
                            </header>

                            {/* 3D DSA VISUALIZER SCREEN */}
                            <div className="bg-gray-100 rounded-[2.5rem] border border-gray-200 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">STUDLYF 3D Visualizer</span>
                              </div>

                              {/* Canvas visualizer viewport */}
                              <div className="w-full h-80 bg-[#0C061E]/90 border border-gray-100 rounded-3xl flex items-center justify-center overflow-hidden relative" style={{ perspective: '1000px' }}>
                                
                                {/* 3D Traversal rendering */}
                                {selectedQuestion.visualizerType === 'tree' && visualizerState && (
                                  <div className="relative w-full h-full transform rotateX-[15deg]" style={{ transformStyle: 'preserve-3d' }}>
                                    <svg className="absolute inset-0 w-full h-full">
                                      {/* Render link connections */}
                                      {visualizerState.nodes.map((node: any) => {
                                        if (node.left !== undefined) {
                                          const target = visualizerState.nodes[node.left];
                                          return <line key={`l-${node.id}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke="rgba(124,58,237,0.2)" strokeWidth={2} />;
                                        }
                                        if (node.right !== undefined) {
                                          const target = visualizerState.nodes[node.right];
                                          return <line key={`r-${node.id}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} stroke="rgba(124,58,237,0.2)" strokeWidth={2} />;
                                        }
                                        return null;
                                      })}
                                    </svg>

                                    {/* Render Node Bubbles */}
                                    {visualizerState.nodes.map((node: any) => {
                                      const activeHighlight = visualizerState.steps[visStep]?.highlight || [];
                                      const isHighlighted = activeHighlight.includes(node.id);
                                      const currentNode = visualizerState.steps[visStep]?.node === node.id;
                                      return (
                                        <motion.div
                                          key={node.id}
                                          style={{ left: node.x - 20, top: node.y - 20 }}
                                          className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-2xl transition-all ${
                                            currentNode
                                              ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-125 z-20 shadow-yellow-500/50'
                                              : isHighlighted
                                              ? 'bg-purple-600 border-purple-400 text-white shadow-purple-600/30'
                                              : 'bg-gray-100 border-gray-200 text-slate-400'
                                          }`}
                                          animate={currentNode ? { scale: [1, 1.2, 1] } : {}}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                          {node.val}
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* 3D Sliding Window rendering */}
                                {selectedQuestion.visualizerType === 'sliding-window' && visualizerState && (
                                  <div className="flex flex-col items-center justify-center space-y-8 w-full px-6">
                                    <div className="flex gap-3 relative py-4">
                                      {visualizerState.chars.map((char: string, idx: number) => {
                                        const step = visualizerState.steps[visStep] || { left: 0, right: 0, conflictIdx: -1 };
                                        const insideWindow = idx >= step.left && idx <= step.right;
                                        const isConflict = idx === step.conflictIdx;
                                        return (
                                          <div
                                            key={idx}
                                            className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-black transition-all relative ${
                                              isConflict
                                                ? 'bg-red-950 border-red-500 text-red-400 animate-bounce'
                                                : insideWindow
                                                ? 'bg-purple-100 border-purple-500 text-purple-300'
                                                : 'bg-gray-100 border-gray-100 text-slate-600'
                                            }`}
                                          >
                                            <span className="text-lg">{char}</span>
                                            <span className="text-[7px] text-slate-400 absolute bottom-1">{idx}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    {/* Stats panel */}
                                    <div className="flex gap-4 text-[10px] font-black uppercase text-slate-400">
                                      <span>Window Bounds: [{visualizerState.steps[visStep]?.left} - {visualizerState.steps[visStep]?.right}]</span>
                                      <span>Max Substring Length: {visualizerState.steps[visStep]?.maxLen}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Linked list Pointer rendering */}
                                {selectedQuestion.visualizerType === 'linked-list' && visualizerState && (
                                  <div className="flex items-center justify-center gap-4 w-full px-6">
                                    {visualizerState.nodes.map((node: number, idx: number) => {
                                      const step = visualizerState.steps[visStep] || { curr: -1, prev: -1 };
                                      const isCurr = step.curr === idx;
                                      const isPrev = step.prev === idx;
                                      const isReversed = idx < visStep;
                                      return (
                                        <React.Fragment key={idx}>
                                          <div
                                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black transition-all relative ${
                                              isCurr
                                                ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-110'
                                                : isPrev
                                                ? 'bg-purple-600 border-purple-400 text-white'
                                                : 'bg-gray-100 border-gray-200 text-slate-400'
                                            }`}
                                          >
                                            <span>{node}</span>
                                            {isCurr && <span className="absolute -top-6 text-[8px] uppercase tracking-wider text-yellow-400 font-bold">curr</span>}
                                            {isPrev && <span className="absolute -top-6 text-[8px] uppercase tracking-wider text-purple-400 font-bold">prev</span>}
                                          </div>
                                          {idx < visualizerState.nodes.length - 1 && (
                                            <motion.div
                                              animate={isReversed ? { rotate: 180 } : { rotate: 0 }}
                                              className="text-purple-500 font-bold text-lg"
                                            >
                                              ➔
                                            </motion.div>
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Dynamic DP table filling visualization */}
                                {selectedQuestion.visualizerType === 'dp' && visualizerState && (
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${visualizerState.n}, minmax(0, 1fr))` }}>
                                      {Array(visualizerState.n).fill(null).map((_, r) => (
                                        Array(visualizerState.n).fill(null).map((_, c) => {
                                          const currentStep = visualizerState.steps[visStep] || { row: -1, col: -1 };
                                          const isActiveCell = currentStep.row === r && currentStep.col === c;
                                          
                                          // check if filled in current history steps
                                          let isFilled = false;
                                          let isPal = false;
                                          for (let s = 0; s <= visStep; s++) {
                                            const step = visualizerState.steps[s];
                                            if (step.row === r && step.col === c) {
                                              isFilled = true;
                                              isPal = step.val;
                                            }
                                          }

                                          return (
                                            <div
                                              key={`${r}-${c}`}
                                              className={`w-9 h-9 rounded-lg border text-[10px] font-mono flex items-center justify-center transition-all ${
                                                isActiveCell
                                                  ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-110 z-10'
                                                  : isFilled
                                                  ? isPal
                                                    ? 'bg-green-950/80 border-green-500/40 text-green-400 font-bold'
                                                    : 'bg-red-950/40 border-red-900/20 text-red-700'
                                                  : 'bg-gray-100/40 border-white/[0.02] text-slate-700'
                                              }`}
                                            >
                                              {isFilled ? (isPal ? 'T' : 'F') : '-'}
                                            </div>
                                          );
                                        })
                                      ))}
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DP Palindromic Match Array Table</span>
                                  </div>
                                )}

                                {/* Sorting visualizer bar list */}
                                {selectedQuestion.visualizerType === 'sorting' && visualizerState && (
                                  <div className="flex items-end justify-center gap-4 w-full h-48 px-6">
                                    {(visualizerState.steps[visStep]?.arr || visualizerState.initialArr).map((val: number, idx: number) => {
                                      const step = visualizerState.steps[visStep] || { pivot: -1, active: [-1, -1] };
                                      const isPivot = step.pivot === idx;
                                      const isActive = step.active.includes(idx);
                                      return (
                                        <div key={idx} className="flex flex-col items-center">
                                          <div
                                            style={{ height: `${val * 20}px` }}
                                            className={`w-10 rounded-t-xl transition-all flex items-center justify-center font-black text-xs ${
                                              isPivot
                                                ? 'bg-yellow-500 shadow-lg shadow-yellow-500/20 text-slate-900'
                                                : isActive
                                                ? 'bg-purple-600 shadow-lg shadow-purple-600/20 text-white animate-pulse'
                                                : 'bg-gray-100 border border-gray-200 text-slate-400'
                                            }`}
                                          >
                                            {val}
                                          </div>
                                          <span className="text-[8px] text-slate-400 mt-2">{idx}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Graph visualizer rendering */}
                                {selectedQuestion.visualizerType === 'graph' && visualizerState && (
                                  <div className="relative w-full h-full transform rotateX-[10deg]" style={{ transformStyle: 'preserve-3d' }}>
                                    <svg className="absolute inset-0 w-full h-full">
                                      <defs>
                                        <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(168,85,247,0.8)" />
                                        </marker>
                                        <marker id="arrow-processed" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(34,197,94)" />
                                        </marker>
                                        <marker id="arrow-processing" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgb(234,179,8)" />
                                        </marker>
                                      </defs>
                                      {visualizerState.edges.map((edge: any) => {
                                        const fromNode = visualizerState.nodes[edge.from];
                                        const toNode = visualizerState.nodes[edge.to];
                                        const step = visualizerState.steps[visStep];
                                        const key = `${edge.from}-${edge.to}`;
                                        const edgeState = step?.edgesState?.[key] || 'normal';
                                        
                                        return (
                                          <line
                                            key={key}
                                            x1={fromNode.x}
                                            y1={fromNode.y}
                                            x2={toNode.x}
                                            y2={toNode.y}
                                            stroke={edgeState === 'processed' ? 'rgb(34,197,94)' : edgeState === 'processing' ? 'rgb(234,179,8)' : 'rgba(168,85,247,0.2)'}
                                            strokeWidth={edgeState === 'normal' ? 2 : 3}
                                            markerEnd={edgeState === 'processed' ? "url(#arrow-processed)" : edgeState === 'processing' ? "url(#arrow-processing)" : "url(#arrow)"}
                                          />
                                        );
                                      })}
                                    </svg>

                                    {/* Render Graph Nodes */}
                                    {visualizerState.nodes.map((node: any) => {
                                      const step = visualizerState.steps[visStep];
                                      const nodeState = step?.nodesState?.[node.id] || 'normal';
                                      const inQueue = step?.queue?.includes(node.id);
                                      
                                      return (
                                        <motion.div
                                          key={node.id}
                                          style={{ left: node.x - 20, top: node.y - 20 }}
                                          className={`absolute w-10 h-10 rounded-full flex flex-col items-center justify-center font-black text-xs border-2 shadow-2xl transition-all ${
                                            nodeState === 'processing'
                                              ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-125 z-20 shadow-yellow-500/50'
                                              : nodeState === 'processed'
                                              ? 'bg-green-600 border-green-400 text-white shadow-green-600/30'
                                              : 'bg-gray-100 border-gray-200 text-slate-400'
                                          }`}
                                          animate={nodeState === 'processing' ? { scale: [1, 1.2, 1] } : {}}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                          <span>{node.label}</span>
                                          {inQueue && <span className="absolute -top-4 text-[7px] text-yellow-500 font-bold uppercase">Q</span>}
                                        </motion.div>
                                      );
                                    })}

                                    {/* Stats panel for graph */}
                                    <div className="absolute bottom-4 left-4 flex gap-4 text-[9px] font-black uppercase text-slate-400 z-10 bg-[#0C061E]/80 backdrop-blur border border-purple-500/10 px-3 py-1.5 rounded-xl">
                                      <span>Queue: [{visualizerState.steps[visStep]?.queue?.join(', ')}]</span>
                                      <span>In-degrees: {JSON.stringify(visualizerState.steps[visStep]?.inDegrees)}</span>
                                    </div>
                                  </div>
                                )}

                              </div>

                              {/* Playback Controls */}
                              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 border-t border-gray-100 pt-5">
                                <div className="text-xs text-slate-400 max-w-md text-center md:text-left">
                                  <span className="block font-black text-slate-700 mb-1">Current State Description:</span>
                                  <p className="font-semibold text-[11px] leading-relaxed">{visualizerState?.steps?.[visStep]?.desc || 'Ready to run.'}</p>
                                </div>
                                <div className="flex items-center gap-5">
                                  {/* Speed Slider */}
                                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-2xl border border-gray-200">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">{(visSpeed / 1000).toFixed(1)}s</span>
                                    <input
                                      type="range"
                                      min="200"
                                      max="2000"
                                      step="100"
                                      value={visSpeed}
                                      onChange={(e) => setVisSpeed(Number(e.target.value))}
                                      className="w-20 accent-purple-600 cursor-pointer"
                                      style={{ height: '4px' }}
                                    />
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => setVisStep(prev => Math.max(0, prev - 1))}
                                      className="p-3 bg-gray-100 border border-gray-200 hover:border-purple-500/30 rounded-2xl transition-all"
                                      title="Previous step"
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setVisPlaying(!visPlaying)}
                                      className="p-4 bg-purple-600 hover:bg-purple-500 rounded-full transition-all text-white"
                                    >
                                      {visPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                                    </button>
                                    <button
                                      onClick={() => setVisStep(prev => {
                                        const max = visualizerState?.steps?.length || 1;
                                        return Math.min(max - 1, prev + 1);
                                      })}
                                      className="p-3 bg-gray-100 border border-gray-200 hover:border-purple-500/30 rounded-2xl transition-all"
                                      title="Next step"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Custom input controls */}
                              <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 bg-gray-50/80 border border-gray-100 p-4 rounded-2xl">
                                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Custom Visualizer Input:</span>
                                <input
                                  type="text"
                                  placeholder={selectedQuestion.input}
                                  value={customInput}
                                  onChange={(e) => setCustomInput(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
                                />
                                <button
                                  onClick={() => setCustomInput('')}
                                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[10px] font-black uppercase text-slate-400 rounded-xl"
                                >
                                  Reset
                                </button>
                              </div>

                            </div>

                            {/* AI EXPLANATION WORKSPACE */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              
                              {/* Conceptual Details */}
                              <div className="lg:col-span-2 space-y-6">
                                <div className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6">
                                  <h4 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <Bot className="w-5 h-5 text-purple-400" /> AI Conceptual Breakdown
                                  </h4>
                                  <div>
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">Intuition & Mechanics</span>
                                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">{selectedQuestion.explanation.intuition}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">Brute Force Approach</span>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{selectedQuestion.explanation.brute}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">Optimized System Strategy</span>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{selectedQuestion.explanation.optimized}</p>
                                  </div>
                                </div>

                                {/* Live Code Editor Preview */}
                                <div className="bg-[#05020F] border border-gray-200 rounded-[2rem] p-6 lg:p-8">
                                  <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">Algorithmic Production Code</span>
                                    <div className="relative flex items-center">
                                      <select
                                        value={codeLanguage}
                                        onChange={(e) => setCodeLanguage(e.target.value as any)}
                                        className="appearance-none bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
                                      >
                                        <option value="python" className="bg-[#05020F] text-purple-300">Python</option>
                                        <option value="java" className="bg-[#05020F] text-purple-300">Java</option>
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-purple-300 absolute right-2 pointer-events-none" />
                                    </div>
                                  </div>
                                  <pre className="font-mono text-xs text-purple-300 bg-[#0C061E]/90 p-6 rounded-2xl overflow-x-auto border border-purple-500/10 leading-relaxed">
                                    {selectedQuestion.code[codeLanguage] || selectedQuestion.code.python || selectedQuestion.code.java}
                                  </pre>
                                </div>
                              </div>

                              {/* Sidebar edgecases & tips */}
                              <div className="space-y-6">
                                <div className="bg-[#120D26]/60 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6">
                                  <h4 className="text-lg font-bold text-slate-700">Edge Cases</h4>
                                  <ul className="space-y-3">
                                    {selectedQuestion.explanation.edgeCases.map((ec, idx) => (
                                      <li key={idx} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{ec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="bg-[#120D26]/60 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6">
                                  <h4 className="text-lg font-bold text-slate-700">Interview Tips</h4>
                                  <ul className="space-y-3">
                                    {selectedQuestion.explanation.tips.map((tip, idx) => (
                                      <li key={idx} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ====================================================
                        TAB: TECH ROUND SECTION
                        ==================================================== */}
                    {activeTab === 'tech' && (
                      <div className="space-y-8">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">Technical Core</h2>
                            <p className="text-xs font-semibold text-slate-400">Company-specific conceptual technical prep for {selectedCompany.name}.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setTechFlashcardsMode(!techFlashcardsMode);
                                setTechQuizMode(false);
                                setFlashcardIndex(0);
                                setFlashcardFlipped(false);
                              }}
                              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${techFlashcardsMode ? 'bg-purple-100 border-purple-500 text-slate-700' : 'bg-transparent border-gray-200 hover:border-white/[0.2] text-slate-400'}`}
                            >
                              Flashcards Mode
                            </button>
                            <button
                              onClick={() => {
                                setTechQuizMode(!techQuizMode);
                                setTechFlashcardsMode(false);
                                setSelectedQuizAnswers({});
                                setTechQuizScore(null);
                              }}
                              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all ${techQuizMode ? 'bg-purple-100 border-purple-500 text-slate-700' : 'bg-transparent border-gray-200 hover:border-white/[0.2] text-slate-400'}`}
                            >
                              Practice Quiz
                            </button>
                          </div>
                        </header>

                        {/* FLASHCARDS WORKSPACE */}
                        {techFlashcardsMode ? (
                          <div className="flex flex-col items-center justify-center space-y-8 py-10 max-w-xl mx-auto">
                            <div className="text-center w-full">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flashcard {flashcardIndex + 1} of {selectedCompany.technical.length}</span>
                            </div>

                            {/* Flipped Card Component */}
                            <div
                              onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                              style={{ perspective: '1000px' }}
                              className="w-full h-80 cursor-pointer"
                            >
                              <div
                                style={{
                                  transformStyle: 'preserve-3d',
                                  transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                }}
                                className="w-full h-full transition-transform duration-700 relative"
                              >
                                {/* Front Face */}
                                <div className="absolute inset-0 bg-[#120B2E] border border-gray-200 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl backface-hidden">
                                  <span className="text-[9px] uppercase tracking-widest font-black text-purple-400">{selectedCompany.technical[flashcardIndex].category}</span>
                                  <h3 className="text-2xl font-bold text-center leading-relaxed text-slate-800">"{selectedCompany.technical[flashcardIndex].question}"</h3>
                                  <span className="text-[8px] uppercase tracking-widest font-black text-center text-slate-600">Click Card to Flip & View Answer</span>
                                </div>

                                {/* Back Face */}
                                <div
                                  style={{ transform: 'rotateY(180deg)' }}
                                  className="absolute inset-0 bg-purple-50/40 border border-purple-500/20 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl backface-hidden"
                                >
                                  <span className="text-[9px] uppercase tracking-widest font-black text-yellow-400">Core Answer</span>
                                  <p className="text-sm leading-relaxed text-slate-600 font-medium overflow-y-auto max-h-48">{selectedCompany.technical[flashcardIndex].answer}</p>
                                  <span className="text-[8px] uppercase tracking-widest font-black text-center text-slate-600">Click to Flip Back</span>
                                </div>
                              </div>
                            </div>

                            {/* Card control buttons */}
                            <div className="flex gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFlashcardIndex(prev => Math.max(0, prev - 1));
                                  setFlashcardFlipped(false);
                                }}
                                disabled={flashcardIndex === 0}
                                className="px-5 py-2.5 bg-gray-100 border border-gray-200 hover:border-purple-500/30 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 disabled:opacity-40"
                              >
                                Previous Card
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFlashcardIndex(prev => Math.min(selectedCompany.technical.length - 1, prev + 1));
                                  setFlashcardFlipped(false);
                                }}
                                disabled={flashcardIndex === selectedCompany.technical.length - 1}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-black uppercase tracking-wider text-white disabled:opacity-40"
                              >
                                Next Card
                              </button>
                            </div>
                          </div>
                        ) : techQuizMode ? (
                          
                          /* PRACTICE QUIZ WORKSPACE */
                          <div className="space-y-8 max-w-3xl mx-auto bg-gray-50/80 border border-gray-200 p-8 rounded-[2.5rem]">
                            <header className="border-b border-gray-200 pb-4 flex justify-between items-center">
                              <h3 className="text-xl font-bold">Tech Subject Grading</h3>
                              {techQuizScore !== null && (
                                <span className={`text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider ${techQuizScore >= 70 ? 'bg-green-950 text-green-400 border border-green-500/20' : 'bg-red-950 text-red-400 border border-red-500/20'}`}>
                                  Graded: {techQuizScore}%
                                </span>
                              )}
                            </header>

                            <div className="space-y-8">
                              {selectedCompany.technical.map((q, idx) => (
                                <div key={q.id} className="space-y-4">
                                  <h4 className="font-bold text-sm text-slate-700">{idx + 1}. {q.question}</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Mock MCQs options dynamically generated from keypoints */}
                                    {q.keyPoints.map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => setSelectedQuizAnswers(prev => ({ ...prev, [q.id]: option }))}
                                        className={`p-4 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${selectedQuizAnswers[q.id] === option ? 'bg-purple-50/50 border-purple-500 text-purple-300' : 'bg-transparent border-gray-100 hover:bg-gray-50'}`}
                                      >
                                        <span>{option}</span>
                                        {selectedQuizAnswers[q.id] === option && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={handleQuizSubmit}
                              className="w-full py-4 mt-8 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                            >
                              Submit Answers for Grading
                            </button>
                          </div>
                        ) : (
                          
                          /* STANDARD TECH QUESTIONS LIST WITH AUDIO & AI EXPANSION */
                          <div className="space-y-4">
                            {selectedCompany.technical.map((t, idx) => {
                              const isActive = activeTechIndex === idx;
                              const isSpeaking = speechSpeaking === t.id;
                              return (
                                <div
                                  key={t.id}
                                  className="bg-gray-50/80 border border-gray-200 rounded-3xl overflow-hidden group shadow-xl transition-all"
                                >
                                  {/* Expandable Header bar */}
                                  <div
                                    onClick={() => setActiveTechIndex(isActive ? null : idx)}
                                    className="p-6 flex items-center justify-between cursor-pointer"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span className="text-[10px] font-black text-purple-400 bg-purple-50/70 border border-purple-500/20 px-3 py-1 rounded-lg uppercase tracking-wider">{t.category}</span>
                                      <h4 className="text-base font-bold text-slate-700 group-hover:text-purple-400 transition-colors">{t.question}</h4>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-transform ${isActive ? 'rotate-180 text-purple-400' : ''}`} />
                                  </div>

                                  {/* Expandable body content */}
                                  <AnimatePresence>
                                    {isActive && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-gray-100"
                                      >
                                        <div className="p-6 space-y-6 bg-gray-100/20">
                                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-purple-50/15 border border-purple-500/10 p-4 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                              <Volume2 className="w-5 h-5 text-purple-400 animate-pulse" />
                                              <span className="text-xs font-black uppercase text-slate-600">Voice Synthesis Explanation</span>
                                            </div>
                                            <button
                                              onClick={() => speakExplanation(t.id, t.answer)}
                                              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2"
                                            >
                                              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                              {isSpeaking ? 'Mute Explanation' : 'Speak Explanation'}
                                            </button>
                                          </div>

                                          <div className="space-y-2">
                                            <span className="text-[9px] uppercase tracking-widest font-black text-purple-400">Conceptual Answer</span>
                                            <p className="text-sm leading-relaxed text-slate-600 font-medium">{t.answer}</p>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-5 bg-gray-100/60 rounded-2xl border border-gray-100">
                                              <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-3">Key Knowledge Tokens</span>
                                              <div className="flex flex-wrap gap-2">
                                                {t.keyPoints.map(kp => (
                                                  <span key={kp} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">{kp}</span>
                                                ))}
                                              </div>
                                            </div>

                                            <div className="p-5 bg-gray-100/60 rounded-2xl border border-gray-100">
                                              <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 block mb-3">AI Recruiter Follow-up Queries</span>
                                              <ul className="space-y-2 text-xs text-slate-400 font-semibold leading-relaxed">
                                                {t.followUps.map((fl, i) => <li key={i} className="flex gap-2"><span>{i + 1}.</span> <span>{fl}</span></li>)}
                                              </ul>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ====================================================
                        TAB: HR ROUND SECTION
                        ==================================================== */}
                    {activeTab === 'hr' && (
                      <div className="space-y-8">
                        
                        {/* Title header */}
                        <header>
                          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">Behavioral Sync</h2>
                          <p className="text-xs font-semibold text-slate-400">Master real HR behavioral placement assessments asked by {selectedCompany.name}.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* HR Editor & Evaluator Panel */}
                          <div className="lg:col-span-2 space-y-6">
                            
                            {/* Question Drawer Card */}
                            <div className="bg-[#120B2E] border border-gray-200 rounded-[2rem] p-6 lg:p-8">
                              <span className="text-[9px] uppercase tracking-widest font-black text-purple-400 block mb-2">Target Behavioral Query</span>
                              <h3 className="text-2xl font-bold text-slate-800 italic leading-relaxed">"{selectedCompany.hr[0].question}"</h3>
                              <p className="text-xs text-slate-400 mt-4 font-semibold">{selectedCompany.hr[0].aiTips}</p>
                            </div>

                            {/* STAR Method Assistant Tool */}
                            <div className="bg-gray-50/80 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6">
                              <div className="flex justify-between items-center">
                                <h4 className="text-lg font-bold text-slate-700">STAR Method Planner</h4>
                                <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold px-2 py-0.5 rounded">Structured Narratives</span>
                              </div>

                              {/* Tabs inside STAR */}
                              <div className="flex gap-2 border-b border-gray-100 pb-3">
                                {(['S', 'T', 'A', 'R'] as const).map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setStarTab(tab)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${starTab === tab ? 'bg-purple-500/10 border border-purple-500/40 text-purple-300' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
                                  >
                                    {tab === 'S' ? 'Situation' : tab === 'T' ? 'Task' : tab === 'A' ? 'Action' : 'Result'}
                                  </button>
                                ))}
                              </div>

                              <div className="space-y-4">
                                <span className="text-[9px] uppercase tracking-widest font-black text-purple-400 block">
                                  {starTab === 'S' ? 'Situation (The background story)' : starTab === 'T' ? 'Task (The challenge at hand)' : starTab === 'A' ? 'Action (What YOU specifically did)' : 'Result (The measurable metrics)'}
                                </span>
                                <textarea
                                  value={starInputs[starTab]}
                                  onChange={(e) => setStarInputs(prev => ({ ...prev, [starTab]: e.target.value }))}
                                  placeholder={
                                    starTab === 'S' ? selectedCompany.hr[0].starTips.situation
                                    : starTab === 'T' ? selectedCompany.hr[0].starTips.task
                                    : starTab === 'A' ? selectedCompany.hr[0].starTips.action
                                    : selectedCompany.hr[0].starTips.result
                                  }
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500/60 rounded-2xl p-4 text-xs h-24 focus:outline-none text-slate-700"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] text-slate-400">Auto-saves state in active workspace</span>
                                  <button
                                    onClick={importStarAnswer}
                                    className="px-4 py-2 bg-gray-100 border border-gray-200 hover:border-purple-500/30 rounded-xl text-[10px] font-black uppercase text-purple-400"
                                  >
                                    Sync STAR Narrative to Editor
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Main Answer Area & Evaluator */}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Construct Your Response</span>
                                <span className="text-[10px] text-slate-400 font-bold">{hrAnswer.split(' ').filter(Boolean).length} Words</span>
                              </div>
                              <textarea
                                value={hrAnswer}
                                onChange={(e) => setHrAnswer(e.target.value)}
                                placeholder="Type or sync your behavioral response here..."
                                className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-3xl p-6 text-xs h-48 focus:outline-none text-slate-700 leading-relaxed font-medium"
                              />

                              <div className="flex gap-3">
                                <button
                                  onClick={runHrEvaluation}
                                  disabled={evaluatingHr}
                                  className="flex-grow py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-purple-100/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {evaluatingHr ? 'Assessing Answer...' : 'Submit for AI Evaluation'}
                                </button>
                                <button
                                  onClick={() => setHrAnswer('')}
                                  className="px-6 bg-gray-100 border border-gray-200 text-slate-400 hover:text-slate-700 rounded-2xl text-xs font-black uppercase"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Simulated AI Feedback Panel */}
                            {hrEvaluation && (
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#10092B] border border-purple-500/25 p-8 rounded-[2.5rem] space-y-6 shadow-2xl"
                              >
                                <header className="flex justify-between items-center border-b border-gray-100 pb-4">
                                  <h4 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-purple-400 animate-pulse" /> AI Evaluation Report
                                  </h4>
                                  <span className="text-2xl font-black text-slate-800">{hrEvaluation.overall} / 100</span>
                                </header>

                                {/* Scores grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {[
                                    { l: 'Confidence Matrix', val: hrEvaluation.confidence },
                                    { l: 'Grammar & Syntax', val: hrEvaluation.grammar },
                                    { l: 'STAR Adherence', val: hrEvaluation.structure },
                                    { l: 'Professionalism', val: hrEvaluation.professionalism }
                                  ].map((sc, i) => (
                                    <div key={i} className="p-4 bg-gray-100 rounded-xl border border-gray-100">
                                      <span className="text-[8px] uppercase tracking-wider font-black text-slate-400 block mb-1">{sc.l}</span>
                                      <span className="text-sm font-black text-slate-700">{sc.val}%</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Actionable Feedback Tips</span>
                                  <ul className="space-y-2">
                                    {hrEvaluation.feedback.map((f: string, i: number) => (
                                      <li key={i} className="text-xs text-slate-400 leading-relaxed flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )}

                          </div>

                          {/* Company Cultural Pillars info card */}
                          <div className="space-y-6">
                            <div className="bg-[#120D26]/60 border border-gray-200 rounded-[2rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                              <h4 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-700">
                                <Medal className="w-5 h-5 text-purple-400" /> Cultural Alignment
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed mb-6 font-semibold">
                                {selectedCompany.name} strictly filters candidates who display core culture properties:
                              </p>
                              <div className="space-y-4">
                                {selectedCompany.culture.split(',').map((pil, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-gray-100/40 p-3.5 rounded-xl border border-white/[0.02]">
                                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                    <span className="text-xs font-bold text-slate-600">{pil.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* ====================================================
                        TAB: RESUME PORTFOLIO REDESIGN
                        ==================================================== */}
                    {activeTab === 'resume' && (
                      <div className="space-y-8">
                        
                        <header>
                          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">Resume & Portfolio Workspace</h2>
                          <p className="text-xs font-semibold text-slate-400">Optimize and design your ATS-readiness resume and glassmorphic portfolio dashboard.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Resume Form editor */}
                          <div className="lg:col-span-2 space-y-6 bg-gray-50/80 border border-gray-200 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl">
                            
                            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <User className="w-5 h-5 text-purple-400" /> Professional Profile Editor
                              </h3>
                              <span className="text-[8px] bg-purple-100/50 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded uppercase">Synced</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">About Me Description</label>
                                <textarea
                                  value={portfolioData.about}
                                  onChange={(e) => handleResumeChange('about', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3 text-xs h-20 focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">Core Technical Skills</label>
                                <textarea
                                  value={portfolioData.skills}
                                  onChange={(e) => handleResumeChange('skills', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3 text-xs h-20 focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">Featured Project Highlights</label>
                                <textarea
                                  value={portfolioData.projects}
                                  onChange={(e) => handleResumeChange('projects', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3 text-xs h-20 focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">Professional Work Experience</label>
                                <textarea
                                  value={portfolioData.experience}
                                  onChange={(e) => handleResumeChange('experience', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3 text-xs h-20 focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">Certifications</label>
                                <input
                                  type="text"
                                  value={portfolioData.certifications}
                                  onChange={(e) => handleResumeChange('certifications', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3.5 text-xs focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">Achievements</label>
                                <input
                                  type="text"
                                  value={portfolioData.achievements}
                                  onChange={(e) => handleResumeChange('achievements', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3.5 text-xs focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">GitHub Profile Link</label>
                                <input
                                  type="text"
                                  value={portfolioData.github}
                                  onChange={(e) => handleResumeChange('github', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3.5 text-xs focus:outline-none text-slate-700"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 block">LinkedIn Profile Link</label>
                                <input
                                  type="text"
                                  value={portfolioData.linkedin}
                                  onChange={(e) => handleResumeChange('linkedin', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 rounded-xl p-3.5 text-xs focus:outline-none text-slate-700"
                                />
                              </div>

                            </div>

                            <button
                              onClick={() => triggerToast('Portfolio changes compiled & successfully saved!')}
                              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                            >
                              Compile & Re-Score Portfolio
                            </button>

                          </div>

                          {/* Score widget sidebar */}
                          <div className="space-y-6">
                            
                            {/* ATS SCORE CARD */}
                            <div className="bg-[#120B2E] border border-gray-200 rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-center text-center shadow-2xl relative">
                              <h4 className="text-base font-black uppercase text-slate-700 mb-6">ATS Compatibility</h4>
                              
                              {/* Glowing Circle ring */}
                              <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                                <svg className="transform -rotate-90" width={160} height={160}>
                                  <circle cx={80} cy={80} r={65} stroke="rgba(255,255,255,0.02)" strokeWidth={10} fill="transparent" />
                                  <circle
                                    cx={80}
                                    cy={80}
                                    r={65}
                                    stroke="rgb(168,85,247)"
                                    strokeWidth={10}
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 65}
                                    strokeDashoffset={2 * Math.PI * 65 * (1 - atsScore / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                  <span className="text-4xl font-black text-slate-800">{atsScore}</span>
                                  <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold mt-1">SDE Ready</span>
                                </div>
                              </div>

                              <button
                                onClick={() => setShowImprovementList(!showImprovementList)}
                                className="text-xs font-black uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1.5"
                              >
                                {showImprovementList ? 'Hide details' : 'Show suggested improvements'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showImprovementList ? 'rotate-180' : ''}`} />
                              </button>

                              {showImprovementList && (
                                <div className="mt-6 w-full text-left bg-gray-100/40 p-4 rounded-xl border border-white/[0.02] text-xs text-slate-400 space-y-2.5">
                                  <div className="flex gap-2 items-start"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> <span>Valid GitHub & LinkedIn connection linked.</span></div>
                                  <div className="flex gap-2 items-start"><Check className="w-4 h-4 text-green-400 flex-shrink-0" /> <span>Strong core programming stack matching Google.</span></div>
                                  <div className="flex gap-2 items-start"><Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" /> <span>Add more metrics-driven achievements (e.g. Optimized speed by 25%).</span></div>
                                </div>
                              )}
                            </div>

                            {/* Portfolio preview buttons */}
                            <div className="bg-gray-50/80 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-6">
                              <h4 className="text-lg font-bold text-slate-700">Share Public URL</h4>
                              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Publish your resume-portfolio directly into global placement pools.</p>
                              <div className="bg-gray-100 p-4 rounded-xl border border-gray-100 text-xs font-mono text-purple-400 break-all select-all select-none">
                                https://studlyf.pro/portfolio/{selectedCompany.id}_candidate_772
                              </div>
                              <button
                                onClick={() => triggerToast('Share link copied to clipboard!')}
                                className="w-full py-3 bg-gray-100 border border-gray-200 hover:border-purple-500/30 text-purple-400 rounded-xl font-black text-[10px] uppercase tracking-wider"
                              >
                                Copy Shareable Link
                              </button>
                            </div>

                          </div>

                        </div>
                      </div>
                    )}

                    {/* ====================================================
                        TAB: MOCK INTERVIEW
                        ==================================================== */}
                    {activeTab === 'mock' && (
                      <div className="space-y-8">
                        <header>
                          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">Neural Placement Simulator</h2>
                          <p className="text-xs font-semibold text-slate-400">Practice with a live avatar calibrated for {selectedCompany.name}'s rigorous interview standards.</p>
                        </header>

                        {!simActive ? (
                          <div className="flex flex-col items-center justify-center text-center py-20 bg-gray-50/80 border border-gray-200 rounded-[2.5rem]">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mb-8 shadow-2xl relative">
                              <Bot className="w-12 h-12 text-white animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-black mb-4">Initialize {selectedCompany.name} Calibration</h3>
                            <p className="text-sm text-slate-400 max-w-lg mb-8 leading-relaxed font-medium">
                              Our neural pipeline calibrates questions dynamically based on current tech openings and behavioral rubrics.
                            </p>
                            <button
                              onClick={launchHrSimulator}
                              className="px-12 py-5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-purple-100/40"
                            >
                              Initialize Neural Round
                            </button>
                          </div>
                        ) : (
                          
                          /* ACTIVE CHAT WORKSPACE */
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Chat history list */}
                            <div className="lg:col-span-2 flex flex-col justify-between bg-gray-100/50 border border-gray-200 rounded-[2rem] h-[500px] overflow-hidden">
                              <div className="p-6 overflow-y-auto space-y-4 flex-grow max-h-[420px]">
                                {chatMessages.map((msg, i) => (
                                  <div
                                    key={i}
                                    className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                                  >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-purple-100 text-purple-300' : 'bg-gray-100 text-slate-400 border border-gray-200'}`}>
                                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${msg.sender === 'user' ? 'bg-purple-100 text-purple-200 rounded-tr-none' : 'bg-gray-100/80 text-slate-600 rounded-tl-none border border-white/[0.02]'}`}>
                                      {msg.text}
                                    </div>
                                  </div>
                                ))}
                                {simSpeaking && (
                                  <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 text-slate-400 border border-gray-200 flex items-center justify-center">
                                      <Bot className="w-4 h-4 animate-spin" />
                                    </div>
                                    <div className="p-4 bg-gray-100/40 text-slate-400 rounded-2xl text-xs rounded-tl-none">
                                      Generating next neural prompt...
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Input typing text area */}
                              <div className="p-4 border-t border-gray-200 bg-gray-100 flex gap-3">
                                <input
                                  type="text"
                                  value={simUserText}
                                  onChange={(e) => setSimUserText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSimSubmit()}
                                  placeholder="Type your response to the interviewer..."
                                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-purple-500 text-slate-700"
                                />
                                <button
                                  onClick={handleSimSubmit}
                                  className="px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase"
                                >
                                  Send
                                </button>
                              </div>
                            </div>

                            {/* Scoring details sidebar */}
                            <div className="bg-gray-50/80 border border-gray-200 p-6 lg:p-8 rounded-[2rem] flex flex-col justify-between h-[500px]">
                              <div>
                                <h4 className="text-lg font-bold text-slate-700 mb-6">Simulation Status</h4>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-100 rounded-xl border border-gray-100">
                                    <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Session Target</span>
                                    <span className="text-xs font-black text-slate-600">{selectedCompany.name} HR Calibration</span>
                                  </div>
                                  <div className="p-4 bg-gray-100 rounded-xl border border-gray-100">
                                    <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Speech Delivery</span>
                                    <span className="text-xs font-black text-slate-600">Continuous typing evaluation</span>
                                  </div>
                                  <div className="p-4 bg-gray-100 rounded-xl border border-gray-100">
                                    <span className="text-[8px] uppercase tracking-widest text-slate-400 block mb-1">Completed Rounds</span>
                                    <span className="text-xs font-black text-purple-400">{simQuestionIndex} / 3 Challenges</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSimActive(false);
                                  setChatMessages([]);
                                }}
                                className="w-full py-4 bg-gray-100 border border-gray-200 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl font-black text-xs uppercase transition-all"
                              >
                                Abort Simulation Run
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    )}

                    {/* ====================================================
                        TAB: PROGRESS TRACKER
                        ==================================================== */}
                    {activeTab === 'progress' && (
                      <div className="space-y-8">
                        <header>
                          <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800 mb-2">Gate Performance Overview</h2>
                          <p className="text-xs font-semibold text-slate-400">Detailed analytics of your placement readiness for {selectedCompany.name}.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Left core charts grid */}
                          <div className="lg:col-span-2 space-y-6">
                            
                            {/* Analytics Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-gray-50/80 border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-2">Solved Questions</span>
                                <div className="text-4xl font-black text-purple-400">{solvedQuestions.length}</div>
                                <span className="text-[9px] text-slate-400 font-bold block mt-2">Target goal: {selectedCompany.dsa.length} Challenges</span>
                              </div>
                              <div className="bg-gray-50/80 border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-2">Saved Bookmarks</span>
                                <div className="text-4xl font-black text-pink-400">{savedQuestions.length}</div>
                                <span className="text-[9px] text-slate-400 font-bold block mt-2">Saved questions to review</span>
                              </div>
                            </div>

                            {/* Topic mastery visualization chart */}
                            <div className="bg-gray-50/80 border border-gray-200 p-6 lg:p-8 rounded-[2rem] space-y-6">
                              <h3 className="text-lg font-bold text-slate-700">Algorithmic Topic Mastery</h3>
                              
                              <div className="space-y-4">
                                {[
                                  { topic: 'Trees & DFS', mastery: 85, color: 'bg-purple-500' },
                                  { topic: 'Sliding Window', mastery: 72, color: 'bg-pink-500' },
                                  { topic: 'Linked List Pointers', mastery: 95, color: 'bg-violet-500' },
                                  { topic: 'Dynamic Programming', mastery: 40, color: 'bg-orange-500' }
                                ].map((tp) => (
                                  <div key={tp.topic} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-400">
                                      <span>{tp.topic}</span>
                                      <span>{tp.mastery}% Mastery</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-white/[0.02]">
                                      <div className={`h-full ${tp.color}`} style={{ width: `${tp.mastery}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>

                          {/* Streak widgets */}
                          <div className="space-y-6">
                            
                            {/* Streak Score */}
                            <div className="bg-[#120B2E] border border-gray-200 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Zap className="w-24 h-24" />
                              </div>
                              <span className="text-[9px] uppercase tracking-widest font-black text-purple-400 mb-4 block">Placement Momentum</span>
                              <div className="text-5xl font-black text-yellow-400 mb-2">{streaks} Day Streak!</div>
                              <p className="text-xs text-slate-400 font-semibold leading-relaxed px-4">
                                Solve a challenge or run a calibration simulation daily to protect your streak score.
                              </p>
                            </div>

                            {/* Bookmarks quick solve list */}
                            <div className="bg-gray-50/80 border border-gray-200 rounded-[2rem] p-6 lg:p-8 space-y-4">
                              <h4 className="text-base font-bold text-slate-700">Saved Bookmarks</h4>
                              {savedQuestions.length === 0 ? (
                                <p className="text-xs text-slate-400 font-semibold">No questions bookmarked yet. Start practice challenges to save them!</p>
                              ) : (
                                <div className="space-y-2">
                                  {savedQuestions.map((qid) => {
                                    const question = selectedCompany.dsa.find(q => q.id === qid);
                                    if (!question) return null;
                                    return (
                                      <div
                                        key={qid}
                                        onClick={() => setSelectedQuestion(question)}
                                        className="p-3 bg-gray-100/50 rounded-xl border border-white/[0.02] hover:border-purple-500/20 cursor-pointer flex justify-between items-center transition-all group"
                                      >
                                        <span className="text-xs text-slate-600 group-hover:text-purple-400 transition-colors font-bold">{question.title}</span>
                                        <ChevronRight className="w-4 h-4 text-slate-600" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                          </div>

                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );
};

export default CompanyModules;
