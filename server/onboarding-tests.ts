import { storage } from './storage';

// Comprehensive onboarding test templates
export const onboardingTestTemplates = {
  // Personality Assessment - Big Five Model
  personalityTest: {
    title: "Personality Assessment",
    description: "Assess personality traits using the Big Five model to understand work preferences and team dynamics",
    type: "personality" as const,
    timeLimit: 25,
    instructions: "Answer honestly based on how you typically behave in work situations. There are no right or wrong answers.",
    questions: [
      {
        text: "I am someone who is talkative and outgoing in group settings",
        type: "likert" as const,
        category: "extraversion",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I prefer to work independently rather than in teams",
        type: "likert" as const,
        category: "extraversion",
        reverse: true,
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I am detail-oriented and thorough in my work",
        type: "likert" as const,
        category: "conscientiousness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I often try new approaches to solve problems",
        type: "likert" as const,
        category: "openness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I remain calm under pressure and stress",
        type: "likert" as const,
        category: "neuroticism",
        reverse: true,
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I am considerate and cooperative with colleagues",
        type: "likert" as const,
        category: "agreeableness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      // Additional Extraversion Questions
      {
        text: "I enjoy being the center of attention in social situations",
        type: "likert" as const,
        category: "extraversion",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I often take charge in group projects",
        type: "likert" as const,
        category: "extraversion",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I feel energized after spending time with many people",
        type: "likert" as const,
        category: "extraversion",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      // Additional Conscientiousness Questions
      {
        text: "I always complete tasks well before deadlines",
        type: "likert" as const,
        category: "conscientiousness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I find it easy to stick to my goals and plans",
        type: "likert" as const,
        category: "conscientiousness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I am organized and keep my workspace tidy",
        type: "likert" as const,
        category: "conscientiousness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      // Additional Openness Questions
      {
        text: "I enjoy learning about different cultures and perspectives",
        type: "likert" as const,
        category: "openness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I am interested in abstract concepts and theories",
        type: "likert" as const,
        category: "openness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I actively seek out creative solutions to problems",
        type: "likert" as const,
        category: "openness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      // Additional Neuroticism Questions (note: reversed scoring)
      {
        text: "I worry frequently about things that might go wrong",
        type: "likert" as const,
        category: "neuroticism",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I bounce back quickly from setbacks",
        type: "likert" as const,
        category: "neuroticism",
        reverse: true,
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I often feel overwhelmed by emotions",
        type: "likert" as const,
        category: "neuroticism",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      // Additional Agreeableness Questions
      {
        text: "I often put others' needs before my own",
        type: "likert" as const,
        category: "agreeableness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I find it easy to forgive others when they make mistakes",
        type: "likert" as const,
        category: "agreeableness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      },
      {
        text: "I believe most people are trustworthy",
        type: "likert" as const,
        category: "agreeableness",
        options: [
          { text: "Strongly Disagree", value: 1 },
          { text: "Disagree", value: 2 },
          { text: "Neutral", value: 3 },
          { text: "Agree", value: 4 },
          { text: "Strongly Agree", value: 5 }
        ]
      }
    ]
  },

  // Cognitive Abilities Test - Extensive Intelligence Assessment
  cognitiveTest: {
    title: "Cognitive Abilities Assessment",
    description: "Comprehensive evaluation of problem-solving, logical reasoning, analytical thinking, pattern recognition, and numerical reasoning skills",
    type: "cognitive" as const,
    timeLimit: 45,
    instructions: "Select the best answer for each question. This assessment covers multiple cognitive abilities. You have 45 minutes to complete all sections.",
    questions: [
      {
        text: "If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.",
        type: "multiple_choice" as const,
        category: "logical_reasoning",
        options: [
          { text: "True", value: "true", isCorrect: true },
          { text: "False", value: "false" },
          { text: "Cannot be determined", value: "unknown" }
        ]
      },
      {
        text: "What number should come next in this sequence: 2, 6, 18, 54, ?",
        type: "multiple_choice" as const,
        category: "pattern_recognition",
        options: [
          { text: "108", value: "108" },
          { text: "162", value: "162", isCorrect: true },
          { text: "216", value: "216" },
          { text: "324", value: "324" }
        ]
      },
      {
        text: "A team of 5 people can complete a project in 12 days. How many days would it take for 3 people to complete the same project?",
        type: "multiple_choice" as const,
        category: "numerical_reasoning",
        options: [
          { text: "15 days", value: "15" },
          { text: "18 days", value: "18" },
          { text: "20 days", value: "20", isCorrect: true },
          { text: "24 days", value: "24" }
        ]
      },
      // Additional Logical Reasoning Questions
      {
        text: "All cats are mammals. Some mammals are dogs. Therefore, some cats are dogs.",
        type: "multiple_choice" as const,
        category: "logical_reasoning",
        options: [
          { text: "True", value: "true" },
          { text: "False", value: "false", isCorrect: true },
          { text: "Cannot be determined", value: "unknown" }
        ]
      },
      {
        text: "In a certain code, FLOWER is written as REWOLF. How is GARDEN written in that code?",
        type: "multiple_choice" as const,
        category: "logical_reasoning",
        options: [
          { text: "NEDRAG", value: "nedrag", isCorrect: true },
          { text: "GRADNE", value: "gradne" },
          { text: "DENGRA", value: "dengra" },
          { text: "RAGDEN", value: "ragden" }
        ]
      },
      // Additional Pattern Recognition Questions
      {
        text: "What comes next in this sequence: A, C, F, J, O, ?",
        type: "multiple_choice" as const,
        category: "pattern_recognition",
        options: [
          { text: "S", value: "s" },
          { text: "T", value: "t" },
          { text: "U", value: "u", isCorrect: true },
          { text: "V", value: "v" }
        ]
      },
      {
        text: "Complete the pattern: 1, 4, 9, 16, 25, ?",
        type: "multiple_choice" as const,
        category: "pattern_recognition",
        options: [
          { text: "30", value: "30" },
          { text: "35", value: "35" },
          { text: "36", value: "36", isCorrect: true },
          { text: "49", value: "49" }
        ]
      },
      // Additional Numerical Reasoning Questions
      {
        text: "If 20% of a number is 45, what is 75% of the same number?",
        type: "multiple_choice" as const,
        category: "numerical_reasoning",
        options: [
          { text: "168.75", value: "168.75", isCorrect: true },
          { text: "150.00", value: "150.00" },
          { text: "180.00", value: "180.00" },
          { text: "135.00", value: "135.00" }
        ]
      },
      {
        text: "A store offers a 25% discount on all items. If an item originally costs $80, what is the final price after discount?",
        type: "multiple_choice" as const,
        category: "numerical_reasoning",
        options: [
          { text: "$55", value: "55" },
          { text: "$60", value: "60", isCorrect: true },
          { text: "$65", value: "65" },
          { text: "$70", value: "70" }
        ]
      },
      // Spatial Reasoning Questions
      {
        text: "How many cubes are there in a 3x3x3 cube structure?",
        type: "multiple_choice" as const,
        category: "spatial_reasoning",
        options: [
          { text: "18", value: "18" },
          { text: "24", value: "24" },
          { text: "27", value: "27", isCorrect: true },
          { text: "30", value: "30" }
        ]
      },
      {
        text: "If you fold a piece of paper in half twice and then make one cut, how many holes will there be when you unfold it?",
        type: "multiple_choice" as const,
        category: "spatial_reasoning",
        options: [
          { text: "2", value: "2" },
          { text: "4", value: "4", isCorrect: true },
          { text: "6", value: "6" },
          { text: "8", value: "8" }
        ]
      },
      // Advanced Logical Reasoning
      {
        text: "If some doctors are teachers, and all teachers are intelligent, which statement must be true?",
        type: "multiple_choice" as const,
        category: "logical_reasoning",
        options: [
          { text: "All doctors are intelligent", value: "all_doctors" },
          { text: "Some doctors are intelligent", value: "some_doctors", isCorrect: true },
          { text: "No doctors are intelligent", value: "no_doctors" },
          { text: "Most doctors are teachers", value: "most_doctors" }
        ]
      },
      {
        text: "In a group of 100 people, 70 like coffee, 80 like tea. What is the minimum number of people who like both?",
        type: "multiple_choice" as const,
        category: "logical_reasoning",
        options: [
          { text: "30", value: "30" },
          { text: "40", value: "40" },
          { text: "50", value: "50", isCorrect: true },
          { text: "60", value: "60" }
        ]
      },
      // Advanced Pattern Recognition
      {
        text: "What number comes next: 1, 1, 2, 3, 5, 8, 13, ?",
        type: "multiple_choice" as const,
        category: "pattern_recognition",
        options: [
          { text: "18", value: "18" },
          { text: "19", value: "19" },
          { text: "20", value: "20" },
          { text: "21", value: "21", isCorrect: true }
        ]
      },
      {
        text: "Complete the analogy: Book is to Library as Car is to ?",
        type: "multiple_choice" as const,
        category: "pattern_recognition",
        options: [
          { text: "Road", value: "road" },
          { text: "Garage", value: "garage", isCorrect: true },
          { text: "Driver", value: "driver" },
          { text: "Engine", value: "engine" }
        ]
      },
      // Advanced Numerical Reasoning
      {
        text: "A investment doubles every 5 years. If you start with $1000, what will it be worth after 15 years?",
        type: "multiple_choice" as const,
        category: "numerical_reasoning",
        options: [
          { text: "$4000", value: "4000" },
          { text: "$6000", value: "6000" },
          { text: "$8000", value: "8000", isCorrect: true },
          { text: "$16000", value: "16000" }
        ]
      },
      {
        text: "If 3 machines can produce 90 items in 2 hours, how many items can 5 machines produce in 3 hours?",
        type: "multiple_choice" as const,
        category: "numerical_reasoning",
        options: [
          { text: "150", value: "150" },
          { text: "200", value: "200" },
          { text: "225", value: "225", isCorrect: true },
          { text: "250", value: "250" }
        ]
      },
      // Problem-Solving Scenarios
      {
        text: "You have a 3-gallon jug and a 5-gallon jug. How do you measure exactly 4 gallons of water?",
        type: "multiple_choice" as const,
        category: "problem_solving",
        options: [
          { text: "Fill 5-gallon, pour into 3-gallon, empty 3-gallon, pour remaining 2 gallons from 5-gallon into 3-gallon, fill 5-gallon again, pour into 3-gallon until full", value: "complex_method", isCorrect: true },
          { text: "Fill both jugs and estimate", value: "estimate" },
          { text: "Use only the 5-gallon jug", value: "five_only" },
          { text: "It's impossible with these jugs", value: "impossible" }
        ]
      },
      {
        text: "A clock shows 3:15. What is the acute angle between the hour and minute hands?",
        type: "multiple_choice" as const,
        category: "spatial_reasoning",
        options: [
          { text: "0 degrees", value: "0" },
          { text: "7.5 degrees", value: "7.5", isCorrect: true },
          { text: "15 degrees", value: "15" },
          { text: "90 degrees", value: "90" }
        ]
      },
      // Abstract Reasoning
      {
        text: "Which word does NOT belong: Apple, Orange, Car, Banana?",
        type: "multiple_choice" as const,
        category: "abstract_reasoning",
        options: [
          { text: "Apple", value: "apple" },
          { text: "Orange", value: "orange" },
          { text: "Car", value: "car", isCorrect: true },
          { text: "Banana", value: "banana" }
        ]
      },
      {
        text: "If MONDAY is coded as 123456, what would WOMAN be coded as?",
        type: "multiple_choice" as const,
        category: "abstract_reasoning",
        options: [
          { text: "21853", value: "21853", isCorrect: true },
          { text: "52813", value: "52813" },
          { text: "13258", value: "13258" },
          { text: "85213", value: "85213" }
        ]
      },
      // Advanced Spatial Reasoning
      {
        text: "How many triangles are in a pentagram (5-pointed star)?",
        type: "multiple_choice" as const,
        category: "spatial_reasoning",
        options: [
          { text: "5", value: "5" },
          { text: "10", value: "10" },
          { text: "15", value: "15" },
          { text: "35", value: "35", isCorrect: true }
        ]
      },
      {
        text: "If you rotate the letter 'p' 180 degrees, what letter do you get?",
        type: "multiple_choice" as const,
        category: "spatial_reasoning",
        options: [
          { text: "b", value: "b" },
          { text: "d", value: "d", isCorrect: true },
          { text: "q", value: "q" },
          { text: "u", value: "u" }
        ]
      }
    ]
  },

  // Communication Skills Test - Extensive Assessment
  communicationTest: {
    title: "Communication Skills Assessment",
    description: "Comprehensive evaluation of written communication, verbal skills, presentation abilities, active listening, conflict resolution, and interpersonal communication in professional contexts",
    type: "communication" as const,
    timeLimit: 35,
    instructions: "Choose the most appropriate response for each workplace communication scenario. This assessment covers multiple communication domains including written, verbal, and interpersonal skills.",
    questions: [
      {
        text: "A client emails expressing frustration about a delayed project. What is the best initial response?",
        type: "multiple_choice" as const,
        category: "client_communication",
        options: [
          { text: "Explain all the technical reasons for the delay", value: "technical" },
          { text: "Acknowledge their concern, apologize, and provide a clear timeline for resolution", value: "acknowledge", isCorrect: true },
          { text: "Forward the email to your manager", value: "forward" },
          { text: "Respond that delays are normal in projects", value: "normal" }
        ]
      },
      {
        text: "During a team meeting, two colleagues disagree strongly about an approach. How should you contribute?",
        type: "multiple_choice" as const,
        category: "team_communication",
        options: [
          { text: "Stay silent to avoid conflict", value: "silent" },
          { text: "Support the person with more authority", value: "authority" },
          { text: "Ask clarifying questions and help find common ground", value: "mediate", isCorrect: true },
          { text: "Suggest postponing the decision", value: "postpone" }
        ]
      },
      // Additional Client Communication Questions
      {
        text: "A client requests a significant change to a project that's 80% complete. What's your first step?",
        type: "multiple_choice" as const,
        category: "client_communication",
        options: [
          { text: "Immediately agree to make the change", value: "agree" },
          { text: "Explain why the change cannot be made", value: "refuse" },
          { text: "Assess the impact and present options with timelines and costs", value: "assess", isCorrect: true },
          { text: "Suggest they wait for the next project phase", value: "wait" }
        ]
      },
      {
        text: "When presenting a complex technical solution to non-technical stakeholders, you should:",
        type: "multiple_choice" as const,
        category: "client_communication",
        options: [
          { text: "Use detailed technical terminology to show expertise", value: "technical" },
          { text: "Focus on benefits and outcomes using simple language", value: "benefits", isCorrect: true },
          { text: "Provide only high-level summaries", value: "summary" },
          { text: "Let someone else handle the presentation", value: "delegate" }
        ]
      },
      // Additional Team Communication Questions
      {
        text: "You notice a team member struggling with their workload but haven't asked for help. You should:",
        type: "multiple_choice" as const,
        category: "team_communication",
        options: [
          { text: "Wait for them to ask for help", value: "wait" },
          { text: "Report the issue to management immediately", value: "report" },
          { text: "Privately offer assistance and discuss workload concerns", value: "offer", isCorrect: true },
          { text: "Take over some of their tasks without asking", value: "takeover" }
        ]
      },
      {
        text: "When giving feedback to a colleague about their work, the most effective approach is to:",
        type: "multiple_choice" as const,
        category: "team_communication",
        options: [
          { text: "Focus only on what needs improvement", value: "negative" },
          { text: "Give feedback in front of the whole team", value: "public" },
          { text: "Provide specific, constructive comments with examples", value: "specific", isCorrect: true },
          { text: "Keep feedback general to avoid hurt feelings", value: "general" }
        ]
      },
      // Written Communication Questions
      {
        text: "When writing an important business email, you should always:",
        type: "multiple_choice" as const,
        category: "written_communication",
        options: [
          { text: "Keep it as brief as possible", value: "brief" },
          { text: "Use formal language regardless of the relationship", value: "formal" },
          { text: "Include a clear subject line and organize information logically", value: "organized", isCorrect: true },
          { text: "Copy everyone who might be interested", value: "copy_all" }
        ]
      },
      {
        text: "If you need to deliver bad news in writing, the best approach is to:",
        type: "multiple_choice" as const,
        category: "written_communication",
        options: [
          { text: "Start with the bad news directly", value: "direct" },
          { text: "Bury the bad news in the middle of positive information", value: "bury" },
          { text: "Provide context, deliver the news clearly, then offer solutions", value: "context", isCorrect: true },
          { text: "Use euphemisms to soften the impact", value: "euphemisms" }
        ]
      },
      // Presentation Skills Questions
      {
        text: "During a presentation, you realize you made an error in your data. You should:",
        type: "multiple_choice" as const,
        category: "presentation_skills",
        options: [
          { text: "Continue and hope no one notices", value: "ignore" },
          { text: "Stop immediately and correct the error", value: "stop" },
          { text: "Acknowledge the error and provide the correction", value: "acknowledge", isCorrect: true },
          { text: "End the presentation early", value: "end" }
        ]
      }
    ]
  },

  // Technical Skills Assessment (General)
  technicalTest: {
    title: "Technical Skills Assessment",
    description: "Assess general technical aptitude and problem-solving abilities",
    type: "technical" as const,
    timeLimit: 35,
    instructions: "Answer questions related to general technical concepts and problem-solving approaches.",
    questions: [
      {
        text: "What is the primary purpose of version control systems like Git?",
        type: "multiple_choice" as const,
        category: "software_development",
        options: [
          { text: "To backup files automatically", value: "backup" },
          { text: "To track changes and collaborate on code", value: "version_control", isCorrect: true },
          { text: "To compile source code", value: "compile" },
          { text: "To test applications", value: "testing" }
        ]
      },
      {
        text: "In project management, what does 'scope creep' refer to?",
        type: "multiple_choice" as const,
        category: "project_management",
        options: [
          { text: "Gradual expansion of project requirements beyond the original plan", value: "expansion", isCorrect: true },
          { text: "Team members working too slowly", value: "slow_work" },
          { text: "Budget overruns", value: "budget" },
          { text: "Missing project deadlines", value: "deadlines" }
        ]
      },
      // Additional Software Development Questions
      {
        text: "What is the main benefit of using automated testing in software development?",
        type: "multiple_choice" as const,
        category: "software_development",
        options: [
          { text: "It eliminates the need for manual testing entirely", value: "eliminate_manual" },
          { text: "It ensures code quality and catches bugs early", value: "quality", isCorrect: true },
          { text: "It makes development faster in all cases", value: "faster" },
          { text: "It reduces the need for documentation", value: "less_docs" }
        ]
      },
      {
        text: "In database design, what is normalization primarily used for?",
        type: "multiple_choice" as const,
        category: "software_development",
        options: [
          { text: "Making databases run faster", value: "speed" },
          { text: "Reducing data redundancy and ensuring data integrity", value: "integrity", isCorrect: true },
          { text: "Adding more tables to the database", value: "more_tables" },
          { text: "Encrypting sensitive data", value: "encryption" }
        ]
      },
      // Additional Project Management Questions
      {
        text: "What is the primary purpose of a project charter?",
        type: "multiple_choice" as const,
        category: "project_management",
        options: [
          { text: "To track daily progress", value: "daily_progress" },
          { text: "To define project scope, objectives, and stakeholders", value: "define_scope", isCorrect: true },
          { text: "To assign individual tasks", value: "assign_tasks" },
          { text: "To calculate project costs", value: "calculate_costs" }
        ]
      },
      {
        text: "In Agile methodology, what is the purpose of a sprint retrospective?",
        type: "multiple_choice" as const,
        category: "project_management",
        options: [
          { text: "To plan the next sprint's tasks", value: "plan_sprint" },
          { text: "To demonstrate completed work to stakeholders", value: "demo_work" },
          { text: "To reflect on the sprint and identify improvements", value: "reflect", isCorrect: true },
          { text: "To assign blame for missed deadlines", value: "assign_blame" }
        ]
      },
      // Problem Solving Questions
      {
        text: "When faced with a complex technical problem, the most effective first step is to:",
        type: "multiple_choice" as const,
        category: "problem_solving",
        options: [
          { text: "Start implementing the first solution that comes to mind", value: "first_solution" },
          { text: "Ask someone else to solve it", value: "ask_others" },
          { text: "Break down the problem into smaller, manageable components", value: "break_down", isCorrect: true },
          { text: "Search online for similar problems", value: "search_online" }
        ]
      },
      {
        text: "What is the most important factor when choosing between multiple technical solutions?",
        type: "multiple_choice" as const,
        category: "problem_solving",
        options: [
          { text: "The solution that takes the least time to implement", value: "least_time" },
          { text: "The solution that uses the newest technology", value: "newest_tech" },
          { text: "The solution that best meets requirements within constraints", value: "meets_requirements", isCorrect: true },
          { text: "The solution that is most impressive", value: "most_impressive" }
        ]
      },
      // Data Analysis Questions
      {
        text: "When analyzing data to make business decisions, what should you consider first?",
        type: "multiple_choice" as const,
        category: "data_analysis",
        options: [
          { text: "The most complex analysis methods available", value: "complex_methods" },
          { text: "The quality and relevance of the data", value: "data_quality", isCorrect: true },
          { text: "The tools used by competitors", value: "competitor_tools" },
          { text: "The speed of analysis", value: "analysis_speed" }
        ]
      },
      {
        text: "What does a correlation coefficient of 0.95 between two variables indicate?",
        type: "multiple_choice" as const,
        category: "data_analysis",
        options: [
          { text: "One variable causes the other", value: "causation" },
          { text: "The variables have a strong positive relationship", value: "strong_positive", isCorrect: true },
          { text: "95% of the data is accurate", value: "accuracy" },
          { text: "The analysis is 95% complete", value: "complete" }
        ]
      }
    ]
  },

  // Values and Culture Fit Test
  cultureTest: {
    title: "Values and Culture Fit Assessment",
    description: "Evaluate alignment with company values and cultural expectations",
    type: "culture" as const,
    timeLimit: 15,
    instructions: "Select responses that best reflect your work values and preferences.",
    questions: [
      {
        text: "What motivates you most in your work?",
        type: "multiple_choice" as const,
        category: "motivation",
        options: [
          { text: "Recognition and advancement opportunities", value: "recognition" },
          { text: "Learning new skills and taking on challenges", value: "learning", isCorrect: true },
          { text: "Stable routine and predictable tasks", value: "stability" },
          { text: "High compensation and benefits", value: "compensation" }
        ]
      },
      {
        text: "How do you prefer to receive feedback on your work?",
        type: "multiple_choice" as const,
        category: "feedback_preference",
        options: [
          { text: "Regular formal reviews", value: "formal" },
          { text: "Continuous informal feedback", value: "continuous", isCorrect: true },
          { text: "Only when there are problems", value: "problems" },
          { text: "Through written reports", value: "written" }
        ]
      },
      // Additional Motivation Questions
      {
        text: "When working on a long-term project, what keeps you most engaged?",
        type: "multiple_choice" as const,
        category: "motivation",
        options: [
          { text: "Regular milestones and progress celebrations", value: "milestones", isCorrect: true },
          { text: "Constant supervision and guidance", value: "supervision" },
          { text: "Working alone without interruption", value: "alone" },
          { text: "Competing with colleagues", value: "competition" }
        ]
      },
      {
        text: "What type of work environment do you find most productive?",
        type: "multiple_choice" as const,
        category: "work_environment",
        options: [
          { text: "Quiet spaces with minimal distractions", value: "quiet" },
          { text: "Collaborative open offices with team interaction", value: "collaborative", isCorrect: true },
          { text: "Flexible spaces that can be adapted as needed", value: "flexible" },
          { text: "Traditional private offices", value: "private" }
        ]
      },
      // Work Style Questions
      {
        text: "When starting a new project, your preferred approach is to:",
        type: "multiple_choice" as const,
        category: "work_style",
        options: [
          { text: "Jump in and start working immediately", value: "jump_in" },
          { text: "Plan thoroughly before beginning any work", value: "plan_first", isCorrect: true },
          { text: "Wait for detailed instructions from others", value: "wait_instructions" },
          { text: "Work on the easiest parts first", value: "easy_first" }
        ]
      },
      {
        text: "How do you typically handle tight deadlines?",
        type: "multiple_choice" as const,
        category: "work_style",
        options: [
          { text: "Work longer hours to meet the deadline", value: "longer_hours" },
          { text: "Prioritize tasks and focus on the most critical deliverables", value: "prioritize", isCorrect: true },
          { text: "Ask for deadline extensions", value: "extensions" },
          { text: "Delegate work to others", value: "delegate" }
        ]
      },
      // Innovation Questions
      {
        text: "When you encounter a process that seems inefficient, you typically:",
        type: "multiple_choice" as const,
        category: "innovation",
        options: [
          { text: "Follow the existing process to avoid problems", value: "follow_existing" },
          { text: "Propose improvements and alternative approaches", value: "propose_improvements", isCorrect: true },
          { text: "Complain about the inefficiency", value: "complain" },
          { text: "Work around it without telling anyone", value: "work_around" }
        ]
      },
      {
        text: "Your attitude toward change in the workplace is:",
        type: "multiple_choice" as const,
        category: "change_adaptation",
        options: [
          { text: "Resistant - prefer stability and routine", value: "resistant" },
          { text: "Cautious - need time to adjust", value: "cautious" },
          { text: "Adaptive - embrace change as opportunity", value: "adaptive", isCorrect: true },
          { text: "Indifferent - change doesn't affect me", value: "indifferent" }
        ]
      },
      // Leadership Questions
      {
        text: "When leading a team project, your primary focus is on:",
        type: "multiple_choice" as const,
        category: "leadership_style",
        options: [
          { text: "Ensuring everyone follows established procedures", value: "procedures" },
          { text: "Empowering team members and facilitating collaboration", value: "empowering", isCorrect: true },
          { text: "Making all decisions yourself", value: "all_decisions" },
          { text: "Delegating everything to team members", value: "delegate_all" }
        ]
      },
      {
        text: "How do you handle conflicts within your team?",
        type: "multiple_choice" as const,
        category: "conflict_resolution",
        options: [
          { text: "Avoid getting involved and let them resolve it", value: "avoid" },
          { text: "Make a decision and enforce it", value: "enforce" },
          { text: "Facilitate discussion to find mutually acceptable solutions", value: "facilitate", isCorrect: true },
          { text: "Report the conflict to higher management", value: "report" }
        ]
      }
    ]
  }
};

// Function to create all onboarding tests
export async function createOnboardingTests() {
  const testResults = [];
  
  for (const [key, template] of Object.entries(onboardingTestTemplates)) {
    try {
      // Create the test
      const test = await storage.createPsychometricTest({
        testName: template.title,
        testType: template.type,
        description: template.description,
        timeLimit: template.timeLimit,
        totalQuestions: template.questions.length,
        instructions: template.instructions,
        isActive: true
      });

      // Create questions for the test
      for (const questionData of template.questions) {
        await storage.createPsychometricQuestion({
          testId: test.id,
          questionText: questionData.text,
          questionType: questionData.type,
          options: JSON.stringify(questionData.options),
          correctAnswer: questionData.options.find((opt: any) => opt.isCorrect)?.value?.toString() || null,
          category: questionData.category,
          order: template.questions.indexOf(questionData) + 1
        });
      }

      testResults.push({ testKey: key, testId: test.id, title: template.title });
    } catch (error) {
      console.error(`Error creating test ${key}:`, error);
    }
  }

  return testResults;
}

// Scoring algorithms for different test types
export const scoringAlgorithms = {
  personality: (answers: any[]) => {
    const categories = {
      extraversion: 0,
      conscientiousness: 0,
      openness: 0,
      neuroticism: 0,
      agreeableness: 0
    };

    answers.forEach(answer => {
      const category = answer.question.category;
      let score = parseInt(answer.selectedValue);
      
      // Reverse scoring for certain questions
      if (answer.question.reverse) {
        score = 6 - score;
      }
      
      if (category in categories) {
        (categories as any)[category] += score;
      }
    });

    return {
      scores: categories,
      interpretation: generatePersonalityInterpretation(categories)
    };
  },

  cognitive: (answers: any[]) => {
    let correctAnswers = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    answers.forEach(answer => {
      const isCorrect = answer.selectedValue === answer.question.correctAnswer;
      if (isCorrect) correctAnswers++;

      const category = answer.question.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      categoryScores[category].total++;
      if (isCorrect) categoryScores[category].correct++;
    });

    const totalScore = (correctAnswers / answers.length) * 100;

    return {
      totalScore,
      correctAnswers,
      totalQuestions: answers.length,
      categoryBreakdown: categoryScores,
      interpretation: generateCognitiveInterpretation(totalScore)
    };
  },

  communication: (answers: any[]) => {
    let score = 0;
    answers.forEach(answer => {
      if (answer.selectedValue === answer.question.correctAnswer) {
        score += 10;
      }
    });

    const percentage = (score / (answers.length * 10)) * 100;
    return {
      score: percentage,
      interpretation: generateCommunicationInterpretation(percentage)
    };
  },

  technical: (answers: any[]) => {
    let correctAnswers = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    answers.forEach(answer => {
      const isCorrect = answer.selectedValue === answer.question.correctAnswer;
      if (isCorrect) correctAnswers++;

      const category = answer.question.category;
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      categoryScores[category].total++;
      if (isCorrect) categoryScores[category].correct++;
    });

    const totalScore = (correctAnswers / answers.length) * 100;

    return {
      totalScore,
      correctAnswers,
      totalQuestions: answers.length,
      categoryBreakdown: categoryScores,
      interpretation: generateTechnicalInterpretation(totalScore)
    };
  },

  culture: (answers: any[]) => {
    let alignmentScore = 0;
    answers.forEach(answer => {
      if (answer.selectedValue === answer.question.correctAnswer) {
        alignmentScore += 10;
      }
    });

    const percentage = (alignmentScore / (answers.length * 10)) * 100;
    return {
      alignmentScore: percentage,
      interpretation: generateCultureInterpretation(percentage)
    };
  }
};

// Interpretation functions
function generatePersonalityInterpretation(scores: any) {
  const interpretations: string[] = [];
  
  Object.entries(scores).forEach(([trait, score]: [string, any]) => {
    const normalizedScore = score / 5; // Assuming max 5 points per question
    if (normalizedScore >= 4) {
      interpretations.push(`High ${trait}: Shows strong ${trait} characteristics`);
    } else if (normalizedScore <= 2) {
      interpretations.push(`Low ${trait}: Shows moderate ${trait} characteristics`);
    }
  });

  return interpretations.join('. ');
}

function generateCognitiveInterpretation(score: number) {
  if (score >= 80) return "Excellent cognitive abilities with strong problem-solving skills";
  if (score >= 60) return "Good cognitive abilities with solid analytical thinking";
  if (score >= 40) return "Average cognitive abilities with room for development";
  return "Below average cognitive abilities, may benefit from additional training";
}

function generateCommunicationInterpretation(score: number) {
  if (score >= 80) return "Excellent communication skills, able to handle complex interpersonal situations";
  if (score >= 60) return "Good communication skills with effective professional interaction";
  if (score >= 40) return "Average communication skills, some areas for improvement";
  return "Communication skills need development, recommend training programs";
}

function generateTechnicalInterpretation(score: number) {
  if (score >= 80) return "Strong technical aptitude with excellent problem-solving capabilities";
  if (score >= 60) return "Good technical understanding with solid foundational knowledge";
  if (score >= 40) return "Basic technical knowledge, suitable for entry-level positions";
  return "Limited technical knowledge, significant training required";
}

function generateCultureInterpretation(score: number) {
  if (score >= 80) return "Excellent cultural fit, values strongly align with company culture";
  if (score >= 60) return "Good cultural fit, shows understanding of company values";
  if (score >= 40) return "Moderate cultural fit, some alignment with company values";
  return "Limited cultural alignment, may need additional orientation";
}