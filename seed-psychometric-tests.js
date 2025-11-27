import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearExistingTests() {
  console.log('Clearing existing psychometric test data...');
  
  try {
    await pool.query('DELETE FROM psychometric_questions');
    await pool.query('DELETE FROM psychometric_tests');
    await pool.query('DELETE FROM psychometric_test_attempts');
    console.log('✓ Cleared existing test data');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

async function seedPsychometricTests() {
  console.log('Seeding comprehensive psychometric tests...');

  const tests = [
    {
      testName: 'Personality Assessment',
      testType: 'personality',
      description: 'Assess personality traits using the Big Five model to understand work preferences and team dynamics',
      instructions: 'Answer honestly based on how you typically behave in work situations. There are no right or wrong answers.',
      timeLimit: 25,
      questions: [
        {
          questionText: 'I am someone who is talkative and outgoing in group settings',
          questionType: 'scale',
          category: 'extraversion',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer to work independently rather than in teams',
          questionType: 'scale',
          category: 'extraversion',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am detail-oriented and thorough in my work',
          questionType: 'scale',
          category: 'conscientiousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I often try new approaches to solve problems',
          questionType: 'scale',
          category: 'openness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I remain calm under pressure and stress',
          questionType: 'scale',
          category: 'neuroticism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am considerate and cooperative with colleagues',
          questionType: 'scale',
          category: 'agreeableness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I enjoy being the center of attention in social situations',
          questionType: 'scale',
          category: 'extraversion',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I often take charge in group projects',
          questionType: 'scale',
          category: 'extraversion',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I feel energized after spending time with many people',
          questionType: 'scale',
          category: 'extraversion',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I always complete tasks well before deadlines',
          questionType: 'scale',
          category: 'conscientiousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I find it easy to stick to my goals and plans',
          questionType: 'scale',
          category: 'conscientiousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am organized and keep my workspace tidy',
          questionType: 'scale',
          category: 'conscientiousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I enjoy learning about different cultures and perspectives',
          questionType: 'scale',
          category: 'openness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am interested in abstract concepts and theories',
          questionType: 'scale',
          category: 'openness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I actively seek out creative solutions to problems',
          questionType: 'scale',
          category: 'openness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I worry frequently about things that might go wrong',
          questionType: 'scale',
          category: 'neuroticism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I bounce back quickly from setbacks',
          questionType: 'scale',
          category: 'neuroticism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I often feel overwhelmed by emotions',
          questionType: 'scale',
          category: 'neuroticism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I trust others and believe people have good intentions',
          questionType: 'scale',
          category: 'agreeableness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am willing to compromise to avoid conflict',
          questionType: 'scale',
          category: 'agreeableness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        }
      ]
    },
    {
      testName: 'Cognitive Abilities Assessment',
      testType: 'cognitive',
      description: 'Evaluate problem-solving, logical reasoning, and analytical thinking skills',
      instructions: 'Select the best answer for each question. You have 30 minutes to complete this assessment.',
      timeLimit: 30,
      questions: [
        {
          questionText: 'If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles.',
          questionType: 'multiple_choice',
          category: 'logical_reasoning',
          correctAnswer: 'true',
          options: [
            { text: 'True', value: 'true' },
            { text: 'False', value: 'false' },
            { text: 'Cannot be determined', value: 'unknown' }
          ]
        },
        {
          questionText: 'What number should come next in this sequence: 2, 6, 18, 54, ?',
          questionType: 'multiple_choice',
          category: 'pattern_recognition',
          correctAnswer: '162',
          options: [
            { text: '108', value: '108' },
            { text: '162', value: '162' },
            { text: '216', value: '216' },
            { text: '324', value: '324' }
          ]
        },
        {
          questionText: 'A team of 5 people can complete a project in 12 days. How many days would it take for 3 people to complete the same project?',
          questionType: 'multiple_choice',
          category: 'numerical_reasoning',
          correctAnswer: '20',
          options: [
            { text: '15 days', value: '15' },
            { text: '18 days', value: '18' },
            { text: '20 days', value: '20' },
            { text: '24 days', value: '24' }
          ]
        },
        {
          questionText: 'All cats are mammals. Some mammals are dogs. Therefore, some cats are dogs.',
          questionType: 'multiple_choice',
          category: 'logical_reasoning',
          correctAnswer: 'false',
          options: [
            { text: 'True', value: 'true' },
            { text: 'False', value: 'false' },
            { text: 'Cannot be determined', value: 'unknown' }
          ]
        },
        {
          questionText: 'In a certain code, FLOWER is written as REWOLF. How is GARDEN written in that code?',
          questionType: 'multiple_choice',
          category: 'logical_reasoning',
          correctAnswer: 'NEDRAG',
          options: [
            { text: 'NEDRAG', value: 'NEDRAG' },
            { text: 'GRADNE', value: 'GRADNE' },
            { text: 'DENGRA', value: 'DENGRA' },
            { text: 'RAGDEN', value: 'RAGDEN' }
          ]
        },
        {
          questionText: 'What comes next in this sequence: A, C, F, J, O, ?',
          questionType: 'multiple_choice',
          category: 'pattern_recognition',
          correctAnswer: 'U',
          options: [
            { text: 'S', value: 'S' },
            { text: 'T', value: 'T' },
            { text: 'U', value: 'U' },
            { text: 'V', value: 'V' }
          ]
        },
        {
          questionText: 'Complete the pattern: 1, 4, 9, 16, 25, ?',
          questionType: 'multiple_choice',
          category: 'pattern_recognition',
          correctAnswer: '36',
          options: [
            { text: '30', value: '30' },
            { text: '35', value: '35' },
            { text: '36', value: '36' },
            { text: '49', value: '49' }
          ]
        },
        {
          questionText: 'If 20% of a number is 45, what is 75% of the same number?',
          questionType: 'multiple_choice',
          category: 'numerical_reasoning',
          correctAnswer: '168.75',
          options: [
            { text: '168.75', value: '168.75' },
            { text: '150.00', value: '150.00' },
            { text: '180.00', value: '180.00' },
            { text: '135.00', value: '135.00' }
          ]
        },
        {
          questionText: 'A store offers a 25% discount on all items. If an item originally costs $80, what is the final price after discount?',
          questionType: 'multiple_choice',
          category: 'numerical_reasoning',
          correctAnswer: '60',
          options: [
            { text: '$55', value: '55' },
            { text: '$60', value: '60' },
            { text: '$65', value: '65' },
            { text: '$70', value: '70' }
          ]
        },
        {
          questionText: 'How many cubes are there in a 3x3x3 cube structure?',
          questionType: 'multiple_choice',
          category: 'spatial_reasoning',
          correctAnswer: '27',
          options: [
            { text: '18', value: '18' },
            { text: '24', value: '24' },
            { text: '27', value: '27' },
            { text: '30', value: '30' }
          ]
        },
        {
          questionText: 'If you fold a piece of paper in half twice and then make one cut, how many holes will there be when you unfold it?',
          questionType: 'multiple_choice',
          category: 'spatial_reasoning',
          correctAnswer: '4',
          options: [
            { text: '2', value: '2' },
            { text: '4', value: '4' },
            { text: '6', value: '6' },
            { text: '8', value: '8' }
          ]
        }
      ]
    },
    {
      testName: 'Communication Skills Assessment',
      testType: 'communication',
      description: 'Evaluate written and verbal communication abilities in professional contexts',
      instructions: 'Choose the most appropriate response for each workplace communication scenario.',
      timeLimit: 20,
      questions: [
        {
          questionText: 'A client emails expressing frustration about a delayed project. What is the best initial response?',
          questionType: 'multiple_choice',
          category: 'client_communication',
          correctAnswer: 'acknowledge',
          options: [
            { text: 'Explain all the technical reasons for the delay', value: 'technical' },
            { text: 'Acknowledge their concern, apologize, and provide a clear timeline for resolution', value: 'acknowledge' },
            { text: 'Forward the email to your manager', value: 'forward' },
            { text: 'Respond that delays are normal in projects', value: 'normal' }
          ]
        },
        {
          questionText: 'During a team meeting, two colleagues disagree strongly about an approach. How should you contribute?',
          questionType: 'multiple_choice',
          category: 'team_communication',
          correctAnswer: 'mediate',
          options: [
            { text: 'Stay silent to avoid conflict', value: 'silent' },
            { text: 'Support the person with more authority', value: 'authority' },
            { text: 'Ask clarifying questions and help find common ground', value: 'mediate' },
            { text: 'Suggest postponing the decision', value: 'postpone' }
          ]
        },
        {
          questionText: 'A client requests a significant change to a project that\'s 80% complete. What\'s your first step?',
          questionType: 'multiple_choice',
          category: 'client_communication',
          correctAnswer: 'assess',
          options: [
            { text: 'Immediately agree to make the change', value: 'agree' },
            { text: 'Explain why the change cannot be made', value: 'refuse' },
            { text: 'Assess the impact and present options with timelines and costs', value: 'assess' },
            { text: 'Suggest they wait for the next project phase', value: 'wait' }
          ]
        },
        {
          questionText: 'When presenting a complex technical solution to non-technical stakeholders, you should:',
          questionType: 'multiple_choice',
          category: 'client_communication',
          correctAnswer: 'benefits',
          options: [
            { text: 'Use detailed technical terminology to show expertise', value: 'technical' },
            { text: 'Focus on benefits and outcomes using simple language', value: 'benefits' },
            { text: 'Provide only high-level summaries', value: 'summary' },
            { text: 'Let someone else handle the presentation', value: 'delegate' }
          ]
        },
        {
          questionText: 'You notice a team member struggling with their workload but haven\'t asked for help. You should:',
          questionType: 'multiple_choice',
          category: 'team_communication',
          correctAnswer: 'offer',
          options: [
            { text: 'Wait for them to ask for help', value: 'wait' },
            { text: 'Report the issue to management immediately', value: 'report' },
            { text: 'Privately offer assistance and discuss workload concerns', value: 'offer' },
            { text: 'Take over some of their tasks without asking', value: 'takeover' }
          ]
        },
        {
          questionText: 'When giving feedback to a colleague about their work, the most effective approach is to:',
          questionType: 'multiple_choice',
          category: 'team_communication',
          correctAnswer: 'specific',
          options: [
            { text: 'Focus only on what needs improvement', value: 'negative' },
            { text: 'Give feedback in front of the whole team', value: 'public' },
            { text: 'Provide specific, constructive comments with examples', value: 'specific' },
            { text: 'Keep feedback general to avoid hurt feelings', value: 'general' }
          ]
        },
        {
          questionText: 'When writing an important business email, you should always:',
          questionType: 'multiple_choice',
          category: 'written_communication',
          correctAnswer: 'organized',
          options: [
            { text: 'Keep it as brief as possible', value: 'brief' },
            { text: 'Use formal language regardless of the relationship', value: 'formal' },
            { text: 'Include a clear subject line and organize information logically', value: 'organized' },
            { text: 'Copy everyone who might be interested', value: 'copy_all' }
          ]
        },
        {
          questionText: 'If you need to deliver bad news in writing, the best approach is to:',
          questionType: 'multiple_choice',
          category: 'written_communication',
          correctAnswer: 'context',
          options: [
            { text: 'Start with the bad news directly', value: 'direct' },
            { text: 'Bury the bad news in the middle of positive information', value: 'bury' },
            { text: 'Provide context, deliver the news clearly, then offer solutions', value: 'context' },
            { text: 'Use euphemisms to soften the impact', value: 'euphemisms' }
          ]
        },
        {
          questionText: 'During a presentation, you realize you made an error in your data. You should:',
          questionType: 'multiple_choice',
          category: 'presentation_skills',
          correctAnswer: 'acknowledge',
          options: [
            { text: 'Continue and hope no one notices', value: 'ignore' },
            { text: 'Stop immediately and correct the error', value: 'stop' },
            { text: 'Acknowledge the error and provide the correction', value: 'acknowledge' },
            { text: 'End the presentation early', value: 'end' }
          ]
        }
      ]
    },
    {
      testName: 'Technical Skills Assessment',
      testType: 'technical',
      description: 'Assess general technical aptitude and problem-solving abilities',
      instructions: 'Answer questions related to general technical concepts and problem-solving approaches.',
      timeLimit: 35,
      questions: [
        {
          questionText: 'What is the primary purpose of version control systems like Git?',
          questionType: 'multiple_choice',
          category: 'software_development',
          correctAnswer: 'version_control',
          options: [
            { text: 'To backup files automatically', value: 'backup' },
            { text: 'To track changes and collaborate on code', value: 'version_control' },
            { text: 'To compile source code', value: 'compile' },
            { text: 'To test applications', value: 'testing' }
          ]
        },
        {
          questionText: 'In project management, what does \'scope creep\' refer to?',
          questionType: 'multiple_choice',
          category: 'project_management',
          correctAnswer: 'expansion',
          options: [
            { text: 'Gradual expansion of project requirements beyond the original plan', value: 'expansion' },
            { text: 'Team members working too slowly', value: 'slow_work' },
            { text: 'Budget overruns', value: 'budget' },
            { text: 'Missing project deadlines', value: 'deadlines' }
          ]
        },
        {
          questionText: 'What is the main benefit of using automated testing in software development?',
          questionType: 'multiple_choice',
          category: 'software_development',
          correctAnswer: 'quality',
          options: [
            { text: 'It eliminates the need for manual testing entirely', value: 'eliminate_manual' },
            { text: 'It ensures code quality and catches bugs early', value: 'quality' },
            { text: 'It makes development faster in all cases', value: 'faster' },
            { text: 'It reduces the need for documentation', value: 'less_docs' }
          ]
        },
        {
          questionText: 'In database design, what is normalization primarily used for?',
          questionType: 'multiple_choice',
          category: 'software_development',
          correctAnswer: 'integrity',
          options: [
            { text: 'Making databases run faster', value: 'speed' },
            { text: 'Reducing data redundancy and ensuring data integrity', value: 'integrity' },
            { text: 'Adding more tables to the database', value: 'more_tables' },
            { text: 'Encrypting sensitive data', value: 'encryption' }
          ]
        },
        {
          questionText: 'What is the primary purpose of a project charter?',
          questionType: 'multiple_choice',
          category: 'project_management',
          correctAnswer: 'define_scope',
          options: [
            { text: 'To track daily progress', value: 'daily_progress' },
            { text: 'To define project scope, objectives, and stakeholders', value: 'define_scope' },
            { text: 'To assign individual tasks', value: 'assign_tasks' },
            { text: 'To calculate project costs', value: 'calculate_costs' }
          ]
        },
        {
          questionText: 'In Agile methodology, what is the purpose of a sprint retrospective?',
          questionType: 'multiple_choice',
          category: 'project_management',
          correctAnswer: 'reflect',
          options: [
            { text: 'To plan the next sprint\'s tasks', value: 'plan_sprint' },
            { text: 'To demonstrate completed work to stakeholders', value: 'demo_work' },
            { text: 'To reflect on the sprint and identify improvements', value: 'reflect' },
            { text: 'To assign blame for missed deadlines', value: 'assign_blame' }
          ]
        },
        {
          questionText: 'When faced with a complex technical problem, the most effective first step is to:',
          questionType: 'multiple_choice',
          category: 'problem_solving',
          correctAnswer: 'break_down',
          options: [
            { text: 'Start implementing the first solution that comes to mind', value: 'first_solution' },
            { text: 'Ask someone else to solve it', value: 'ask_others' },
            { text: 'Break down the problem into smaller, manageable components', value: 'break_down' },
            { text: 'Search online for similar problems', value: 'search_online' }
          ]
        },
        {
          questionText: 'What is the most important factor when choosing between multiple technical solutions?',
          questionType: 'multiple_choice',
          category: 'problem_solving',
          correctAnswer: 'meets_requirements',
          options: [
            { text: 'The solution that takes the least time to implement', value: 'least_time' },
            { text: 'The solution that uses the newest technology', value: 'newest_tech' },
            { text: 'The solution that best meets requirements within constraints', value: 'meets_requirements' },
            { text: 'The solution that is most impressive', value: 'most_impressive' }
          ]
        },
        {
          questionText: 'When analyzing data to make business decisions, what should you consider first?',
          questionType: 'multiple_choice',
          category: 'data_analysis',
          correctAnswer: 'data_quality',
          options: [
            { text: 'The most complex analysis methods available', value: 'complex_methods' },
            { text: 'The quality and relevance of the data', value: 'data_quality' },
            { text: 'The tools used by competitors', value: 'competitor_tools' },
            { text: 'The speed of analysis', value: 'analysis_speed' }
          ]
        },
        {
          questionText: 'What does a correlation coefficient of 0.95 between two variables indicate?',
          questionType: 'multiple_choice',
          category: 'data_analysis',
          correctAnswer: 'strong_positive',
          options: [
            { text: 'One variable causes the other', value: 'causation' },
            { text: 'The variables have a strong positive relationship', value: 'strong_positive' },
            { text: '95% of the data is accurate', value: 'accuracy' },
            { text: 'The analysis is 95% complete', value: 'complete' }
          ]
        }
      ]
    },
    {
      testName: 'Values and Culture Fit Assessment',
      testType: 'culture',
      description: 'Evaluate alignment with company values and cultural expectations',
      instructions: 'Select responses that best reflect your work values and preferences.',
      timeLimit: 15,
      questions: [
        {
          questionText: 'What motivates you most in your work?',
          questionType: 'multiple_choice',
          category: 'motivation',
          correctAnswer: 'learning',
          options: [
            { text: 'Recognition and advancement opportunities', value: 'recognition' },
            { text: 'Learning new skills and taking on challenges', value: 'learning' },
            { text: 'Stable routine and predictable tasks', value: 'stability' },
            { text: 'High compensation and benefits', value: 'compensation' }
          ]
        },
        {
          questionText: 'How do you prefer to receive feedback on your work?',
          questionType: 'multiple_choice',
          category: 'feedback_preference',
          correctAnswer: 'continuous',
          options: [
            { text: 'Regular formal reviews', value: 'formal' },
            { text: 'Continuous informal feedback', value: 'continuous' },
            { text: 'Only when there are problems', value: 'problems' },
            { text: 'Through written reports', value: 'written' }
          ]
        },
        {
          questionText: 'When working on a long-term project, what keeps you most engaged?',
          questionType: 'multiple_choice',
          category: 'motivation',
          correctAnswer: 'milestones',
          options: [
            { text: 'Regular milestones and progress celebrations', value: 'milestones' },
            { text: 'Constant supervision and guidance', value: 'supervision' },
            { text: 'Working alone without interruption', value: 'alone' },
            { text: 'Competing with colleagues', value: 'competition' }
          ]
        },
        {
          questionText: 'What type of work environment do you find most productive?',
          questionType: 'multiple_choice',
          category: 'work_environment',
          correctAnswer: 'collaborative',
          options: [
            { text: 'Quiet spaces with minimal distractions', value: 'quiet' },
            { text: 'Collaborative open offices with team interaction', value: 'collaborative' },
            { text: 'Flexible spaces that can be adapted as needed', value: 'flexible' },
            { text: 'Traditional private offices', value: 'private' }
          ]
        },
        {
          questionText: 'When starting a new project, your preferred approach is to:',
          questionType: 'multiple_choice',
          category: 'work_style',
          correctAnswer: 'plan_first',
          options: [
            { text: 'Jump in and start working immediately', value: 'jump_in' },
            { text: 'Plan thoroughly before beginning any work', value: 'plan_first' },
            { text: 'Wait for detailed instructions from others', value: 'wait_instructions' },
            { text: 'Work on the easiest parts first', value: 'easy_first' }
          ]
        },
        {
          questionText: 'How do you typically handle tight deadlines?',
          questionType: 'multiple_choice',
          category: 'work_style',
          correctAnswer: 'prioritize',
          options: [
            { text: 'Work longer hours to meet the deadline', value: 'longer_hours' },
            { text: 'Prioritize tasks and focus on the most critical deliverables', value: 'prioritize' },
            { text: 'Ask for deadline extensions', value: 'extensions' },
            { text: 'Delegate work to others', value: 'delegate' }
          ]
        },
        {
          questionText: 'When you encounter a process that seems inefficient, you typically:',
          questionType: 'multiple_choice',
          category: 'innovation',
          correctAnswer: 'propose_improvements',
          options: [
            { text: 'Follow the existing process to avoid problems', value: 'follow_existing' },
            { text: 'Propose improvements and alternative approaches', value: 'propose_improvements' },
            { text: 'Complain about the inefficiency', value: 'complain' },
            { text: 'Work around it without telling anyone', value: 'work_around' }
          ]
        },
        {
          questionText: 'Your attitude toward change in the workplace is:',
          questionType: 'multiple_choice',
          category: 'change_adaptation',
          correctAnswer: 'adaptive',
          options: [
            { text: 'Resistant - prefer stability and routine', value: 'resistant' },
            { text: 'Cautious - need time to adjust', value: 'cautious' },
            { text: 'Adaptive - embrace change as opportunity', value: 'adaptive' },
            { text: 'Indifferent - change doesn\'t affect me', value: 'indifferent' }
          ]
        },
        {
          questionText: 'When leading a team project, your primary focus is on:',
          questionType: 'multiple_choice',
          category: 'leadership_style',
          correctAnswer: 'empowering',
          options: [
            { text: 'Ensuring everyone follows established procedures', value: 'procedures' },
            { text: 'Empowering team members and facilitating collaboration', value: 'empowering' },
            { text: 'Making all decisions yourself', value: 'all_decisions' },
            { text: 'Delegating everything to team members', value: 'delegate_all' }
          ]
        },
        {
          questionText: 'How do you handle conflicts within your team?',
          questionType: 'multiple_choice',
          category: 'conflict_resolution',
          correctAnswer: 'facilitate',
          options: [
            { text: 'Avoid getting involved and let them resolve it', value: 'avoid' },
            { text: 'Make a decision and enforce it', value: 'enforce' },
            { text: 'Facilitate discussion to find mutually acceptable solutions', value: 'facilitate' },
            { text: 'Report the conflict to higher management', value: 'report' }
          ]
        }
      ]
    },
    {
      testName: '16 Personality Factors Questionnaire (16PF)',
      testType: 'personality_advanced',
      description: 'Comprehensive personality assessment measuring 16 primary personality factors to provide detailed insights into behavioral tendencies and work style preferences.',
      instructions: 'Rate each statement based on how well it describes you. Consider your typical behavior in work and personal situations. There are no right or wrong answers - be honest for the most accurate results.',
      timeLimit: 35,
      questions: [
        // Factor A: Warmth (Reserved vs Warm)
        {
          questionText: 'I enjoy meeting new people and making friends easily',
          questionType: 'scale',
          category: 'warmth',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer to keep my personal feelings to myself',
          questionType: 'scale',
          category: 'warmth',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor B: Reasoning (Concrete vs Abstract)
        {
          questionText: 'I enjoy solving complex problems that require logical thinking',
          questionType: 'scale',
          category: 'reasoning',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer practical, concrete tasks over theoretical discussions',
          questionType: 'scale',
          category: 'reasoning',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor C: Emotional Stability (Reactive vs Emotionally Stable)
        {
          questionText: 'I remain calm and composed under pressure',
          questionType: 'scale',
          category: 'emotional_stability',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I worry about things going wrong',
          questionType: 'scale',
          category: 'emotional_stability',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor E: Dominance (Deferential vs Dominant)
        {
          questionText: 'I like to take charge and lead others',
          questionType: 'scale',
          category: 'dominance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer to let others make important decisions',
          questionType: 'scale',
          category: 'dominance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor F: Liveliness (Serious vs Lively)
        {
          questionText: 'I am enthusiastic and full of energy',
          questionType: 'scale',
          category: 'liveliness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer serious conversations over light-hearted chat',
          questionType: 'scale',
          category: 'liveliness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor G: Rule-Consciousness (Expedient vs Rule-Conscious)
        {
          questionText: 'I always follow rules and regulations carefully',
          questionType: 'scale',
          category: 'rule_consciousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I sometimes bend rules if I think it serves a good purpose',
          questionType: 'scale',
          category: 'rule_consciousness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor H: Social Boldness (Shy vs Socially Bold)
        {
          questionText: 'I feel comfortable speaking in front of large groups',
          questionType: 'scale',
          category: 'social_boldness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I feel nervous when meeting new people',
          questionType: 'scale',
          category: 'social_boldness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor I: Sensitivity (Utilitarian vs Sensitive)
        {
          questionText: 'I make decisions based on logic rather than emotions',
          questionType: 'scale',
          category: 'sensitivity',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am sensitive to others\' feelings and emotions',
          questionType: 'scale',
          category: 'sensitivity',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor L: Vigilance (Trusting vs Vigilant)
        {
          questionText: 'I generally trust people until proven otherwise',
          questionType: 'scale',
          category: 'vigilance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I am cautious about others\' motives',
          questionType: 'scale',
          category: 'vigilance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor M: Abstractedness (Grounded vs Abstracted)
        {
          questionText: 'I often get lost in my own thoughts and ideas',
          questionType: 'scale',
          category: 'abstractedness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I focus on practical, real-world matters',
          questionType: 'scale',
          category: 'abstractedness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor N: Privateness (Forthright vs Private)
        {
          questionText: 'I am open and straightforward about my thoughts',
          questionType: 'scale',
          category: 'privateness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I keep my personal thoughts and feelings private',
          questionType: 'scale',
          category: 'privateness',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor O: Apprehension (Self-Assured vs Apprehensive)
        {
          questionText: 'I am confident in my abilities and decisions',
          questionType: 'scale',
          category: 'apprehension',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I often doubt myself and worry about my performance',
          questionType: 'scale',
          category: 'apprehension',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor Q1: Openness to Change (Traditional vs Open to Change)
        {
          questionText: 'I enjoy trying new ways of doing things',
          questionType: 'scale',
          category: 'openness_to_change',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I prefer traditional methods over new approaches',
          questionType: 'scale',
          category: 'openness_to_change',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor Q2: Self-Reliance (Group-Oriented vs Self-Reliant)
        {
          questionText: 'I prefer to work independently rather than in teams',
          questionType: 'scale',
          category: 'self_reliance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I enjoy being part of a team and group activities',
          questionType: 'scale',
          category: 'self_reliance',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor Q3: Perfectionism (Tolerates Disorder vs Perfectionist)
        {
          questionText: 'I have high standards and pay attention to details',
          questionType: 'scale',
          category: 'perfectionism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I don\'t mind if things are a bit disorganized',
          questionType: 'scale',
          category: 'perfectionism',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        // Factor Q4: Tension (Relaxed vs Tense)
        {
          questionText: 'I am generally relaxed and easygoing',
          questionType: 'scale',
          category: 'tension',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        },
        {
          questionText: 'I often feel restless and impatient',
          questionType: 'scale',
          category: 'tension',
          options: [
            { text: 'Strongly Disagree', value: 1 },
            { text: 'Disagree', value: 2 },
            { text: 'Neutral', value: 3 },
            { text: 'Agree', value: 4 },
            { text: 'Strongly Agree', value: 5 }
          ]
        }
      ]
    },

    // Original 16PF - Complete 185-Question Assessment
    {
      testName: "16PF Complete Assessment (185 Questions)",
      testType: "personality_comprehensive",
      description: "The original comprehensive 16PF assessment with 185 questions measuring 16 primary personality factors organized into 5 Global Factors: Extraversion, Anxiety, Tough-mindedness, Independence, and Self-Control. This scientifically validated instrument provides detailed insights into personality structure and behavioral predictions.",
      instructions: "This comprehensive assessment contains 185 statements organized by personality factors. Rate each statement based on how well it describes you in most situations over the past few months. Choose the response that best fits your typical behavior. There are no right or wrong answers - honesty is essential for accurate results. Allow 45-60 minutes to complete.",
      timeLimit: 60,
      questions: [
        // GLOBAL FACTOR 1: EXTRAVERSION (Factors F+, H+, N-, Q2-)
        
        // Factor A: Warmth (Reserved vs. Warm) - 12 questions
        {
          questionText: "I am known as warm and friendly.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy being around people.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I show genuine interest in other people.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am generous with my time for others.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am caring and considerate.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am affectionate with people I like.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I tend to be reserved with people I don't know well.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I keep people at a distance.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I prefer to maintain formal relationships.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I am comfortable with physical expressions of friendship.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy helping others with their problems.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find it easy to be supportive of others.",
          questionType: "scale",
          category: "Warmth",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor B: Reasoning (Lower vs. Higher) - 12 questions
        {
          questionText: "I enjoy solving complex problems.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I can see patterns in complex information.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I learn new concepts quickly.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am good at analyzing information.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I can understand abstract concepts easily.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy intellectual challenges.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am curious about how things work.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I can handle multiple complex tasks simultaneously.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find it easy to concentrate on difficult material.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy mathematical or logical puzzles.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I think logically about problems.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am skilled at finding solutions to complex issues.",
          questionType: "scale",
          category: "Reasoning",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor C: Emotional Stability (Reactive vs. Emotionally Stable) - 12 questions
        {
          questionText: "I stay calm under pressure.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I handle stress well.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I rarely get upset about things.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am emotionally stable.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I get overwhelmed by problems easily.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "My mood changes frequently.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I am easily frustrated.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I react strongly to criticism.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 3 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 1 }
          ]
        },
        {
          questionText: "I recover quickly from setbacks.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am resilient in difficult situations.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I maintain composure in challenging circumstances.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am even-tempered.",
          questionType: "scale",
          category: "Emotional Stability",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor E: Dominance (Deferential vs. Dominant) - 12 questions
        {
          questionText: "I like to take charge of situations.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am comfortable making decisions for others.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I naturally assume leadership roles.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am assertive in pursuing my goals.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am competitive by nature.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to be in control.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am forceful in my opinions.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy positions of authority.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to lead rather than follow.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am confident in my decision-making abilities.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I influence others easily.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am decisive in my actions.",
          questionType: "scale",
          category: "Dominance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor F: Liveliness (Serious vs. Lively) - 12 questions
        {
          questionText: "I am usually cheerful.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I like to be where there's some action.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I laugh easily.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am naturally enthusiastic.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer work that is lively and fast-moving.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I like to have lots of things going on around me.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find it easy to be enthusiastic.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am usually full of energy.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy parties and social events.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I tend to be spontaneous.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I like excitement.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel comfortable being the center of attention.",
          questionType: "scale",
          category: "Liveliness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor G: Rule-Consciousness (Expedient vs. Rule-Conscious) - 12 questions
        {
          questionText: "I always follow rules and regulations.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I believe in doing the right thing even when it's difficult.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I have strong moral principles.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am conscientious about my duties.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel obligated to meet my responsibilities.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am reliable and dependable.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I maintain high ethical standards.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I honor my commitments.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I believe in following established procedures.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am disciplined in my approach to work.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I respect authority and hierarchy.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am careful to follow instructions precisely.",
          questionType: "scale",
          category: "Rule-Consciousness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor H: Social Boldness (Shy vs. Socially Bold) - 12 questions
        {
          questionText: "I find it easy to talk to strangers.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I speak up in meetings without hesitation.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am comfortable being in the spotlight.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am at ease in social situations.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I don't mind taking social risks.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am confident when meeting new people.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel comfortable performing in front of others.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I readily approach people I don't know well.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am bold in social situations.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I take the initiative in social interactions.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am adventurous in social situations.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy being noticed by others.",
          questionType: "scale",
          category: "Social Boldness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor I: Sensitivity (Utilitarian vs. Sensitive) - 12 questions
        {
          questionText: "I am moved by art, music, and beauty.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am sensitive to others' feelings.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am easily affected by emotional situations.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I appreciate refined and delicate things.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am intuitive about people's needs.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer gentle approaches to problems.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am compassionate and tender-minded.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I value harmony over efficiency.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am empathetic to others' pain.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find beauty in everyday things.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am affected by others' moods.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer collaborative rather than competitive approaches.",
          questionType: "scale",
          category: "Sensitivity",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor L: Vigilance (Trusting vs. Vigilant) - 12 questions  
        {
          questionText: "I am suspicious of others' motives.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I question what people tell me.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am cautious about trusting others.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I look for hidden meanings in what people say.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am wary of people's true intentions.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I tend to be skeptical.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am alert to potential problems with others.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I believe people often have selfish motives.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am careful about what information I share.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I watch for signs of deception in others.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am doubtful about people's promises.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to verify information independently.",
          questionType: "scale",
          category: "Vigilance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor M: Abstractedness (Grounded vs. Abstracted) - 12 questions
        {
          questionText: "I enjoy theoretical discussions.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am interested in complex ideas.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I like to think about possibilities rather than realities.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am more interested in concepts than applications.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I often get lost in my thoughts.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to work with ideas rather than things.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy philosophical conversations.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am imaginative in my approach to problems.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I think in abstract terms.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am drawn to intellectual pursuits.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer thinking to doing.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am comfortable with ambiguity.",
          questionType: "scale",
          category: "Abstractedness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor N: Privateness (Forthright vs. Private) - 12 questions
        {
          questionText: "I keep my thoughts and feelings to myself.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am careful about what I reveal about myself.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to keep my personal life separate from work.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am selective about whom I confide in.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am reserved about sharing personal experiences.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I maintain boundaries between my inner and outer life.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am diplomatic in expressing my opinions.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I avoid discussing sensitive topics.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am cautious about expressing my true feelings.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to observe rather than participate in group discussions.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am strategic about what I share with others.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I value my privacy highly.",
          questionType: "scale",
          category: "Privateness",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor O: Apprehension (Self-Assured vs. Apprehensive) - 12 questions
        {
          questionText: "I often worry about my performance.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel guilty about things I've done.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I worry about what others think of me.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I often feel insecure.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I tend to blame myself when things go wrong.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I often doubt my abilities.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel troubled by my mistakes.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I worry about failing.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am often self-critical.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I anticipate problems before they occur.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel anxious about future events.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I worry about disappointing others.",
          questionType: "scale",
          category: "Apprehension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor Q1: Openness to Change (Traditional vs. Open to Change) - 12 questions
        {
          questionText: "I embrace new ideas readily.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy trying new approaches.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am interested in innovative solutions.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I question traditional ways of doing things.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am open to changing my mind.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I welcome new challenges.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am excited by change.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I like to experiment with new methods.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am progressive in my thinking.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I adapt quickly to new situations.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am curious about alternative ways of doing things.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I enjoy intellectual debates about new ideas.",
          questionType: "scale",
          category: "Openness to Change",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor Q2: Self-Reliance (Group-Oriented vs. Self-Reliant) - 12 questions
        {
          questionText: "I prefer to work independently.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I make decisions without consulting others.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to solve problems on my own.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am comfortable working without supervision.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I rely on my own judgment rather than others' opinions.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am self-sufficient in most situations.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer individual projects to group work.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am resourceful in finding my own solutions.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I trust my own instincts over group consensus.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am independent in my thinking.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I prefer to set my own goals rather than follow others'.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am comfortable with solitary activities.",
          questionType: "scale",
          category: "Self-Reliance",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor Q3: Perfectionism (Tolerates Disorder vs. Perfectionistic) - 12 questions
        {
          questionText: "I pay attention to details.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I have high standards for myself.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am organized in my approach to work.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I strive for excellence in everything I do.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am disciplined in my work habits.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I complete tasks thoroughly.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I plan my work carefully.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am systematic in my approach.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am precise in my work.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am methodical in my approach to tasks.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I maintain high quality standards.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am controlled and disciplined.",
          questionType: "scale",
          category: "Perfectionism",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },

        // Factor Q4: Tension (Relaxed vs. Tense) - 13 questions
        {
          questionText: "I feel restless most of the time.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel under pressure.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find it hard to sit still.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I often feel keyed up.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I have trouble sleeping due to worries.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel impatient much of the time.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am easily agitated.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel driven to stay busy.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I find it difficult to relax.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am often wound up or tense.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I feel urgent about getting things done.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I have difficulty unwinding after work.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        },
        {
          questionText: "I am driven by high energy most of the time.",
          questionType: "scale",
          category: "Tension",
          options: [
            { text: "Never or rarely true", value: 1 },
            { text: "Sometimes true", value: 2 },
            { text: "Often true", value: 3 }
          ]
        }
      ]
    }
  ];

  try {
    for (const testData of tests) {
      console.log(`Creating test: ${testData.testName}`);
      
      // Create the test
      const testResult = await pool.query(
        `INSERT INTO psychometric_tests (test_name, test_type, description, instructions, time_limit, total_questions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          testData.testName,
          testData.testType,
          testData.description,
          testData.instructions,
          testData.timeLimit,
          testData.questions.length,
          true
        ]
      );

      const testId = testResult.rows[0].id;
      console.log(`✓ Created test with ID: ${testId}`);

      // Create questions for this test
      for (let i = 0; i < testData.questions.length; i++) {
        const question = testData.questions[i];
        
        await pool.query(
          `INSERT INTO psychometric_questions (test_id, question_text, question_type, options, correct_answer, category, "order", created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            testId,
            question.questionText,
            question.questionType,
            JSON.stringify(question.options),
            question.correctAnswer || null,
            question.category,
            i + 1
          ]
        );
      }
      
      console.log(`✓ Created ${testData.questions.length} questions for ${testData.testName}`);
    }

    console.log('\n🎉 Successfully seeded all psychometric tests with comprehensive questions!');
    
    // Display summary
    const testCountResult = await pool.query('SELECT COUNT(*) as count FROM psychometric_tests');
    const questionCountResult = await pool.query('SELECT COUNT(*) as count FROM psychometric_questions');
    
    console.log(`\n📊 Summary:`);
    console.log(`   Tests created: ${testCountResult.rows[0].count}`);
    console.log(`   Questions created: ${questionCountResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding tests:', error);
  }
}

async function main() {
  try {
    await clearExistingTests();
    await seedPsychometricTests();
  } catch (error) {
    console.error('❌ Error in main function:', error);
  } finally {
    await pool.end();
  }
}

main();