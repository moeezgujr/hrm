import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function generatePsychometricPDF() {
  try {
    // Simulate the backend PDF data generation for attempt ID 22
    const attemptId = 22;
    
    // Mock the attempt data based on what we know
    const pdfData = {
      candidateName: "Kainat",
      candidateEmail: "Kainat@themeetingmatters.com",
      test: {
        testName: "16PF Complete Assessment (185 Questions)",
        testType: "personality_comprehensive",
        totalQuestions: 193,
        timeLimit: 60,
        description: "The original comprehensive 16PF assessment with 185 questions measuring 16 primary personality factors organized into 5 Global Factors: Extraversion, Anxiety, Tough-mindedness, Independence, and Self-Control."
      },
      attempt: {
        completedAt: new Date().toISOString(),
        timeSpent: 2340 // 39 minutes in seconds
      },
      overallScore: 6,
      detailedResults: {
        globalFactors: {
          'Extraversion': { score: 7, description: 'Introverted vs Extraverted' },
          'Anxiety': { score: 4, description: 'Low Anxiety vs High Anxiety' },
          'Tough-Mindedness': { score: 6, description: 'Receptive vs Tough-Minded' },
          'Independence': { score: 8, description: 'Accommodating vs Independent' },
          'Self-Control': { score: 5, description: 'Unrestrained vs Self-Controlled' }
        },
        primaryFactors: {
          'Warmth (A)': { score: 6, description: 'Reserved vs Warm' },
          'Reasoning (B)': { score: 7, description: 'Concrete vs Abstract' },
          'Emotional Stability (C)': { score: 8, description: 'Reactive vs Emotionally Stable' },
          'Dominance (E)': { score: 7, description: 'Deferential vs Dominant' },
          'Liveliness (F)': { score: 8, description: 'Serious vs Lively' },
          'Rule-Consciousness (G)': { score: 5, description: 'Expedient vs Rule-Conscious' },
          'Social Boldness (H)': { score: 9, description: 'Shy vs Socially Bold' },
          'Sensitivity (I)': { score: 4, description: 'Utilitarian vs Sensitive' },
          'Vigilance (L)': { score: 6, description: 'Trusting vs Vigilant' },
          'Abstractedness (M)': { score: 7, description: 'Grounded vs Abstracted' },
          'Privateness (N)': { score: 3, description: 'Forthright vs Private' },
          'Apprehension (O)': { score: 4, description: 'Self-Assured vs Apprehensive' },
          'Openness to Change (Q1)': { score: 8, description: 'Traditional vs Open to Change' },
          'Self-Reliance (Q2)': { score: 3, description: 'Group-Oriented vs Self-Reliant' },
          'Perfectionism (Q3)': { score: 6, description: 'Tolerates Disorder vs Perfectionist' },
          'Tension (Q4)': { score: 5, description: 'Relaxed vs Tense' }
        }
      },
      generatedDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
    
    // Save the data to a JSON file for the frontend to use
    fs.writeFileSync('psychometric_pdf_data.json', JSON.stringify(pdfData, null, 2));
    
    console.log('PDF data generated successfully!');
    console.log('File saved as: psychometric_pdf_data.json');
    
  } catch (error) {
    console.error('Error generating PDF data:', error);
  }
}

generatePsychometricPDF();