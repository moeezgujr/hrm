import fs from 'fs';
import { execSync } from 'child_process';

// Load the PDF data
const pdfData = JSON.parse(fs.readFileSync('psychometric_pdf_data.json', 'utf8'));

// Create comprehensive HTML report
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>16PF Comprehensive Assessment Report</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            color: #333;
        }
        
        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            text-align: center;
            page-break-after: always;
        }
        
        .cover-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        
        .cover-subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .candidate-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 10px;
            margin: 2rem 0;
        }
        
        .candidate-name {
            font-size: 2rem;
            font-weight: bold;
        }
        
        .company-info {
            margin-top: 2rem;
            opacity: 0.8;
        }
        
        .confidential {
            position: absolute;
            bottom: 2rem;
            color: #ef4444;
            font-weight: bold;
        }
        
        .content-page {
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .page-title {
            font-size: 2.5rem;
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 0.5rem;
            margin-bottom: 2rem;
        }
        
        .section-title {
            font-size: 1.8rem;
            color: #2563eb;
            margin: 2rem 0 1rem 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .info-item {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 5px;
        }
        
        .score-highlight {
            font-size: 2rem;
            color: #10b981;
            font-weight: bold;
            text-align: center;
            background: #ecfdf5;
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        
        .factor-item {
            background: #f8fafc;
            margin: 1rem 0;
            padding: 1.5rem;
            border-radius: 10px;
            border-left: 4px solid #2563eb;
        }
        
        .factor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .factor-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2563eb;
        }
        
        .factor-score {
            font-size: 1.5rem;
            font-weight: bold;
            color: #10b981;
        }
        
        .factor-description {
            color: #6b7280;
            margin-bottom: 0.5rem;
        }
        
        .factor-interpretation {
            font-size: 0.9rem;
            color: #4b5563;
            background: #fff;
            padding: 0.5rem;
            border-radius: 5px;
        }
        
        .global-factor {
            border-left-color: #7c3aed;
        }
        
        .interpretation-section {
            background: #f0f9ff;
            padding: 1.5rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        
        .interpretation-title {
            font-size: 1.3rem;
            color: #0369a1;
            margin-bottom: 1rem;
        }
        
        .bullet-list {
            margin: 0.5rem 0;
        }
        
        .bullet-list li {
            margin: 0.3rem 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            position: fixed;
            bottom: 1rem;
            width: 100%;
            text-align: center;
            font-size: 0.8rem;
            color: #9ca3af;
        }
        
        @media print {
            .cover-page {
                height: 100vh;
            }
        }
    </style>
</head>
<body>

<!-- Cover Page -->
<div class="cover-page">
    <div class="cover-title">Comprehensive Psychometric<br>Assessment Report</div>
    <div class="cover-subtitle">16PF Personality Factor Analysis</div>
    
    <div class="candidate-box">
        <div class="candidate-name">${pdfData.candidateName}</div>
    </div>
    
    <div class="company-info">
        <div>Meeting Matters HR Management System</div>
        <div>Generated on ${pdfData.generatedDate}</div>
    </div>
    
    <div class="confidential">CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY</div>
</div>

<!-- Executive Summary Page -->
<div class="content-page page-break">
    <h1 class="page-title">Executive Summary</h1>
    
    <div class="info-grid">
        <div class="info-item">
            <strong>Candidate:</strong> ${pdfData.candidateName}
        </div>
        <div class="info-item">
            <strong>Email:</strong> ${pdfData.candidateEmail}
        </div>
        <div class="info-item">
            <strong>Assessment:</strong> ${pdfData.test.testName}
        </div>
        <div class="info-item">
            <strong>Completed:</strong> ${new Date(pdfData.attempt.completedAt).toLocaleDateString()}
        </div>
        <div class="info-item">
            <strong>Time Spent:</strong> ${Math.round(pdfData.attempt.timeSpent / 60)} minutes
        </div>
        <div class="info-item">
            <strong>Total Questions:</strong> ${pdfData.test.totalQuestions}
        </div>
    </div>
    
    <div class="score-highlight">
        Overall Personality Score: ${pdfData.overallScore}/10
    </div>
    
    <h2 class="section-title">Assessment Overview</h2>
    <p>This comprehensive 16PF assessment measures 16 primary personality factors that combine into 5 Global Factors. The results provide insights into personality structure and behavioral predictions for workplace effectiveness.</p>
    
    <h2 class="section-title">Global Factors Summary</h2>
    ${Object.entries(pdfData.detailedResults.globalFactors).map(([name, factor]) => `
        <div class="factor-item global-factor">
            <div class="factor-header">
                <div class="factor-name">${name}</div>
                <div class="factor-score">${factor.score}/10</div>
            </div>
            <div class="factor-description">${factor.description}</div>
        </div>
    `).join('')}
</div>

<!-- Primary Factors Page -->
<div class="content-page page-break">
    <h1 class="page-title">16 Primary Personality Factors</h1>
    <p style="color: #6b7280; margin-bottom: 2rem;">Detailed breakdown of individual personality dimensions</p>
    
    ${Object.entries(pdfData.detailedResults.primaryFactors).map(([name, factor], index) => {
        let interpretation = '';
        if (factor.score <= 3) interpretation = 'Lower tendency - may be more reserved in this trait';
        else if (factor.score <= 6) interpretation = 'Moderate expression - balanced approach to this trait';
        else interpretation = 'Higher tendency - strong expression of this trait';
        
        return `
        <div class="factor-item">
            <div class="factor-header">
                <div class="factor-name">${index + 1}. ${name}</div>
                <div class="factor-score">${factor.score}/10</div>
            </div>
            <div class="factor-description">${factor.description}</div>
            <div class="factor-interpretation">${interpretation}</div>
        </div>
        `;
    }).join('')}
</div>

<!-- Interpretation Guide Page -->
<div class="content-page page-break">
    <h1 class="page-title">Understanding Your Results</h1>
    
    <div class="interpretation-section">
        <div class="interpretation-title">Scoring System</div>
        <p>All scores are presented on a 1-10 scale:</p>
        <ul class="bullet-list">
            <li>1-3: Lower tendency toward this trait</li>
            <li>4-6: Moderate/balanced expression</li>
            <li>7-10: Higher tendency toward this trait</li>
        </ul>
    </div>
    
    <div class="interpretation-section">
        <div class="interpretation-title">Global Factors</div>
        <p>The 16 primary factors combine into 5 Global Factors:</p>
        <ul class="bullet-list">
            <li><strong>Extraversion:</strong> Social orientation and assertiveness</li>
            <li><strong>Anxiety:</strong> Emotional stability and stress response</li>
            <li><strong>Tough-mindedness:</strong> Practical vs sensitive approach</li>
            <li><strong>Independence:</strong> Self-reliance and leadership</li>
            <li><strong>Self-Control:</strong> Discipline and organization</li>
        </ul>
    </div>
    
    <div class="interpretation-section">
        <div class="interpretation-title">Workplace Applications</div>
        <p>These results help identify:</p>
        <ul class="bullet-list">
            <li>Suitable roles and responsibilities</li>
            <li>Team dynamics and collaboration style</li>
            <li>Leadership potential and preferences</li>
            <li>Communication and work preferences</li>
            <li>Areas for development and growth</li>
        </ul>
    </div>
    
    <div class="interpretation-section">
        <div class="interpretation-title">Important Notes</div>
        <p>Remember:</p>
        <ul class="bullet-list">
            <li>There are no right or wrong scores</li>
            <li>Each personality type brings unique strengths</li>
            <li>Results should be considered alongside other factors</li>
            <li>This assessment is one tool in the evaluation process</li>
        </ul>
    </div>
</div>

<div class="footer">
    Meeting Matters HR - Confidential Assessment Report
</div>

</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('psychometric_report.html', htmlContent);

console.log('Comprehensive HTML report generated: psychometric_report.html');
console.log('');
console.log('📄 Report Contents:');
console.log('✅ Professional cover page with candidate name and branding');
console.log('✅ Executive summary with key details and overall score');
console.log('✅ 5 Global Factors analysis (Extraversion, Anxiety, Tough-mindedness, Independence, Self-Control)');
console.log('✅ Complete 16 Primary Personality Factors breakdown');
console.log('✅ Detailed scoring interpretations and workplace applications');
console.log('✅ Professional styling with Meeting Matters branding');
console.log('');
console.log('The HTML file is ready for viewing or conversion to PDF.');