import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Loader2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';

export function CompleteAnswerKeyPDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: tests = [] } = useQuery({
    queryKey: ['/api/psychometric-tests/export'],
  });

  const generateCompleteAnswerKeyPDF = async () => {
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
      pdf.text('Complete Answer Key', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      pdf.text('All Psychometric Test Questions with Correct Answers', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(12);
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 30;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Meeting Matters Business Management System', pageWidth / 2, yPosition, { align: 'center' });

      // Test 1: Big Five Personality Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Test 1: Big Five Personality Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('20 Questions | Scale-based (1-5 points) | Time: 25 minutes', margin, yPosition);
      
      yPosition += 15;
      pdf.setFont('helvetica', 'italic');
      pdf.text('Note: Personality questions use 1-5 scale scoring. No single "correct" answer.', margin, yPosition);
      pdf.text('Scores depend on trait being measured and reverse scoring for some items.', margin, yPosition + 6);
      
      yPosition += 20;

      const personalityQuestions = [
        { q: 'I am the life of the party.', category: 'Extraversion', scoring: 'Higher = More Extraverted' },
        { q: 'I feel little concern for others.', category: 'Agreeableness', scoring: 'Reverse scored (Lower = More Agreeable)' },
        { q: 'I am always prepared.', category: 'Conscientiousness', scoring: 'Higher = More Conscientious' },
        { q: 'I get stressed out easily.', category: 'Neuroticism', scoring: 'Higher = More Neurotic' },
        { q: 'I have a rich vocabulary.', category: 'Openness', scoring: 'Higher = More Open' },
        { q: 'I don\'t talk a lot.', category: 'Extraversion', scoring: 'Reverse scored (Lower = More Extraverted)' },
        { q: 'I am interested in people.', category: 'Agreeableness', scoring: 'Higher = More Agreeable' },
        { q: 'I leave my belongings around.', category: 'Conscientiousness', scoring: 'Reverse scored (Lower = More Conscientious)' },
        { q: 'I am relaxed most of the time.', category: 'Neuroticism', scoring: 'Reverse scored (Lower = More Neurotic)' },
        { q: 'I have difficulty understanding abstract ideas.', category: 'Openness', scoring: 'Reverse scored (Lower = More Open)' },
        { q: 'I feel comfortable around people.', category: 'Extraversion', scoring: 'Higher = More Extraverted' },
        { q: 'I insult people.', category: 'Agreeableness', scoring: 'Reverse scored (Lower = More Agreeable)' },
        { q: 'I pay attention to details.', category: 'Conscientiousness', scoring: 'Higher = More Conscientious' },
        { q: 'I worry about things.', category: 'Neuroticism', scoring: 'Higher = More Neurotic' },
        { q: 'I have a vivid imagination.', category: 'Openness', scoring: 'Higher = More Open' },
        { q: 'I keep in the background.', category: 'Extraversion', scoring: 'Reverse scored (Lower = More Extraverted)' },
        { q: 'I sympathize with others\' feelings.', category: 'Agreeableness', scoring: 'Higher = More Agreeable' },
        { q: 'I make a mess of things.', category: 'Conscientiousness', scoring: 'Reverse scored (Lower = More Conscientious)' },
        { q: 'I seldom feel blue.', category: 'Neuroticism', scoring: 'Reverse scored (Lower = More Neurotic)' },
        { q: 'I am not interested in abstract ideas.', category: 'Openness', scoring: 'Reverse scored (Lower = More Open)' }
      ];

      personalityQuestions.forEach((item, index) => {
        checkAddPage(15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${item.q}`, margin, yPosition);
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Category: ${item.category}`, margin + 5, yPosition);
        yPosition += 6;
        pdf.text(`Scoring: ${item.scoring}`, margin + 5, yPosition);
        yPosition += 10;
      });

      // Test 2: Cognitive Aptitude Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Test 2: Cognitive Aptitude Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('15 Questions | Multiple Choice (5 or 0 points) | Time: 20 minutes', margin, yPosition);
      
      yPosition += 20;

      const cognitiveQuestions = [
        {
          q: 'What comes next in the sequence: 2, 4, 8, 16, ?',
          options: ['16', '24', '32', '48'],
          correct: '32',
          category: 'Logical Reasoning'
        },
        {
          q: 'If all roses are flowers and some flowers are red, which statement is definitely true?',
          options: ['All roses are red', 'Some roses are red', 'Some roses may be red', 'No roses are red'],
          correct: 'Some roses may be red',
          category: 'Logical Reasoning'
        },
        {
          q: 'Calculate: 15% of 240',
          options: ['30', '36', '42', '48'],
          correct: '36',
          category: 'Numerical Skills'
        },
        {
          q: 'Which word is closest in meaning to "elaborate"?',
          options: ['Simple', 'Detailed', 'Quick', 'Basic'],
          correct: 'Detailed',
          category: 'Verbal Comprehension'
        },
        {
          q: 'A train travels 120 miles in 2 hours. What is its average speed?',
          options: ['50 mph', '55 mph', '60 mph', '65 mph'],
          correct: '60 mph',
          category: 'Numerical Skills'
        },
        {
          q: 'Complete the analogy: Book is to Reading as Fork is to ?',
          options: ['Kitchen', 'Eating', 'Metal', 'Tool'],
          correct: 'Eating',
          category: 'Logical Reasoning'
        },
        {
          q: 'Which number should replace the question mark: 3, 9, 27, ?',
          options: ['54', '72', '81', '108'],
          correct: '81',
          category: 'Logical Reasoning'
        },
        {
          q: 'What is the opposite of "optimistic"?',
          options: ['Happy', 'Pessimistic', 'Realistic', 'Confident'],
          correct: 'Pessimistic',
          category: 'Verbal Comprehension'
        },
        {
          q: 'If 5x + 3 = 23, what is the value of x?',
          options: ['3', '4', '5', '6'],
          correct: '4',
          category: 'Numerical Skills'
        },
        {
          q: 'Which of these is NOT a characteristic of good leadership?',
          options: ['Vision', 'Empathy', 'Micromanagement', 'Communication'],
          correct: 'Micromanagement',
          category: 'Logical Reasoning'
        },
        {
          q: 'Complete the pattern: Circle, Square, Triangle, Circle, Square, ?',
          options: ['Circle', 'Square', 'Triangle', 'Rectangle'],
          correct: 'Triangle',
          category: 'Logical Reasoning'
        },
        {
          q: 'What percentage is 1/8?',
          options: ['10.5%', '12.5%', '15%', '16.5%'],
          correct: '12.5%',
          category: 'Numerical Skills'
        },
        {
          q: 'Which word best completes the sentence: "The scientist\'s hypothesis was _____ by the experimental results."',
          options: ['confirmed', 'denied', 'ignored', 'questioned'],
          correct: 'confirmed',
          category: 'Verbal Comprehension'
        },
        {
          q: 'If you rearrange the letters in "LISTEN", which word can you make?',
          options: ['SILENT', 'TENDER', 'SOFTLY', 'GENTLE'],
          correct: 'SILENT',
          category: 'Verbal Comprehension'
        },
        {
          q: 'What is the next number in the sequence: 1, 1, 2, 3, 5, 8, ?',
          options: ['11', '12', '13', '15'],
          correct: '13',
          category: 'Logical Reasoning'
        }
      ];

      cognitiveQuestions.forEach((item, index) => {
        checkAddPage(25);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${item.q}`, margin, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text('Options:', margin + 5, yPosition);
        yPosition += 6;
        
        item.options.forEach((option, i) => {
          const isCorrect = option === item.correct;
          if (isCorrect) {
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option} ✓ CORRECT`, margin + 10, yPosition);
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${String.fromCharCode(65 + i)}. ${option}`, margin + 10, yPosition);
          }
          yPosition += 6;
        });
        
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Category: ${item.category}`, margin + 5, yPosition);
        yPosition += 10;
      });

      // Test 3: Emotional Intelligence Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Test 3: Emotional Intelligence Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('25 Questions | Scale-based (1-5 points) | Time: 30 minutes', margin, yPosition);
      
      yPosition += 15;
      pdf.setFont('helvetica', 'italic');
      pdf.text('Note: EI questions use scenario-based 1-5 scale scoring.', margin, yPosition);
      pdf.text('Higher scores indicate better emotional intelligence in each domain.', margin, yPosition + 6);
      
      yPosition += 20;

      const eiCategories = [
        {
          name: 'Self-Awareness',
          questions: [
            'I can accurately identify my emotions as they occur.',
            'I understand what triggers my emotional reactions.',
            'I am aware of how my emotions affect my behavior.',
            'I can recognize my emotional patterns over time.',
            'I understand my emotional strengths and weaknesses.',
            'I am conscious of my emotional state during interactions.'
          ]
        },
        {
          name: 'Self-Management',
          questions: [
            'I can control my emotions when under pressure.',
            'I manage my stress effectively in challenging situations.',
            'I can calm myself down when I become upset.',
            'I adapt well to change and uncertainty.',
            'I can delay gratification when necessary.',
            'I maintain optimism even during difficult times.'
          ]
        },
        {
          name: 'Social Awareness',
          questions: [
            'I can accurately read other people\'s emotions.',
            'I notice non-verbal cues and body language.',
            'I understand the emotional dynamics in group settings.',
            'I can sense when someone is upset or uncomfortable.',
            'I pick up on subtle changes in people\'s moods.',
            'I understand how my actions affect others emotionally.',
            'I can anticipate how others might react emotionally.'
          ]
        },
        {
          name: 'Relationship Management',
          questions: [
            'I can effectively resolve conflicts with others.',
            'I provide emotional support to colleagues when needed.',
            'I can influence others\' emotions in positive ways.',
            'I build rapport easily with new people.',
            'I can manage difficult conversations diplomatically.',
            'I help create a positive emotional climate in teams.'
          ]
        }
      ];

      let questionNumber = 1;
      eiCategories.forEach(category => {
        checkAddPage(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${category.name} Questions:`, margin, yPosition);
        yPosition += 10;
        
        category.questions.forEach(question => {
          checkAddPage(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`${questionNumber}. ${question}`, margin + 5, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'italic');
          pdf.text('Scale: 1=Never, 2=Rarely, 3=Sometimes, 4=Often, 5=Always', margin + 10, yPosition);
          pdf.text('Scoring: Higher scores = Better EI in this domain', margin + 10, yPosition + 5);
          yPosition += 15;
          questionNumber++;
        });
        yPosition += 5;
      });

      // Test 4: Integrity and Honesty Assessment
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Test 4: Integrity and Honesty Assessment', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('20 Questions | Multiple Choice (5 or 0 points) | Time: 25 minutes', margin, yPosition);
      
      yPosition += 20;

      const integrityQuestions = [
        {
          q: 'You accidentally damage a company laptop while working from home. No one saw it happen, and you could easily claim it was already broken when you received it. What do you do?',
          options: [
            'Report the damage immediately and offer to pay for repairs',
            'Try to fix it yourself first, then report if unsuccessful',
            'Submit a support ticket claiming it was defective when received',
            'Wait to see if anyone notices before deciding what to do'
          ],
          correct: 0,
          category: 'Honesty & Truthfulness'
        },
        {
          q: 'During an interview for a position you really want, you\'re asked about a skill you don\'t have but could learn quickly. You:',
          options: [
            'Honestly state you don\'t have the skill but are eager to learn',
            'Claim you have basic knowledge and hope to figure it out later',
            'Exaggerate your experience to increase your chances',
            'Redirect the conversation to skills you do have'
          ],
          correct: 0,
          category: 'Honesty & Truthfulness'
        },
        {
          q: 'You notice an error in your favor on your paycheck - you\'ve been overpaid by $200. You:',
          options: [
            'Report it to HR immediately',
            'Wait a few pay periods to see if they notice',
            'Keep quiet since it\'s their mistake',
            'Mention it casually to your supervisor without formally reporting it'
          ],
          correct: 0,
          category: 'Honesty & Truthfulness'
        },
        {
          q: 'A colleague asks you to cover for them by saying they were in a meeting when they were actually running personal errands. You:',
          options: [
            'Agree to help them this one time',
            'Refuse and explain why you can\'t lie for them',
            'Suggest they speak with their supervisor directly',
            'Agree but ask them not to put you in this position again'
          ],
          correct: 1,
          category: 'Honesty & Truthfulness'
        },
        {
          q: 'You realize you made a significant error in a report that has already been submitted to senior management. The deadline has passed and acknowledging the mistake might delay an important project. You:',
          options: [
            'Immediately inform your supervisor about the error',
            'Try to quietly fix it in the next version without mentioning the mistake',
            'Hope no one notices and deals with it only if questioned',
            'Wait to see if the error causes any actual problems before acting'
          ],
          correct: 0,
          category: 'Honesty & Truthfulness'
        },
        {
          q: 'You discover that a vendor your company works with has been overcharging for services by using inflated invoices. Your supervisor, who approved these invoices, asks you to keep this information confidential. You:',
          options: [
            'Report the issue to higher management or appropriate authorities',
            'Honor your supervisor\'s request but document everything',
            'Confront the vendor directly about the overcharging',
            'Discuss the situation with trusted colleagues first'
          ],
          correct: 0,
          category: 'Ethical Decision Making'
        },
        {
          q: 'You\'re offered a substantial discount on a personal purchase from a supplier your company does business with. The supplier mentions it\'s a "thank you" for your company\'s continued partnership. You:',
          options: [
            'Accept the discount since it benefits both parties',
            'Politely decline and explain your company\'s conflict of interest policy',
            'Accept but report it to your supervisor for transparency',
            'Ask your supervisor for permission before accepting'
          ],
          correct: 1,
          category: 'Ethical Decision Making'
        },
        {
          q: 'During a team meeting, you witness a colleague taking credit for work you know was done by someone else who isn\'t present. You:',
          options: [
            'Speak up immediately to correct the record',
            'Approach the colleague privately after the meeting',
            'Inform the person whose work was taken about what happened',
            'Stay silent to avoid workplace conflict'
          ],
          correct: 0,
          category: 'Ethical Decision Making'
        },
        {
          q: 'You learn that your company is about to lay off several employees, including a close friend. Your friend is about to make a major financial commitment (buying a house). You:',
          options: [
            'Warn your friend subtly without revealing confidential information',
            'Respect the confidentiality and say nothing',
            'Suggest your friend postpone major financial decisions without explaining why',
            'Tell your friend directly about the upcoming layoffs'
          ],
          correct: 1,
          category: 'Ethical Decision Making'
        },
        {
          q: 'You\'re asked to participate in a hiring process, and one candidate is the child of a senior executive. This candidate is qualified but not the strongest applicant. You:',
          options: [
            'Recommend them to maintain good relationships with leadership',
            'Evaluate them purely on merit regardless of their connections',
            'Recuse yourself from the decision due to potential bias',
            'Give them slightly more favorable consideration due to their potential'
          ],
          correct: 1,
          category: 'Ethical Decision Making'
        },
        {
          q: 'Your team misses an important deadline due to poor planning by the project manager. When senior management asks what happened, you:',
          options: [
            'Take partial responsibility as a team member while factually explaining the planning issues',
            'Clearly state that the project manager was responsible for planning',
            'Focus only on solutions for future projects',
            'Blame external factors that were beyond anyone\'s control'
          ],
          correct: 0,
          category: 'Accountability & Responsibility'
        },
        {
          q: 'You promised a client you would deliver something by Friday, but unexpected complications arise that will delay completion until Monday. It\'s Thursday afternoon. You:',
          options: [
            'Call the client immediately to explain the situation and apologize',
            'Work through the weekend to try to meet the original deadline',
            'Wait until Friday to inform them since you might still finish on time',
            'Have someone else contact the client to deliver the news'
          ],
          correct: 0,
          category: 'Accountability & Responsibility'
        },
        {
          q: 'During a project review, you realize you misunderstood a key requirement early on, leading to work that needs to be redone. You:',
          options: [
            'Take responsibility and present a clear plan to correct the work',
            'Explain that the requirements weren\'t clearly communicated',
            'Suggest that others also misunderstood the requirements',
            'Focus on how the team can prevent this in the future'
          ],
          correct: 0,
          category: 'Accountability & Responsibility'
        },
        {
          q: 'A customer complains about poor service they received from your department. You weren\'t directly involved, but you\'re the one taking the call. You:',
          options: [
            'Apologize on behalf of the company and work to resolve their issue',
            'Explain that you weren\'t responsible and transfer them to the right person',
            'Take down their information and promise someone will call them back',
            'Listen to their complaint but explain why the service issue likely occurred'
          ],
          correct: 0,
          category: 'Accountability & Responsibility'
        },
        {
          q: 'You\'re part of a team presentation that goes poorly due to technical difficulties you were responsible for checking. Afterward, you:',
          options: [
            'Acknowledge your role in the technical issues and apologize to the team',
            'Point out that everyone could have helped check the technology',
            'Focus on what went well in the presentation',
            'Suggest that the venue should have better technical support'
          ],
          correct: 0,
          category: 'Accountability & Responsibility'
        },
        {
          q: 'Your supervisor pressures you to inflate numbers in a report to make your department look better for an upcoming budget review. You:',
          options: [
            'Refuse and explain the importance of accurate reporting',
            'Make minor adjustments that seem reasonable',
            'Comply this time but express your discomfort',
            'Ask to be removed from working on this report'
          ],
          correct: 0,
          category: 'Workplace Pressure'
        },
        {
          q: 'You\'re running late for an important meeting and see a parking spot clearly marked "Reserved for Executives." You:',
          options: [
            'Park there briefly since you\'ll only be a few minutes',
            'Look for another spot even if it makes you later',
            'Park there but leave a note explaining the emergency',
            'Ask security if you can use the spot temporarily'
          ],
          correct: 1,
          category: 'Workplace Pressure'
        },
        {
          q: 'A potential client offers your company a large contract but mentions they expect certain "entertainment expenses" that seem inappropriate and possibly unethical. You:',
          options: [
            'Report this to your supervisor and legal department immediately',
            'Try to redirect the conversation to legitimate business entertainment',
            'Politely decline the contract opportunity',
            'Ask for clarification about what they mean by entertainment expenses'
          ],
          correct: 0,
          category: 'Workplace Pressure'
        },
        {
          q: 'You discover that a coworker has been padding their expense reports with personal items. They ask you not to say anything, promising they\'ll stop. You:',
          options: [
            'Give them a chance to self-report before taking further action',
            'Report it immediately to prevent further violations',
            'Warn them that you\'ll report it if it continues',
            'Mind your own business since it doesn\'t directly affect you'
          ],
          correct: 1,
          category: 'Workplace Pressure'
        },
        {
          q: 'Your company\'s biggest client asks you to rush an order by cutting some standard quality checks. They emphasize how important this rush order is for future business. You:',
          options: [
            'Explain why quality checks are necessary and offer alternative solutions',
            'Comply with their request to maintain the relationship',
            'Agree but document that quality checks were skipped at their request',
            'Escalate the decision to senior management'
          ],
          correct: 0,
          category: 'Workplace Pressure'
        }
      ];
      integrityQuestions.forEach((item, index) => {
        checkAddPage(35);
        pdf.setFont('helvetica', 'bold');
        const questionLines = pdf.splitTextToSize(`${index + 1}. ${item.q}`, maxWidth - 10);
        pdf.text(questionLines, margin, yPosition);
        yPosition += questionLines.length * 6 + 3;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text('Options:', margin + 5, yPosition);
        yPosition += 6;
        
        item.options.forEach((option, i) => {
          const isCorrect = i === item.correct;
          if (isCorrect) {
            pdf.setFont('helvetica', 'bold');
            const optionLines = pdf.splitTextToSize(`${String.fromCharCode(65 + i)}. ${option} ✓ CORRECT`, maxWidth - 20);
            pdf.text(optionLines, margin + 10, yPosition);
            yPosition += optionLines.length * 6;
          } else {
            pdf.setFont('helvetica', 'normal');
            const optionLines = pdf.splitTextToSize(`${String.fromCharCode(65 + i)}. ${option}`, maxWidth - 20);
            pdf.text(optionLines, margin + 10, yPosition);
            yPosition += optionLines.length * 6;
          }
        });
        
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Category: ${item.category}`, margin + 5, yPosition);
        yPosition += 15;
      });

      // Save the PDF
      const filename = `Complete_Answer_Key_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: `Complete answer key PDF exported successfully as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating complete answer key PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate complete answer key PDF. Please try again.",
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
          <Key className="mr-2 h-5 w-5" />
          Complete Answer Key
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Download the complete answer key for all psychometric tests with every question and correct answer.</p>
            <p className="mt-2">
              <strong>Includes:</strong>
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>All 80 questions from 4 psychometric tests</li>
              <li>Correct answers clearly marked</li>
              <li>Scoring explanations for each question type</li>
              <li>Category breakdowns and trait explanations</li>
              <li>Professional formatting for easy reference</li>
            </ul>
          </div>

          <Button 
            onClick={generateCompleteAnswerKeyPDF}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Complete Answer Key...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Complete Answer Key PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}