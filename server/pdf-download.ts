import express from 'express';
import path from 'path';
import fs from 'fs';

export function setupPDFDownload(app: express.Application) {
  // Serve the PDF file for download
  app.get('/download/subscription-model-pdf', (req, res) => {
    const pdfPath = path.join(process.cwd(), 'Meeting_Matters_Subscription_Model.pdf');
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Meeting_Matters_Subscription_Model.pdf"');
    
    // Send the file
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error sending PDF file:', err);
        res.status(500).json({ error: 'Failed to download PDF' });
      }
    });
  });

  // Serve the Product Profile PDF file for download
  app.get('/download/product-profile-pdf', (req, res) => {
    const pdfPath = path.join(process.cwd(), 'Meeting_Matters_Product_Profile.pdf');
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Product Profile PDF file not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Meeting_Matters_Product_Profile.pdf"');
    
    // Send the file
    res.sendFile(pdfPath, (err) => {
      if (err) {
        console.error('Error sending Product Profile PDF file:', err);
        res.status(500).json({ error: 'Failed to download Product Profile PDF' });
      }
    });
  });

  // Endpoint to check if PDF exists
  app.get('/api/pdf-status', (req, res) => {
    const pdfPath = path.join(process.cwd(), 'Meeting_Matters_Subscription_Model.pdf');
    const exists = fs.existsSync(pdfPath);
    
    if (exists) {
      const stats = fs.statSync(pdfPath);
      res.json({
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        downloadUrl: '/download/subscription-model-pdf'
      });
    } else {
      res.json({ exists: false });
    }
  });

  // Endpoint to check if Product Profile PDF exists
  app.get('/api/product-profile-pdf-status', (req, res) => {
    const pdfPath = path.join(process.cwd(), 'Meeting_Matters_Product_Profile.pdf');
    const exists = fs.existsSync(pdfPath);
    
    if (exists) {
      const stats = fs.statSync(pdfPath);
      res.json({
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        downloadUrl: '/download/product-profile-pdf'
      });
    } else {
      res.json({ exists: false });
    }
  });
}