const fs = require('fs');
const { jsPDF } = require('jspdf');

// Read the markdown documentation
const markdownContent = fs.readFileSync('SYSTEM_DOCUMENTATION.md', 'utf8');

// Initialize PDF
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// PDF Configuration
const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const contentWidth = pageWidth - (margin * 2);
const lineHeight = 7;
let currentY = margin;

// Fonts and colors
doc.setFont('helvetica');

// Helper function to add a new page if needed
function checkPageBreak(height = lineHeight) {
  if (currentY + height > pageHeight - margin) {
    doc.addPage();
    currentY = margin;
  }
}

// Helper function to add text with word wrapping
function addWrappedText(text, fontSize = 10, isBold = false, isItalic = false) {
  doc.setFontSize(fontSize);
  
  if (isBold && isItalic) {
    doc.setFont('helvetica', 'bolditalic');
  } else if (isBold) {
    doc.setFont('helvetica', 'bold');
  } else if (isItalic) {
    doc.setFont('helvetica', 'italic');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  
  const lines = doc.splitTextToSize(text, contentWidth);
  
  for (let i = 0; i < lines.length; i++) {
    checkPageBreak();
    doc.text(lines[i], margin, currentY);
    currentY += lineHeight;
  }
}

// Helper function to add heading
function addHeading(text, level = 1) {
  currentY += 10; // Add space before heading
  checkPageBreak(15);
  
  let fontSize;
  switch (level) {
    case 1:
      fontSize = 18;
      break;
    case 2:
      fontSize = 16;
      break;
    case 3:
      fontSize = 14;
      break;
    default:
      fontSize = 12;
  }
  
  addWrappedText(text, fontSize, true);
  currentY += 5; // Add space after heading
}

// Helper function to add code block
function addCodeBlock(text) {
  currentY += 5;
  doc.setFillColor(245, 245, 245);
  const codeHeight = text.split('\n').length * lineHeight + 10;
  checkPageBreak(codeHeight);
  
  doc.rect(margin, currentY - 5, contentWidth, codeHeight, 'F');
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  
  const lines = text.split('\n');
  for (let line of lines) {
    checkPageBreak();
    doc.text(line, margin + 5, currentY);
    currentY += lineHeight;
  }
  
  currentY += 5;
  doc.setFont('helvetica', 'normal');
}

// Helper function to add bullet point
function addBulletPoint(text) {
  checkPageBreak();
  doc.text('•', margin + 5, currentY);
  
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, contentWidth - 10);
  
  for (let i = 0; i < lines.length; i++) {
    if (i === 0) {
      doc.text(lines[i], margin + 15, currentY);
    } else {
      checkPageBreak();
      doc.text(lines[i], margin + 15, currentY);
    }
    currentY += lineHeight;
  }
}

// Add cover page
addHeading('Meeting Matters', 1);
addHeading('Complete HR Management System', 2);
addHeading('Documentation', 2);

currentY += 30;
addWrappedText('A comprehensive HR Management System designed to streamline employee lifecycle management, featuring automated workflows, intelligent document management, and advanced analytics.', 12);

currentY += 20;
addWrappedText('Version: 1.0', 10);
addWrappedText('Date: August 11, 2025', 10);
addWrappedText('Document Type: Complete System Documentation', 10);

// Add new page for content
doc.addPage();
currentY = margin;

// Parse and convert markdown content
const lines = markdownContent.split('\n');
let inCodeBlock = false;
let codeBlockContent = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Handle code blocks
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      addCodeBlock(codeBlockContent);
      codeBlockContent = '';
      inCodeBlock = false;
    } else {
      inCodeBlock = true;
    }
    continue;
  }
  
  if (inCodeBlock) {
    codeBlockContent += line + '\n';
    continue;
  }
  
  // Handle headings
  if (line.startsWith('# ')) {
    addHeading(line.substring(2), 1);
  } else if (line.startsWith('## ')) {
    addHeading(line.substring(3), 2);
  } else if (line.startsWith('### ')) {
    addHeading(line.substring(4), 3);
  } else if (line.startsWith('#### ')) {
    addHeading(line.substring(5), 4);
  }
  // Handle bullet points
  else if (line.startsWith('- ')) {
    addBulletPoint(line.substring(2));
  }
  // Handle bold text patterns
  else if (line.includes('**') && line.trim() !== '') {
    // Simple bold text handling
    const text = line.replace(/\*\*(.*?)\*\*/g, '$1');
    addWrappedText(text, 10, true);
  }
  // Handle regular text
  else if (line.trim() !== '' && !line.startsWith('---')) {
    addWrappedText(line, 10);
  }
  // Handle empty lines
  else if (line.trim() === '') {
    currentY += 5;
  }
}

// Add footer to all pages
const totalPages = doc.internal.getNumberOfPages();
for (let i = 1; i <= totalPages; i++) {
  doc.setPage(i);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Meeting Matters HR System Documentation - Page ${i} of ${totalPages}`, margin, pageHeight - 10);
  doc.text('Confidential - Internal Use Only', pageWidth - margin - 50, pageHeight - 10);
}

// Save the PDF
doc.save('Meeting_Matters_System_Documentation.pdf');

console.log('PDF documentation generated successfully: Meeting_Matters_System_Documentation.pdf');