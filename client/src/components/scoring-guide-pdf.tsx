import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Loader2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export function ScoringGuidePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateScoringGuidePDF = async () => {
    setIsGenerating(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Helper function to add page if needed
      const checkAddPage = (requiredSpace: number = 30) => {
        if (yPosition > pageHeight - requiredSpace) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      // Title page
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Psychometric Test Scoring Guide', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprehensive Evaluation & Scoring System', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 30;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Meeting Matters Business Management System', pageWidth / 2, yPosition, { align: 'center' });

      // Table of Contents
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', margin, yPosition);
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const tocItems = [
        '1. Overview of Scoring System',
        '2. Test Types and Scoring Methods',
        '3. Big Five Personality Assessment',
        '4. Cognitive Aptitude Assessment (with Sample Questions)',
        '5. Emotional Intelligence Assessment',
        '6. Integrity and Honesty Assessment (with Sample Questions)',
        '7. Score Interpretation Guidelines',
        '8. Detailed Scoring Examples',
        '9. Sample Results and Case Studies',
        '10. Hiring Recommendations Framework'
      ];
      
      tocItems.forEach((item, index) => {
        checkAddPage();
        pdf.text(item, margin + 10, yPosition);
        yPosition += 8;
      });

      // Chapter 1: Overview
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. Overview of Scoring System', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const overviewText = [
        'The psychometric testing system uses a comprehensive multi-dimensional approach to evaluate candidates across four key areas:',
        '',
        '• Personality traits and behavioral tendencies',
        '• Cognitive abilities and problem-solving skills', 
        '• Emotional intelligence and interpersonal skills',
        '• Integrity and ethical decision-making',
        '',
        'Each test is scientifically designed with validated scoring methodologies that provide quantitative assessments while maintaining fairness and accuracy in candidate evaluation.',
        '',
        'The system automatically calculates scores, generates detailed reports, and provides actionable hiring recommendations based on role requirements and organizational fit.'
      ];
      
      overviewText.forEach(line => {
        checkAddPage();
        if (line === '') {
          yPosition += 6;
        } else {
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          pdf.text(wrappedLines, margin, yPosition);
          yPosition += wrappedLines.length * 6;
        }
      });

      // Chapter 2: Test Types and Scoring Methods
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Test Types and Scoring Methods', margin, yPosition);
      
      yPosition += 20;
      
      // Scale-Based Tests
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scale-Based Tests (Personality & Emotional Intelligence)', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const scaleText = [
        '• Uses 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree)',
        '• Each response scores 1-5 points based on selected rating',
        '• Maximum possible score per question: 5 points',
        '• Reverse scoring applied to negatively worded items',
        '• Category averages calculated for trait analysis'
      ];
      
      scaleText.forEach(line => {
        checkAddPage();
        pdf.text(line, margin + 5, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Multiple Choice Tests
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Multiple Choice Tests (Cognitive Aptitude)', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const mcText = [
        '• Binary scoring: Correct answer = 5 points, Incorrect = 0 points',
        '• Predetermined correct answers stored in database',
        '• Measures accuracy rather than opinion or preference',
        '• Time limits enforce processing speed evaluation',
        '• Domain-specific scoring for different cognitive areas'
      ];
      
      mcText.forEach(line => {
        checkAddPage();
        pdf.text(line, margin + 5, yPosition);
        yPosition += 8;
      });

      // Chapter 3: Big Five Personality Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. Big Five Personality Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Time Limit: 25 minutes | Questions: 20 | Scale: 1-5 points each', margin, yPosition);
      
      yPosition += 15;
      
      const personalityTraits = [
        {
          name: 'Extraversion',
          description: 'Measures sociability, assertiveness, and energy levels. High scorers are outgoing and talkative, low scorers prefer solitude and reflection.'
        },
        {
          name: 'Agreeableness', 
          description: 'Evaluates cooperation, trust, and empathy. High scorers are compassionate and helpful, low scorers may be competitive or skeptical.'
        },
        {
          name: 'Conscientiousness',
          description: 'Assesses organization, discipline, and reliability. High scorers are methodical and responsible, low scorers may be spontaneous or careless.'
        },
        {
          name: 'Neuroticism',
          description: 'Measures emotional stability and stress response. High scorers experience anxiety and mood swings, low scorers remain calm under pressure.'
        },
        {
          name: 'Openness',
          description: 'Evaluates creativity, curiosity, and intellectual flexibility. High scorers embrace new experiences, low scorers prefer routine and tradition.'
        }
      ];
      
      personalityTraits.forEach(trait => {
        checkAddPage(25);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${trait.name}:`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(trait.description, maxWidth - 10);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 6 + 5;
      });

      // Chapter 4: Cognitive Aptitude Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. Cognitive Aptitude Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Time Limit: 20 minutes | Questions: 15 | Binary Scoring: 5 or 0 points', margin, yPosition);
      
      yPosition += 15;
      
      const cognitiveAreas = [
        {
          name: 'Logical Reasoning',
          description: 'Pattern recognition, deductive reasoning, and logical sequence completion. Tests ability to identify relationships and draw valid conclusions.'
        },
        {
          name: 'Numerical Skills',
          description: 'Mathematical problem-solving, data interpretation, and quantitative analysis. Evaluates comfort with numbers and statistical thinking.'
        },
        {
          name: 'Verbal Comprehension',
          description: 'Reading comprehension, vocabulary, and language reasoning. Measures ability to understand and analyze written information.'
        }
      ];
      
      cognitiveAreas.forEach(area => {
        checkAddPage(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${area.name}:`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(area.description, maxWidth - 10);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 6 + 5;
      });

      // Sample Cognitive Questions with Correct Answers
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sample Cognitive Questions with Correct Answers', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const sampleCognitiveQuestions = [
        {
          question: 'What comes next in the sequence: 2, 4, 8, 16, ?',
          options: ['16', '24', '32', '48'],
          correct: '32',
          explanation: 'Each number doubles: 2×2=4, 4×2=8, 8×2=16, 16×2=32',
          category: 'Logical Reasoning'
        },
        {
          question: 'Calculate: 15% of 240',
          options: ['30', '36', '42', '48'],
          correct: '36',
          explanation: '15% × 240 = 0.15 × 240 = 36',
          category: 'Numerical Skills'
        },
        {
          question: 'Which word is closest in meaning to "elaborate"?',
          options: ['Simple', 'Detailed', 'Quick', 'Basic'],
          correct: 'Detailed',
          explanation: 'Elaborate means to add more detail or information',
          category: 'Verbal Comprehension'
        },
        {
          question: 'If all roses are flowers and some flowers are red, which statement is definitely true?',
          options: ['All roses are red', 'Some roses are red', 'Some roses may be red', 'No roses are red'],
          correct: 'Some roses may be red',
          explanation: 'Logical deduction: We cannot conclude roses are definitely red, only that they might be',
          category: 'Logical Reasoning'
        }
      ];
      
      sampleCognitiveQuestions.forEach((q, index) => {
        checkAddPage(40);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Question ${index + 1} (${q.category}):`, margin, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        const questionLines = pdf.splitTextToSize(q.question, maxWidth - 10);
        pdf.text(questionLines, margin + 5, yPosition);
        yPosition += questionLines.length * 6 + 3;
        
        pdf.text('Options:', margin + 5, yPosition);
        yPosition += 6;
        q.options.forEach((option, i) => {
          const isCorrect = option === q.correct;
          if (isCorrect) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option} ✓ CORRECT`, margin + 10, yPosition);
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option}`, margin + 10, yPosition);
          }
          yPosition += 6;
        });
        
        yPosition += 3;
        pdf.setFont('helvetica', 'italic');
        pdf.text('Explanation:', margin + 5, yPosition);
        yPosition += 6;
        const explLines = pdf.splitTextToSize(q.explanation, maxWidth - 15);
        pdf.text(explLines, margin + 10, yPosition);
        yPosition += explLines.length * 6 + 10;
      });

      // Chapter 5: Emotional Intelligence Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. Emotional Intelligence Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Time Limit: 30 minutes | Questions: 25 | Scale: 1-5 points each', margin, yPosition);
      
      yPosition += 15;
      
      const eiDomains = [
        {
          name: 'Self-Awareness (6 questions)',
          description: 'Recognition of personal emotions, strengths, weaknesses, and values. Understanding how emotions affect thoughts and behavior.'
        },
        {
          name: 'Self-Management (6 questions)',
          description: 'Ability to regulate emotions, control impulses, and adapt to change. Managing stress and maintaining optimism under pressure.'
        },
        {
          name: 'Social Awareness (7 questions)',
          description: 'Understanding others\' emotions, organizational dynamics, and service orientation. Reading social cues and empathizing appropriately.'
        },
        {
          name: 'Relationship Management (6 questions)',
          description: 'Influencing, coaching, mentoring, and conflict resolution. Building rapport and managing relationships effectively.'
        }
      ];
      
      eiDomains.forEach(domain => {
        checkAddPage(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${domain.name}:`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(domain.description, maxWidth - 10);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 6 + 5;
      });

      // Chapter 6: Integrity Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. Integrity and Honesty Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Time Limit: 25 minutes | Questions: 20 | Context-Based Scoring', margin, yPosition);
      
      yPosition += 15;
      
      const integrityAreas = [
        {
          name: 'Honesty & Truthfulness (5 questions)',
          description: 'Commitment to truthful reporting, transparency in communication, and admitting mistakes. Measures reliability in information sharing.'
        },
        {
          name: 'Ethical Decision Making (5 questions)',
          description: 'Response to moral dilemmas, understanding of right and wrong, and commitment to ethical principles even under pressure.'
        },
        {
          name: 'Accountability & Responsibility (5 questions)',
          description: 'Taking ownership of actions, accepting consequences, and fulfilling commitments. Measures reliability and trustworthiness.'
        },
        {
          name: 'Workplace Pressure (5 questions)',
          description: 'Maintaining integrity when facing deadlines, targets, or peer pressure. Resistance to compromising ethics for short-term gains.'
        }
      ];
      
      integrityAreas.forEach(area => {
        checkAddPage(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${area.name}:`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(area.description, maxWidth - 10);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 6 + 5;
      });

      // Sample Integrity Questions with Correct Answers
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sample Integrity Questions with Correct Answers', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const sampleIntegrityQuestions = [
        {
          question: 'You accidentally damage a company laptop while working from home. No one saw it happen, and you could easily claim it was already broken when you received it. What do you do?',
          options: [
            'Report the damage immediately and offer to pay for repairs',
            'Try to fix it yourself first, then report if unsuccessful', 
            'Submit a support ticket claiming it was defective when received',
            'Wait to see if anyone notices before deciding what to do'
          ],
          correct: 0,
          explanation: 'Immediate honesty and accountability demonstrate integrity, even when no one is watching',
          category: 'Honesty & Truthfulness'
        },
        {
          question: 'You discover that a vendor your company works with has been overcharging for services by using inflated invoices. Your supervisor, who approved these invoices, asks you to keep this information confidential. You:',
          options: [
            'Report the issue to higher management or appropriate authorities',
            'Honor your supervisor\'s request but document everything',
            'Confront the vendor directly about the overcharging',
            'Discuss the situation with trusted colleagues first'
          ],
          correct: 0,
          explanation: 'Ethical obligation to the company supersedes loyalty to supervisor when fraud is involved',
          category: 'Ethical Decision Making'
        },
        {
          question: 'Your team misses an important deadline due to poor planning by the project manager. When senior management asks what happened, you:',
          options: [
            'Take partial responsibility as a team member while factually explaining the planning issues',
            'Clearly state that the project manager was responsible for planning',
            'Focus only on solutions for future projects',
            'Blame external factors that were beyond anyone\'s control'
          ],
          correct: 0,
          explanation: 'Balanced accountability shows maturity - taking team responsibility while being factual about causes',
          category: 'Accountability & Responsibility'
        }
      ];
      
      sampleIntegrityQuestions.forEach((q, index) => {
        checkAddPage(50);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Question ${index + 1} (${q.category}):`, margin, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        const questionLines = pdf.splitTextToSize(q.question, maxWidth - 10);
        pdf.text(questionLines, margin + 5, yPosition);
        yPosition += questionLines.length * 6 + 3;
        
        pdf.text('Options:', margin + 5, yPosition);
        yPosition += 6;
        q.options.forEach((option, i) => {
          const isCorrect = i === q.correct;
          if (isCorrect) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option} ✓ CORRECT`, margin + 10, yPosition);
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option}`, margin + 10, yPosition);
          }
          const optionLines = pdf.splitTextToSize(`${String.fromCharCode(65 + i)}. ${option}`, maxWidth - 20);
          yPosition += Math.max(6, optionLines.length * 6);
        });
        
        yPosition += 3;
        pdf.setFont('helvetica', 'italic');
        pdf.text('Explanation:', margin + 5, yPosition);
        yPosition += 6;
        const explLines = pdf.splitTextToSize(q.explanation, maxWidth - 15);
        pdf.text(explLines, margin + 10, yPosition);
        yPosition += explLines.length * 6 + 10;
      });

      // Chapter 7: Score Interpretation
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('7. Score Interpretation Guidelines', margin, yPosition);
      
      yPosition += 20;
      
      const scoreRanges = [
        { range: '90-100%', level: 'Exceptional', description: 'Outstanding performance, top tier candidate, immediate hire consideration' },
        { range: '80-89%', level: 'Excellent', description: 'Strong performance, well-suited for role, highly recommended' },
        { range: '70-79%', level: 'Good', description: 'Above average performance, suitable with proper onboarding and support' },
        { range: '60-69%', level: 'Acceptable', description: 'Meets minimum requirements, may need additional training or development' },
        { range: '50-59%', level: 'Below Average', description: 'Concerns about fit, requires careful consideration and additional assessment' },
        { range: '0-49%', level: 'Poor', description: 'Significant concerns, not recommended without extensive support and development' }
      ];
      
      scoreRanges.forEach(range => {
        checkAddPage(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${range.range} - ${range.level}:`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(range.description, maxWidth - 10);
        pdf.text(descLines, margin + 5, yPosition);
        yPosition += descLines.length * 6 + 8;
      });

      // Chapter 8: Detailed Scoring Examples
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('8. Detailed Scoring Examples', margin, yPosition);
      
      yPosition += 20;
      
      // Cognitive Test Scoring Example
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Example 1: Cognitive Aptitude Test Scoring', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Candidate: Sarah Johnson | Test: Cognitive Aptitude (15 questions)', margin, yPosition);
      
      yPosition += 10;
      const cognitiveScoring = [
        'Question 1: "What comes next: 2, 4, 8, 16, ?" - Answer: 32 ✓ CORRECT = 5 points',
        'Question 2: "15% of 240 = ?" - Answer: 42 ✗ INCORRECT (correct: 36) = 0 points', 
        'Question 3: "Elaborate means?" - Answer: Detailed ✓ CORRECT = 5 points',
        'Question 4: "All roses are flowers..." - Answer: Some roses may be red ✓ CORRECT = 5 points',
        '... (remaining 11 questions scored similarly)',
        '',
        'Final Score: 11 correct out of 15 questions',
        'Total Points: 11 × 5 = 55 points',
        'Maximum Possible: 15 × 5 = 75 points',
        'Percentage Score: (55/75) × 100 = 73%',
        '',
        'Category Breakdown:',
        '• Logical Reasoning: 4/6 correct = 67%',
        '• Numerical Skills: 3/5 correct = 60%', 
        '• Verbal Comprehension: 4/4 correct = 100%',
        '',
        'Interpretation: Good performance (70-79% range)',
        'Recommendation: Suitable for role with analytical components'
      ];
      
      cognitiveScoring.forEach(line => {
        checkAddPage();
        if (line === '') {
          yPosition += 4;
        } else {
          pdf.setFont(line.includes('✓') || line.includes('✗') ? 'helvetica' : 'helvetica', 'normal');
          if (line.includes('Final Score:') || line.includes('Category Breakdown:') || line.includes('Interpretation:')) {
            pdf.setFont('helvetica', 'bold');
          }
          const lineText = pdf.splitTextToSize(line, maxWidth - 10);
          pdf.text(lineText, margin + 5, yPosition);
          yPosition += lineText.length * 6;
        }
      });
      
      yPosition += 15;
      
      // Integrity Test Scoring Example
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Example 2: Integrity Assessment Scoring', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Candidate: Jennifer Lee | Test: Integrity & Honesty (20 questions)', margin, yPosition);
      
      yPosition += 10;
      const integrityScoring = [
        'Honesty & Truthfulness Category (5 questions):',
        'Q1: Laptop damage - Answer: A (Report immediately) ✓ CORRECT = 5 points',
        'Q2: Skill interview - Answer: A (Honestly state) ✓ CORRECT = 5 points',
        'Q3: Paycheck error - Answer: A (Report to HR) ✓ CORRECT = 5 points',
        'Q4: Cover for colleague - Answer: B (Refuse and explain) ✓ CORRECT = 5 points',
        'Q5: Report error - Answer: A (Inform supervisor) ✓ CORRECT = 5 points',
        'Category Score: 5/5 correct = 25 points = 100%',
        '',
        'Overall Test Results:',
        '• Honesty & Truthfulness: 5/5 = 100%',
        '• Ethical Decision Making: 5/5 = 100%',
        '• Accountability & Responsibility: 5/5 = 100%',
        '• Workplace Pressure: 5/5 = 100%',
        '',
        'Final Score: 20/20 correct = 100 points',
        'Percentage Score: 100%',
        '',
        'Interpretation: Exceptional integrity (90-100% range)',
        'Recommendation: Strong hire - Perfect ethical alignment'
      ];
      
      integrityScoring.forEach(line => {
        checkAddPage();
        if (line === '') {
          yPosition += 4;
        } else {
          pdf.setFont(line.includes('✓') ? 'helvetica' : 'helvetica', 'normal');
          if (line.includes('Category Score:') || line.includes('Overall Test') || line.includes('Final Score:') || line.includes('Interpretation:')) {
            pdf.setFont('helvetica', 'bold');
          }
          const lineText = pdf.splitTextToSize(line, maxWidth - 10);
          pdf.text(lineText, margin + 5, yPosition);
          yPosition += lineText.length * 6;
        }
      });

      // Chapter 9: Sample Results Case Studies
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('9. Sample Results and Case Studies', margin, yPosition);
      
      yPosition += 20;
      
      const sampleResults = [
        {
          candidate: 'Jennifer Lee - Integrity Assessment',
          score: '100% (20/20 correct)',
          analysis: 'Perfect score demonstrates exceptional ethical alignment and integrity. Shows consistent commitment to honesty and ethical decision-making across all scenarios. Highly recommended for positions requiring trust and ethical judgment.',
          recommendation: 'Strong hire - Excellent cultural fit'
        },
        {
          candidate: 'Michael Thompson - Emotional Intelligence',
          score: '32% (8/25 points)',
          analysis: 'Below average emotional intelligence with particular weaknesses in social awareness and relationship management. May struggle with team collaboration and customer interactions without development.',
          recommendation: 'Conditional hire with mandatory EI training'
        },
        {
          candidate: 'Robert Martinez - Integrity Assessment',
          score: '25% (5/20 correct)',
          analysis: 'Concerning pattern of responses indicating potential ethical risks. Poor judgment in workplace pressure scenarios and limited accountability awareness. Red flags for positions involving trust or financial responsibility.',
          recommendation: 'Not recommended - High ethical risk'
        }
      ];
      
      sampleResults.forEach(result => {
        checkAddPage(35);
        pdf.setFont('helvetica', 'bold');
        pdf.text(result.candidate, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Score: ${result.score}`, margin + 5, yPosition);
        yPosition += 10;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Analysis:', margin + 5, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        const analysisLines = pdf.splitTextToSize(result.analysis, maxWidth - 15);
        pdf.text(analysisLines, margin + 10, yPosition);
        yPosition += analysisLines.length * 6 + 5;
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendation:', margin + 5, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.text(result.recommendation, margin + 10, yPosition);
        yPosition += 15;
      });

      // Chapter 10: Hiring Recommendations
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('10. Hiring Recommendations Framework', margin, yPosition);
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const recommendationText = [
        'The system generates automated recommendations based on comprehensive analysis:',
        '',
        'HIGH PRIORITY ROLES (Leadership, Finance, Customer-Facing):',
        '• Require minimum 70% across all assessments',
        '• Integrity assessment must score 80% or higher',
        '• Emotional intelligence critical for customer roles',
        '',
        'TECHNICAL ROLES (IT, Engineering, Analysis):',
        '• Cognitive aptitude minimum 75%',
        '• Personality traits aligned with analytical work',
        '• Integrity standards maintained at 70%',
        '',
        'TEAM-BASED ROLES (Project Management, HR, Sales):',
        '• Emotional intelligence minimum 70%',
        '• Extraversion and agreeableness considered',
        '• Strong integrity for trusted positions',
        '',
        'RED FLAGS - Automatic Rejection Criteria:',
        '• Integrity assessment below 50%',
        '• Evidence of dishonesty or ethical concerns',
        '• Cognitive aptitude below role requirements',
        '• Extreme personality misalignment',
        '',
        'The system provides detailed rationale for each recommendation, enabling informed decision-making while maintaining consistency and fairness in the hiring process.'
      ];
      
      recommendationText.forEach(line => {
        checkAddPage();
        if (line === '') {
          yPosition += 6;
        } else {
          const wrappedLines = pdf.splitTextToSize(line, maxWidth);
          pdf.text(wrappedLines, margin, yPosition);
          yPosition += wrappedLines.length * 6;
        }
      });

      // Footer on last page
      pdf.addPage();
      yPosition = pageHeight - 40;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Meeting Matters Business Management System - Psychometric Assessment Guide', pageWidth / 2, yPosition, { align: 'center' });
      pdf.text(`Generated on ${currentDate}`, pageWidth / 2, yPosition + 8, { align: 'center' });

      // Save the PDF
      const filename = `Psychometric_Scoring_Guide_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: `Scoring guide PDF exported successfully as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating scoring guide PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate scoring guide PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Psychometric Scoring Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Download a comprehensive guide explaining how psychometric tests are scored and evaluated.</p>
            <p className="mt-2">
              <strong>Includes:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Detailed scoring methodology for each test type</li>
              <li>Category-based analysis explanations</li>
              <li>Score interpretation guidelines</li>
              <li>Sample results and case studies</li>
              <li>Hiring recommendation framework</li>
            </ul>
          </div>

          <Button 
            onClick={generateScoringGuidePDF}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Scoring Guide...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Scoring Guide PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}